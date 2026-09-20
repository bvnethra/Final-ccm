import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

if (!projectRef) {
  console.error('ERROR: Missing SUPABASE_PROJECT_REF or VITE_SUPABASE_URL in environment.');
  process.exit(1);
}

if (!token) {
  console.error('ERROR: Missing SUPABASE_ACCESS_TOKEN in environment.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetMigrationArg = process.argv[2] || '001_core_rbac_and_multitenancy.sql';
const migrationFilePath = path.resolve(__dirname, '..', 'supabase', 'migrations', targetMigrationArg);

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

async function applyScratchMigration() {
  console.log(`Targeting Supabase Project Ref: ${projectRef}`);
  console.log('Applying Migration File:', migrationFilePath);

  if (!fs.existsSync(migrationFilePath)) {
    console.error('Migration file not found:', migrationFilePath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
  try {
    const res = await runSqlQuery(sqlContent);
    console.log('SUCCESS! Migration Applied to Supabase project.');
    console.log('Response summary:', res.slice(0, 100));
  } catch (err) {
    console.error('FAILED to apply migration:', err.message);
  }
}

applyScratchMigration();
