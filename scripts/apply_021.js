import fs from 'fs';
import path from 'path';

function loadEnvFile(envFileName) {
  const envPath = path.resolve(process.cwd(), envFileName);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const projectRef = process.env.SUPABASE_PROJECT_REF || (process.env.VITE_SUPABASE_URL ? new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0] : null);
const token = process.env.SUPABASE_ACCESS_TOKEN;

async function runSqlQuery(sqlQuery) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlQuery }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return text;
}

async function main() {
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase', 'migrations', '021_add_routing_and_serial_to_request_items.sql'), 'utf8');
  console.log('Applying Migration 021...');
  const res = await runSqlQuery(sql);
  console.log('SUCCESS:', res);
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
