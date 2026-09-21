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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testRoleBuilderFetches() {
  console.log('--- TESTING ROLE TEMPLATES FETCH ---');
  const { data: templates, error: tplErr } = await supabase
    .from('role_templates')
    .select('*, role_template_permissions(permissions(*))');
  
  if (tplErr) console.error('Templates Error:', tplErr);
  else console.log(`Fetched ${templates.length} Role Templates:`, templates.map(t => t.name));

  console.log('\n--- TESTING PERMISSIONS FETCH ---');
  const { data: perms, error: permErr } = await supabase
    .from('permissions')
    .select('*')
    .in('module', ['ADMIN', 'USER_MGMT', 'TENANT_MGMT', 'ORG_MGMT', 'ROLE_MGMT']);

  if (permErr) console.error('Permissions Error:', permErr);
  else console.log(`Fetched ${perms.length} Active Module Permissions:`, perms.map(p => `${p.module}:${p.code}`));

  console.log('\n--- TESTING TENANT ROLES FETCH ---');
  const { data: roles, error: rolesErr } = await supabase
    .from('roles')
    .select('*, role_permissions(permissions(*))');

  if (rolesErr) console.error('Roles Error:', rolesErr);
  else console.log(`Fetched ${roles.length} Tenant Roles:`, roles.map(r => `${r.name} (${r.code})`));
}

testRoleBuilderFetches();
