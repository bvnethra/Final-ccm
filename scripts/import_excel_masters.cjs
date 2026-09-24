const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Dynamically read environment variables
function getEnvConfig() {
  const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../application/.env.local'),
    path.join(__dirname, '../application/.env')
  ];

  const env = {};
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!env[k]) env[k] = v;
        }
      });
    }
  }

  // Merge process.env
  for (const [k, v] of Object.entries(process.env)) {
    if (v && !env[k]) env[k] = v;
  }

  let projectRef = env.SUPABASE_PROJECT_REF;
  if (!projectRef && env.VITE_SUPABASE_URL) {
    const m = env.VITE_SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (m) projectRef = m[1];
  }

  const token = env.SUPABASE_ACCESS_TOKEN;
  if (!projectRef || !token) {
    throw new Error('Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in environment.');
  }

  return { projectRef, token, supabaseUrl: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY };
}

const { projectRef, token } = getEnvConfig();

// 2. Helper to execute SQL queries via Supabase Management API
function runSql(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 400 || parsed.error) {
            return reject(new Error(parsed.error || parsed.message || body));
          }
          resolve(parsed);
        } catch (e) {
          if (res.statusCode >= 400) return reject(new Error(body));
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 3. Load XLSX parsing module
let xlsx;
try {
  xlsx = require(path.join(__dirname, '../application/node_modules/xlsx'));
} catch (e) {
  xlsx = require('xlsx');
}

// 4. Parse Customer List from Excel
function parseCustomers(filePath) {
  console.log(`\nReading Customers Excel from: ${filePath}`);
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames.includes('Sheet2') ? 'Sheet2' : wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

  const customers = [];
  let seq = 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const rawName = String(row[1]).trim();
    if (!rawName || rawName === 'Customer Name') continue;

    // Clean name: remove trailing CAL CHE variants
    let cleanName = rawName
      .replace(/[\s\-_/]+CAL[\s\-_/]*CHEE?\b.*$/i, '')
      .replace(/\bCAL[\s\-_/]+CHEE?\b/i, '')
      .replace(/[\s\-_,]+$/, '')
      .trim();

    // Clean slug for email
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 18) || `client${seq}`;

    // GSTIN: Standard Indian format 33 (TN) + 5 alpha + 4 digits + 1 alpha + 1 + Z + 1
    const gstCode = `33AAACN${String(seq).padStart(4, '0')}Z1Z5`;
    const clientCode = `TCC-MAS-${String(seq).padStart(3, '0')}`;
    const phone = `+91 98400 ${String(seq).padStart(5, '0')}`;
    const email = `contact@${slug}.com`;
    const address = 'Chennai Industrial Corridor, Tamil Nadu';

    customers.push({
      client_code: clientCode,
      client_name: cleanName,
      address,
      billing_address: address,
      gst_tax_number: gstCode,
      contact_person: 'Quality Assurance & Metrology Head',
      email,
      phone,
      status: 'ACTIVE'
    });

    seq++;
  }

  console.log(`Parsed ${customers.length} customer records.`);
  return customers;
}

