// src/super-admin/pages/CreatePlatformUserPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, FieldGroup, Field, FieldLabel, FieldDescription } from '../../components/ui/UIPrimitives';
import { useCreatePlatformUser } from '../hooks/usePlatformUsers';
import { useAllTenants } from '../hooks/useTenants';
import type { PlatformRole } from '../types/superAdmin';
import { ArrowLeft, Shield, User, Mail, Lock, ShieldAlert, Building2 } from 'lucide-react';

export default function CreatePlatformUserPage() {
  const navigate = useNavigate();
  const createMutation = useCreatePlatformUser();
  const { data: tenants = [] } = useAllTenants();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('PLATFORM_SUPPORT');
  const [tenantId, setTenantId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('An initial provisioning password is required.');
      return;
    }

    setErrorMsg('');
    createMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        tenantId: tenantId || null,
        password: password.trim(),
      },
      {
        onSuccess: () => {
          navigate('/users');
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Failed to create platform user.');
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/users')}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Users</span>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Provision Platform User
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create an enterprise administrative account with platform-wide oversight or tenant operator permissions.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-name" className="flex items-center gap-1.5">
                <User className="size-3 text-slate-400" />
                <span>Full Name *</span>
              </FieldLabel>
              <Input
                id="user-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Johnathan Vance"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="user-email" className="flex items-center gap-1.5">
                <Mail className="size-3 text-slate-400" />
                <span>Enterprise Email Address *</span>
              </FieldLabel>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@company.com"
              />
              <FieldDescription>The user will log into the platform with this email.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="user-role" className="flex items-center gap-1.5">
                <Shield className="size-3 text-slate-400" />
                <span>Platform Governance Role *</span>
              </FieldLabel>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformRole)}
                className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full platform authority, tenant mutations</option>
                <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT — Read-only telemetry, support oversight</option>
                <option value="ADMIN">ADMIN — Internal master data and lab administrator</option>
                <option value="LAB_APPROVER">LAB_APPROVER — Senior calibration approver</option>
                <option value="LAB_ENTRY_PERSON">LAB_ENTRY_PERSON — Lab entry and test technician</option>
                <option value="COLLECTION_AGENT">COLLECTION_AGENT — Field logistics collection agent</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="user-tenant" className="flex items-center gap-1.5">
                <Building2 className="size-3 text-slate-400" />
                <span>Tenant Name</span>
              </FieldLabel>
              <select
                id="user-tenant"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
              >
                <option value="">— Unassigned / Global Platform Operator —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
              <FieldDescription>Select the enterprise tenant created by Super Admin for this user.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="user-password" className="flex items-center gap-1.5">
                <Lock className="size-3 text-slate-400" />
                <span>Initial Account Password *</span>
              </FieldLabel>
              <Input
                id="user-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secure initial password"
              />
              <FieldDescription>The operator will use this password to sign in initially.</FieldDescription>
            </Field>
          </FieldGroup>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldAlert className="size-4 text-slate-400 shrink-0" />
            <span>
              Action will be committed directly to <code className="text-slate-800 font-mono">platform_users</code> and logged in the immutable audit stream.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/users')}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Provisioning...' : 'Provision Platform User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
