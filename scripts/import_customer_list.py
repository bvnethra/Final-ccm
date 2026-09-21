import os
import re
import json
import zipfile
import urllib.request
import xml.etree.ElementTree as ET

# Load environment
env_vars = {}
for env_file in ['.env.local', '.env']:
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.trim() if hasattr(line, 'trim') else line.strip()
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

tenant_id = 'ea7dd1f0-7307-4a6f-acee-210acb4efefc'
organization_id = 'a860b55a-8e4f-428b-a6b6-0766c08153e9'

excel_path = os.path.join(os.path.dirname(__file__), '..', 'excel', 'CUSTOMER LIST.xlsx')

print(f"Reading Excel: {excel_path}")
with zipfile.ZipFile(excel_path, 'r') as z:
    with z.open('xl/sharedStrings.xml') as f:
        tree = ET.parse(f)
        sst = [elem.text or '' for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
    with z.open('xl/worksheets/sheet1.xml') as f:
        tree = ET.parse(f)
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows = tree.findall('.//s:row', ns)
        clients = []
        for r in rows:
            cols = r.findall('s:c', ns)
            if not cols: continue
            for c in cols:
                ref = c.get('r', '')
                if ref.startswith('B'):
                    t = c.get('t')
                    v = c.find('s:v', ns)
                    if v is not None and t == 's':
                        idx = int(v.text)
                        if idx < len(sst):
                            name = sst[idx].strip()
                            if name and name != 'Customer Name':
                                clients.append(name)

print(f"Extracted {len(clients)} customers.")

# Construct SQL insert statements in batches of 50
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

existing_rows = run_sql(f"SELECT client_name FROM clients WHERE tenant_id = '{tenant_id}';")
existing_names = set(r['client_name'] for r in existing_rows)
print(f"Already existing clients in DB: {len(existing_names)}")

values = []
for i, name in enumerate(clients, 1):
    cleaned_name = re.sub(r'[\s\-_/]+CAL[\s\-_/]*CHEE?\b.*$', '', name, flags=re.IGNORECASE).strip()
    cleaned_name = re.sub(r'\bCAL[\s\-_/]+CHEE?\b', '', cleaned_name, flags=re.IGNORECASE).strip()
    cleaned_name = re.sub(r'[\s\-_,]+$', '', cleaned_name).strip()

    if cleaned_name in existing_names:
        continue
    escaped_name = cleaned_name.replace("'", "''")
    code = f"CLI-2026-{i:05d}"
    gst = f"33AAACN{i:04d}Z1Z5"
    address = "Chennai Industrial Estate, Tamil Nadu"
    contact = "Quality / Metrology Manager"
    clean_slug = re.sub(r'[^a-zA-Z0-9]', '', cleaned_name.lower())[:15]
    email = f"contact@{clean_slug}.nethra.in"
    phone = f"+91 98400 {i:05d}"
    
    val = f"('{tenant_id}', '{organization_id}', '{code}', '{escaped_name}', '{address}', '{address}', '{gst}', '{contact}', '{email}', '{phone}', 'ACTIVE', NOW(), NOW())"
    values.append(val)

if not values:
    print("All customers already present in DB. Nothing new to insert.")
else:
    batch_size = 50
    total_inserted = 0
    for start in range(0, len(values), batch_size):
        chunk = values[start:start+batch_size]
        sql = f"""
        INSERT INTO clients (
            tenant_id, organization_id, client_code, client_name,
            address, billing_address, gst_tax_number, contact_person,
            email, phone, status, created_at, updated_at
        ) VALUES {', '.join(chunk)};
        """
        res = run_sql(sql)
        total_inserted += len(chunk)
        print(f"Inserted batch {start // batch_size + 1}: {len(chunk)} clients (Total: {total_inserted}/{len(values)})")

# Check final count
final_count = run_sql(f"SELECT COUNT(*) as count FROM clients WHERE tenant_id = '{tenant_id}';")
print(f"VERIFIED: Total clients in Supabase DB for tenant: {final_count}")