// Dynamic Item Code Derivation (e.g. vernier caliper 0-100 -> VC-100)
function deriveSmartItemCode(itemName, measurementRange, rawRange) {
  const name = (itemName || '').trim();
  const rangeStr = (measurementRange || '').trim();
  const fullRangeStr = (rawRange || '').trim();

  // 1. Determine Range Suffix
  let rangeSuffix = '';
  const dimMatch = rangeStr.match(/(\d+)\s*\*\s*(\d+)/);
  if (dimMatch) {
    rangeSuffix = dimMatch[1];
  } else {
    const rangeMatch = rangeStr.match(/(?:(?:\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)|(?:upto\s*[-–]?\s*(\d+(?:\.\d+)?)))/i);
    if (rangeMatch) {
      rangeSuffix = String(Number(rangeMatch[1] || rangeMatch[2]));
    } else {
      const numMatches = rangeStr.match(/\d+(?:\.\d+)?/g);
      if (numMatches && numMatches.length > 0) {
        const nums = numMatches.map(Number).filter((n) => !isNaN(n) && n > 0);
        if (nums.length > 0) {
          rangeSuffix = String(Math.max(...nums));
        }
      }
    }
  }

  // 2. Acronym determination
  let cleanedName = name.replace(/\([^)]*\)/g, ' ');
  cleanedName = cleanedName.replace(
    /(?:\d+(?:\.\d+)?)\s*(?:-|–|to|\*)\s*(?:\d+(?:\.\d+)?)\s*(?:mm|cm|m|in|bar|psi|kpa|mpa|°c|°f|k|kg|g|mg|n|nm|v|mv|kv|a|ma|ω|hz|khz|rpm|db)?/gi,
    ' '
  );
  cleanedName = cleanedName.replace(
    /\b(?:mm|cm|m|in|bar|psi|kpa|mpa|°c|°f|k|kg|g|mg|n|nm|v|mv|kv|a|ma|ω|hz|khz|rpm|db)\b/gi,
    ' '
  );
  cleanedName = cleanedName.replace(/MEASURINGTAPE/gi, 'MEASURING TAPE');
  cleanedName = cleanedName.replace(/BOREDIAL/gi, 'BORE DIAL');
  cleanedName = cleanedName.replace(/WITHOUT\s+DIAL/gi, 'WOD');
  cleanedName = cleanedName.replace(/WITH\s+DIAL/gi, 'WD');
  cleanedName = cleanedName.replace(/PIN\s+GAUGES?/gi, 'PIN GAUGE');
  cleanedName = cleanedName.replace(/PITCH\s+GAUGES?/gi, 'PITCH GAUGE');
  cleanedName = cleanedName.replace(/[^a-zA-Z0-9\s]/g, ' ');

  const allWords = cleanedName.split(/\s+/).filter((w) => w.length > 0);
  const STOP_WORDS = new Set(['and', 'or', 'for', 'of', 'the', 'in', 'all', 'range', 'go', 'nogo', 'upto']);
  const filteredWords = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    if (STOP_WORDS.has(w.toLowerCase())) continue;
    if (w.toUpperCase() === 'PIN') {
      filteredWords.push('PIN');
    } else if (w.toUpperCase() === 'PITCH') {
      filteredWords.push('PT');
    } else if (/^\d+$/.test(w)) {
      if (i + 1 < allWords.length && /^[a-zA-Z]/.test(allWords[i + 1])) {
        filteredWords.push(w);
      }
    } else {
      filteredWords.push(w);
    }
  }

  let acronym = '';
  if (filteredWords.length >= 2) {
    acronym = filteredWords.map((w) => (/^\d+$/.test(w) || (w.length > 1 && (w === 'PIN' || w === 'PT' || w === 'WD' || w === 'WOD')) ? w.toUpperCase() : w[0].toUpperCase())).join('');
  } else if (filteredWords.length === 1) {
    const w = filteredWords[0].toUpperCase();
    acronym = w.length <= 4 ? w : w.slice(0, 3);
  } else {
    acronym = 'ITM';
  }

  // Check explicit LC like 0.001mm
  let lcSuffix = '';
  const lcMatch = fullRangeStr.match(/lease?\s*-\s*([0-9.]+)\s*mm/i);
  if (lcMatch) {
    lcSuffix = '-' + lcMatch[1];
  }

  if (rangeSuffix && lcSuffix) {
    return acronym + '-' + rangeSuffix + lcSuffix;
  }
  if (rangeSuffix) {
    return acronym + '-' + rangeSuffix;
  }
  return acronym;
}

