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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

if (!TEST_PASSWORD) {
  console.error('ERROR: Missing TEST_USER_PASSWORD in environment. Please provide via TEST_USER_PASSWORD.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth(email, password) {
  console.log(`\nTesting login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(`❌ Auth Error for ${email}:`, error.message);
    return;
  }

  console.log(`✅ Auth successful for ${email}! Auth User ID: ${data.user.id}`);

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, tenants(id, name, code), organizations(id, name, code)')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error(`❌ Profile Error for ${email}:`, profileError.message);
    return;
  }

  console.log(`✅ Profile fetched for ${email}:`, {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    tenant: profile.tenants?.name,
    org: profile.organizations?.name
  });

  // Fetch roles
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles(id, code, name)')
    .eq('user_id', profile.id);

  if (rolesError) {
    console.error(`❌ Roles Error for ${email}:`, rolesError.message);
    return;
  }

  console.log(`✅ Roles fetched for ${email}:`, userRoles.map(ur => ur.roles?.name));
}

async function runTests() {
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@nethra.com';
  const normalEmail = process.env.TEST_USER_EMAIL || 'user@nethra.com';
  await testAuth(adminEmail, TEST_PASSWORD);
  await testAuth(normalEmail, TEST_PASSWORD);
}

runTests();
