const fs = require('fs');
const https = require('https');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const token = env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'zwrbhnsfqapbritnqswe';

function runSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const req = https.request({
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + projectRef + '/database/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const itemCols = await runSql("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'item_masters' ORDER BY ordinal_position;");
  console.log('item_masters columns:', itemCols);

  const clientCols = await runSql("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'clients' ORDER BY ordinal_position;");
  console.log('clients columns:', clientCols);

  const tenants = await runSql("SELECT id, name, code FROM tenants;");
  console.log('tenants:', tenants);

  const orgs = await runSql("SELECT id, name, code, tenant_id FROM organizations;");
  console.log('organizations:', orgs);
}

main();