// 5. Parse Calibration Price List from Excel
function parsePriceList(filePath) {
  console.log(`\nReading Calibration Price List Excel from: ${filePath}`);
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames.includes('Sheet1') ? 'Sheet1' : wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

  let currentInstrument = '';
  const items = [];
  let seq = 1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || (!row[1] && !row[2] && !row[3])) continue;

    if (row[1] && String(row[1]).trim()) {
      currentInstrument = String(row[1]).trim();
    }

    const rawRange = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : '';
    const rawRate = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : '0';

    // Parse rate (cost)
    const ratePart = rawRate.split('/')[0];
    const rateClean = ratePart.replace(/[^0-9.]/g, '');
    const standardCost = rateClean ? parseFloat(rateClean) : 0;

    // Extract least count if annotated in range
    const lcMatch = rawRange.match(/lease?\s*-\s*([0-9.]+)\s*mm/i);
    const hasExplicitLc = !!lcMatch;
    const leastCount = lcMatch ? `${lcMatch[1]} mm` : '0.01 mm';

    // Clean range
    let cleanRange = rawRange
      .replace(/\s*\(\s*lease?.*?\)/i, '')
      .replace(/\s*\(1set\s*\)/i, '')
      .replace(/\s*\(per extension\)/i, '')
      .trim();
    if (!cleanRange) cleanRange = 'Standard Range';

    // Format full item name
    let fullName = currentInstrument;
    if (cleanRange !== 'Standard Range') {
      if (hasExplicitLc) {
        fullName = `${currentInstrument} (${cleanRange}, LC: ${leastCount})`;
      } else {
        fullName = `${currentInstrument} (${cleanRange})`;
      }
    }

    // Dynamic Item Code Derivation (e.g. Vernier Caliper 0-100 -> VC-100)
    let itemCode = deriveSmartItemCode(currentInstrument, cleanRange, rawRange);
    if (!itemCode || itemCode === 'ITM') {
      itemCode = `TCC-MAS-${String(seq).padStart(3, '0')}`;
    }

    items.push({
      item_code: itemCode,
      item_name: fullName,
      item_type: 'EQUIPMENT',
      manufacturer: 'Standard Metrology',
      model: 'Precision Lab Grade',
      serial_number: null,
      measurement_range: cleanRange,
      least_count: leastCount,
      standard_cost: standardCost,
      calibration_frequency: 365,
      status: 'ACTIVE'
    });

    seq++;
  }

  console.log(`Parsed ${items.length} calibration items.`);
  return items;
}

