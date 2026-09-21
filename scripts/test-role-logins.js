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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon key');
  process.exit(1);
}

const credentials = [
  {
    roleName: 'Super Administrator',
    email: 'superadmin@nethra.com',
    password: 'SuperAdmin@2026!',
    portal: 'Super Admin Portal (http://localhost:5173/)',
  },
  {
    roleName: 'Super Administrator (Alternate)',
    email: 'admin@nethra.com',
    password: 'SuperAdmin@2026!',
    portal: 'Super Admin Portal (http://localhost:5173/)',
  },
  {
    roleName: 'Admin / Back Office',
    email: 'backoffice@nethra.com',
    password: 'BackOffice@2026!',
    portal: 'Operational Application (http://localhost:5174/)',
  },
  {
    roleName: 'Lab Person / Lab Approver',
    email: 'labapprover@nethra.com',
    password: 'LabApprover@2026!',
    portal: 'Operational Application (http://localhost:5174/)',
  },
  {
    roleName: 'Lab Entry Person',
    email: 'labentry@nethra.com',
    password: 'LabEntry@2026!',
    portal: 'Operational Application (http://localhost:5174/)',
  },
  {
    roleName: 'Collection Agent',
    email: 'collectionagent@nethra.com',
    password: 'Collection@2026!',
    portal: 'Operational Application (http://localhost:5174/)',
  },
];

async function testLogins() {
  console.log('Testing Supabase Authentication for All Roles...\n');
  let allSuccess = true;

  for (const cred of credentials) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cred.email,
      password: cred.password,
    });

    if (error) {
      console.error(`❌ [FAILED] ${cred.roleName} (${cred.email}):`, error.message);
      allSuccess = false;
    } else {
      console.log(`✅ [SUCCESS] ${cred.roleName}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Session Token: Present (Expires: ${new Date(data.session.expires_at * 1000).toLocaleTimeString()})`);
      
      // Query profile and roles with authenticated client
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, status, tenant_id, organization_id')
        .eq('id', data.user.id)
        .maybeSingle();

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_id, roles(name, code)')
        .eq('user_id', data.user.id);

      console.log(`   Profile Name: ${profile?.full_name || 'N/A'}`);
      console.log(`   Assigned Roles: ${userRoles?.map(r => `${r.roles?.name} (${r.roles?.code})`).join(', ') || 'None'}`);
      console.log('----------------------------------------------------');
    }
  }

  if (allSuccess) {
    console.log('\n🎉 ALL 5 ROLE ACCOUNTS VERIFIED AND FUNCTIONING LIVE IN SUPABASE AUTH!');
  } else {
    console.error('\n⚠️ Some accounts failed authentication.');
    process.exit(1);
  }
}

testLogins().catch(console.error);
