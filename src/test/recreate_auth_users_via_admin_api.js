import { createClient } from '@supabase/supabase-js';
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || (SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : null);
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SEED_PASSWORD = process.env.TEST_USER_PASSWORD || process.env.SEED_DEFAULT_PASSWORD;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PROJECT_REF || !ACCESS_TOKEN) {
  console.error('ERROR: Required environment variables are missing.');
  console.error('Please ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PROJECT_REF, and SUPABASE_ACCESS_TOKEN are set.');
  process.exit(1);
}

if (!SEED_PASSWORD) {
  console.error('ERROR: TEST_USER_PASSWORD environment variable is required to create test users.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runReset() {
  console.log('--- RECREATING USERS VIA SUPABASE AUTH ADMIN API ---');

  // 1. Delete existing raw SQL auth users to start completely clean in auth
  const cleanupSql = `
    DELETE FROM user_roles;
    DELETE FROM user_profiles;
    DELETE FROM auth.identities;
    DELETE FROM auth.users;
  `;

  await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: cleanupSql })
  });

  // 2. Fetch Tenant, Organization, Roles dynamically from DB
  const fetchIdsSql = `
    SELECT 
      (SELECT id FROM tenants LIMIT 1) as tenant_id,
      (SELECT id FROM organizations LIMIT 1) as org_id,
      (SELECT id FROM roles WHERE code = 'SUPER_ADMIN' LIMIT 1) as super_admin_role_id,
      (SELECT id FROM roles WHERE code = 'ROLE_LAB_ENGINEER' LIMIT 1) as normal_role_id;
  `;

  const fetchRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: fetchIdsSql })
  });

  const idsData = await fetchRes.json();
  if (!idsData || !idsData[0]) {
    console.error('No tenant or organization found in database.');
    process.exit(1);
  }
  const { tenant_id, org_id, super_admin_role_id, normal_role_id } = idsData[0];
  console.log('Fetched IDs from database:', { tenant_id, org_id, super_admin_role_id, normal_role_id });

  // 3. Create Super Admin User via GoTrue Admin API
  console.log('Creating admin test user via Auth Admin API...');
  const { data: adminAuth, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@nethra.com',
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Nethra Super Admin' }
  });

  if (adminErr) {
    console.error('Failed to create admin user:', adminErr);
    process.exit(1);
  }
  console.log('Created Admin Auth User ID:', adminAuth.user.id);

  // 4. Create Normal User via GoTrue Admin API
  console.log('Creating normal test user via Auth Admin API...');
  const { data: normalAuth, error: normalErr } = await supabaseAdmin.auth.admin.createUser({
    email: 'user@nethra.com',
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Calibration Engineer User' }
  });

  if (normalErr) {
    console.error('Failed to create normal user:', normalErr);
    process.exit(1);
  }
  console.log('Created Normal Auth User ID:', normalAuth.user.id);

  // 5. Tag Profiles & Roles in Public Schema
  const tagProfilesSql = `
    INSERT INTO user_profiles (id, tenant_id, organization_id, email, full_name, status) VALUES
    ('${adminAuth.user.id}', '${tenant_id}', '${org_id}', 'admin@nethra.com', 'Nethra Super Admin', 'ACTIVE'),
    ('${normalAuth.user.id}', '${tenant_id}', '${org_id}', 'user@nethra.com', 'Calibration Engineer User', 'ACTIVE');

    INSERT INTO user_roles (user_id, role_id) VALUES
    ('${adminAuth.user.id}', '${super_admin_role_id}'),
    ('${normalAuth.user.id}', '${normal_role_id}');
  `;

  const tagRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: tagProfilesSql })
  });

  console.log('Tagged Profiles & Roles Status:', tagRes.status);
  console.log('✅ Recreation complete!');
}

runReset();
