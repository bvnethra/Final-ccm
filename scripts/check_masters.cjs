const fs = require('fs');
const path = require('path');
const { createClient } = require('./../application/node_modules/@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[k] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name, code, organizations(id, name)');
  console.log('Tenants:', JSON.stringify(tenants, null, 2));

  const { count: clientCount, error: cErr } = await supabase.from('clients').select('*', { count: 'exact', head: true });
  console.log('Client count in DB:', clientCount, cErr);

  const { count: itemCount, error: iErr } = await supabase.from('item_masters').select('*', { count: 'exact', head: true });
  console.log('Item count in DB:', itemCount, iErr);

  const { data: clientsSample } = await supabase.from('clients').select('id, client_code, client_name, tenant_id').limit(5);
  console.log('Clients sample:', clientsSample);

  const { data: itemsSample } = await supabase.from('item_masters').select('id, item_code, item_name, standard_cost, tenant_id').limit(5);
  console.log('Items sample:', itemsSample);
}

check();