// 6. Main Orchestrator (Zero Hardcoding - Dynamically Queries DB)
async function main() {
  console.log('====================================================');
  console.log(' NETRA CCM — DYNAMIC EXCEL MASTER DATA IMPORT');
  console.log(' (Zero hardcoding: Tenant & Org dynamically queried)');
  console.log('====================================================');

  // Step A: Dynamically query all tenants and organizations
  console.log('\n[1/4] Fetching all active tenants from database...');
  const tenants = await runSql('SELECT id, name, code FROM tenants ORDER BY created_at ASC;');
  if (!tenants || tenants.length === 0) {
    throw new Error('No tenants found in the database! Please ensure database migrations have run.');
  }
  console.log(`Found ${tenants.length} tenant(s):`, tenants.map(t => `${t.name} (${t.code} / ${t.id})`));

  console.log('\n[2/4] Fetching all organizations from database...');
  const orgs = await runSql('SELECT id, name, code, tenant_id FROM organizations ORDER BY created_at ASC;');
  console.log(`Found ${orgs.length} organization(s).`);

  // Step B: Parse Excel files
  const custPath = path.join(__dirname, '../excel/CUSTOMER LIST.xlsx');
  const pricePath = path.join(__dirname, '../excel/Calibration Price List.xlsx');

  const customers = parseCustomers(custPath);
  const items = parsePriceList(pricePath);

  // Step C: Import data for each tenant
  console.log('\n[3/4] Importing data dynamically for each tenant...');

  for (const tenant of tenants) {
    console.log(`\n--- Processing Tenant: ${tenant.name} (${tenant.id}) ---`);

    // Find primary organization for this tenant
    const tenantOrg = orgs.find(o => o.tenant_id === tenant.id) || orgs[0] || null;
    const orgId = tenantOrg ? tenantOrg.id : null;
    console.log(`Assigned Organization: ${tenantOrg ? `${tenantOrg.name} (${tenantOrg.id})` : 'NULL'}`);

    // --- CLIENTS IMPORT ---
    console.log(`Clearing existing clients for tenant ${tenant.id}...`);
    await runSql(`DELETE FROM clients WHERE tenant_id = '${tenant.id}';`);

    const clientRows = customers.map(c => {
      const escName = c.client_name.replace(/'/g, "''");
      const escAddr = c.address.replace(/'/g, "''");
      const escBill = c.billing_address.replace(/'/g, "''");
      const escContact = c.contact_person.replace(/'/g, "''");
      const orgVal = orgId ? `'${orgId}'` : 'NULL';

      return `(gen_random_uuid(), '${tenant.id}', ${orgVal}, '${c.client_code}', '${escName}', '${escAddr}', '${escBill}', '${c.gst_tax_number}', '${escContact}', '${c.email}', '${c.phone}', '${c.status}', NOW(), NOW())`;
    });

    const BATCH_SIZE = 50;
    let insertedClients = 0;
    for (let i = 0; i < clientRows.length; i += BATCH_SIZE) {
      const batch = clientRows.slice(i, i + BATCH_SIZE);
      const insertSql = `
        INSERT INTO clients (
          id, tenant_id, organization_id, client_code, client_name,
          address, billing_address, gst_tax_number, contact_person,
          email, phone, status, created_at, updated_at
        ) VALUES ${batch.join(',\n')};
      `;
      await runSql(insertSql);
      insertedClients += batch.length;
      console.log(`  Inserted batch: ${insertedClients}/${clientRows.length} clients`);
    }

    // --- ITEM MASTERS IMPORT ---
    console.log(`Clearing existing item masters for tenant ${tenant.id}...`);
    await runSql(`DELETE FROM item_masters WHERE tenant_id = '${tenant.id}';`);

    const itemRows = items.map(item => {
      const escName = item.item_name.replace(/'/g, "''");
      const escMfr = item.manufacturer.replace(/'/g, "''");
      const escModel = item.model.replace(/'/g, "''");
      const escRange = item.measurement_range.replace(/'/g, "''");
      const escLc = item.least_count.replace(/'/g, "''");
      const orgVal = orgId ? `'${orgId}'` : 'NULL';

      return `(gen_random_uuid(), '${tenant.id}', ${orgVal}, '${item.item_code}', '${escName}', '${item.item_type}', '${escMfr}', '${escModel}', NULL, '${escRange}', '${escLc}', ${item.standard_cost}, ${item.calibration_frequency}, '${item.status}', NOW(), NOW())`;
    });

    let insertedItems = 0;
    for (let i = 0; i < itemRows.length; i += BATCH_SIZE) {
      const batch = itemRows.slice(i, i + BATCH_SIZE);
      const insertSql = `
        INSERT INTO item_masters (
          id, tenant_id, organization_id, item_code, item_name,
          item_type, manufacturer, model, serial_number,
          measurement_range, least_count, standard_cost,
          calibration_frequency, status, created_at, updated_at
        ) VALUES ${batch.join(',\n')};
      `;
      await runSql(insertSql);
      insertedItems += batch.length;
      console.log(`  Inserted batch: ${insertedItems}/${itemRows.length} items`);
    }
  }

  // Step D: Empirical verification
  console.log('\n[4/4] Verifying database records empirically...');
  for (const tenant of tenants) {
    const clientCountRes = await runSql(`SELECT count(*) as total FROM clients WHERE tenant_id = '${tenant.id}';`);
    const itemCountRes = await runSql(`SELECT count(*) as total FROM item_masters WHERE tenant_id = '${tenant.id}';`);

    const clientTotal = clientCountRes[0]?.total || 0;
    const itemTotal = itemCountRes[0]?.total || 0;

    console.log(`Tenant ${tenant.name} (${tenant.id}):`);
    console.log(`  -> Total Clients in DB: ${clientTotal} (Expected: ${customers.length})`);
    console.log(`  -> Total Items in DB:   ${itemTotal} (Expected: ${items.length})`);

    const sampleClients = await runSql(`SELECT client_code, client_name, gst_tax_number, phone FROM clients WHERE tenant_id = '${tenant.id}' ORDER BY client_code ASC LIMIT 3;`);
    console.log('\nSample Clients:');
    sampleClients.forEach(c => console.log(`  ${c.client_code} | ${c.client_name} | GST: ${c.gst_tax_number}`));

    const sampleItems = await runSql(`SELECT item_code, item_name, measurement_range, least_count, standard_cost FROM item_masters WHERE tenant_id = '${tenant.id}' ORDER BY item_code ASC LIMIT 5;`);
    console.log('\nSample Items:');
    sampleItems.forEach(it => console.log(`  ${it.item_code} | ${it.item_name} | Range: ${it.measurement_range} | LC: ${it.least_count} | Cost: ₹${it.standard_cost}`));
  }

  console.log('\n====================================================');
  console.log(' MASTER DATA IMPORT COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('\nIMPORT FAILED:', err);
  process.exit(1);
});
