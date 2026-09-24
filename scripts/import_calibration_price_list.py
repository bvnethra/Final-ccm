import os
import re
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET

# Load environment from .env.local or .env
env_vars = {}
for env_file in ['.env.local', '.env']:
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k not in env_vars:
                    env_vars[k] = v

project_ref = env_vars.get('SUPABASE_PROJECT_REF') or os.environ.get('SUPABASE_PROJECT_REF')
if not project_ref and 'VITE_SUPABASE_URL' in env_vars:
    url_match = re.search(r'https?://([^.]+)\.supabase\.co', env_vars['VITE_SUPABASE_URL'])
    if url_match:
        project_ref = url_match.group(1)

token = env_vars.get('SUPABASE_ACCESS_TOKEN') or os.environ.get('SUPABASE_ACCESS_TOKEN')

if not project_ref or not token:
    raise ValueError("Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in .env.local or environment.")

def run_sql(query):
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    req = urllib.request.Request(
        url,
        data=json.dumps({"query": query}).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# Dynamically fetch active tenant and organization from DB (Zero hardcoding)
tenants_data = run_sql("SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1;")
if not tenants_data:
    raise ValueError("No active tenant found in database.")
tenant_id = tenants_data[0]['id']

orgs_data = run_sql(f"SELECT id FROM organizations WHERE tenant_id = '{tenant_id}' ORDER BY created_at ASC LIMIT 1;")
organization_id = orgs_data[0]['id'] if orgs_data else None

excel_path = os.path.join(os.path.dirname(__file__), '..', 'excel', 'Calibration Price List.xlsx')

print(f"Reading Excel: {excel_path}")
with zipfile.ZipFile(excel_path, 'r') as z:
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        with z.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            sst = [elem.text or '' for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
            
    with z.open('xl/worksheets/sheet1.xml') as f:
        tree = ET.parse(f)
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows = tree.findall('.//s:row', ns)
        
        raw_items = []
        current_instrument = ""
        
        for idx, r in enumerate(rows):
            if idx == 0:
                continue  # Skip header row
            cells = {}
            for c in r.findall('s:c', ns):
                cell_ref = c.get('r', '')
                col_letter = ''.join([ch for ch in cell_ref if ch.isalpha()])
                t = c.get('t')
                v = c.find('s:v', ns)
                val = v.text if v is not None else ''
                if t == 's' and val:
                    val = sst[int(val)]
                cells[col_letter] = val.strip()
            
            s_no = cells.get('A', '')
            inst_name = cells.get('B', '')
            range_val = cells.get('C', '')
            rate_val = cells.get('D', '')
            
            if not s_no and not inst_name and not range_val and not rate_val:
                continue
                
            if inst_name:
                current_instrument = inst_name.strip()
                
            # Clean numeric rate
            rate_part = rate_val.split('/')[0]
            rate_clean = re.sub(r'[^0-9.]', '', rate_part)
            standard_cost = float(rate_clean) if rate_clean else 0.0
            
            # Extract least count if annotated in range
            lc_match = re.search(r'lease?\s*-\s*([0-9.]+)\s*mm', range_val, re.IGNORECASE)
            least_count = f"{lc_match.group(1)} mm" if lc_match else "0.01 mm"
            
            # Clean range string
            clean_range = re.sub(r'\s*\(\s*lease?.*?\)', '', range_val, flags=re.IGNORECASE).strip()
            clean_range = re.sub(r'\s*\(1set\s*\)', '', clean_range, flags=re.IGNORECASE).strip()
            if not clean_range:
                clean_range = "Standard Range"
                
            full_item_name = f"{current_instrument} ({clean_range})" if clean_range != "Standard Range" else current_instrument
            
            raw_items.append({
                'orig_idx': idx,
                'instrument': current_instrument,
                'item_name': full_item_name,
                'item_type': 'EQUIPMENT',
                'category': 'Dimensional Metrology',
                'measurement_range': clean_range,
                'least_count': least_count,
                'standard_cost': standard_cost,
                'calibration_frequency': 365,
                'status': 'ACTIVE'
            })

# Sort items alphabetically by instrument name, maintaining logical range order
raw_items.sort(key=lambda x: (x['instrument'].upper(), x['orig_idx']))

# Assign capitalized sequential item codes TCC-MAS-001 to 999
parsed_items = []
for i, item in enumerate(raw_items):
    seq_str = f"{i + 1:03d}"
    item['item_code'] = f"TCC-MAS-{seq_str}"
    parsed_items.append(item)

print(f"Extracted and alphabetically sorted {len(parsed_items)} items from Excel.")

# Delete previous Tcc-mas-% records to allow clean sorted replacement
delete_res = run_sql(f"DELETE FROM item_masters WHERE tenant_id = '{tenant_id}' AND item_code ILIKE 'Tcc-mas-%';")
print("Cleared previous unsorted items from DB:", delete_res)

values_to_insert = []
for item in parsed_items:
    escaped_name = item['item_name'].replace("'", "''")
    escaped_range = item['measurement_range'].replace("'", "''")
    escaped_lc = item['least_count'].replace("'", "''")
    
    val = (
        f"(gen_random_uuid(), '{tenant_id}', '{organization_id}', '{item['item_code']}', "
        f"'{escaped_name}', '{item['item_type']}', '{escaped_range}', '{escaped_lc}', "
        f"{item['standard_cost']}, {item['calibration_frequency']}, '{item['status']}', NOW(), NOW())"
    )
    values_to_insert.append(val)

if values_to_insert:
    chunk_size = 50
    inserted_total = 0
    for i in range(0, len(values_to_insert), chunk_size):
        chunk = values_to_insert[i:i + chunk_size]
        query = f"""
        INSERT INTO item_masters (
            id, tenant_id, organization_id, item_code,
            item_name, item_type, measurement_range, least_count,
            standard_cost, calibration_frequency, status, created_at, updated_at
        ) VALUES {', '.join(chunk)};
        """
        run_sql(query)
        inserted_total += len(chunk)
        print(f"Inserted batch {i // chunk_size + 1}: {len(chunk)} items (Total so far: {inserted_total})")
    print(f"Successfully inserted {inserted_total} alphabetically sorted items into item_masters.")

# Verify final count and sample records
final_check = run_sql(f"SELECT count(*) as total FROM item_masters WHERE tenant_id = '{tenant_id}';")
print("Total Item Masters in DB now:", final_check)

sample = run_sql(f"SELECT item_code, item_name, measurement_range, least_count, standard_cost FROM item_masters WHERE tenant_id = '{tenant_id}' ORDER BY item_code ASC LIMIT 10;")
print("\nFirst 10 items (Alphabetical):")
for s in sample:
    print(f"  {s['item_code']}: {s['item_name']} | Range: {s['measurement_range']} | LC: {s['least_count']} | Rate: INR {s['standard_cost']}")

last_sample = run_sql(f"SELECT item_code, item_name, measurement_range, least_count, standard_cost FROM item_masters WHERE tenant_id = '{tenant_id}' ORDER BY item_code DESC LIMIT 5;")
print("\nLast 5 items (Alphabetical):")
for s in reversed(last_sample):
    print(f"  {s['item_code']}: {s['item_name']} | Range: {s['measurement_range']} | LC: {s['least_count']} | Rate: INR {s['standard_cost']}")
