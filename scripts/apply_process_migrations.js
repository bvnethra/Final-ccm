import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to load local environment file if process.env is not already populated
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
  console.error('ERROR: Missing SUPABASE_ACCESS_TOKEN (Personal Access Token) in environment.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');

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

async function applyProcessMigrations() {
  console.log(`Targeting Supabase Project Ref: ${projectRef}`);
  console.log('Reading Process Migration Directory:', migrationsDir);

  if (!fs.existsSync(migrationsDir)) {
    console.error(`Migration directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  console.log(`\nExecuting ${files.length} Process Migration Files Step-by-Step...\n`);

  let appliedCount = 0;
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8').trim();
    if (!sqlContent) continue;

    process.stdout.write(`Applying Process Migration [${file}]... `);
    try {
      await runSqlQuery(sqlContent);
      console.log('SUCCESS ✅');
      appliedCount++;
    } catch (err) {
      console.log('ERROR ❌:', err.message);
    }
  }

  console.log(`\nProcess Migration Run Completed! Applied ${appliedCount}/${files.length} process scripts.`);
}

applyProcessMigrations();
