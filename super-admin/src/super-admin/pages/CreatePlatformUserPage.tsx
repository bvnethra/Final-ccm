// src/super-admin/pages/CreatePlatformUserPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, FieldGroup, Field, FieldLabel, FieldDescription } from '../../components/ui/UIPrimitives';
import { useCreatePlatformUser } from '../hooks/usePlatformUsers';
import type { PlatformRole } from '../types/superAdmin';
import { ArrowLeft, Shield, User, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function CreatePlatformUserPage() {
  const navigate = useNavigate();
  const createMutation = useCreatePlatformUser();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('PLATFORM_SUPPORT');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    setErrorMsg('');
    createMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: password.trim() || 'Platform@12345',
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
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Provision Platform User
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Create an enterprise administrative account with platform-wide oversight or support permissions.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user-name" className="flex items-center gap-1.5">
                <User className="size-3 text-zinc-500" />
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
                <Mail className="size-3 text-zinc-500" />
                <span>Enterprise Email Address *</span>
              </FieldLabel>
              <Input
                id="user-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@nethra.com"
              />
              <FieldDescription>The user will log into the Super Admin platform with this email.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="user-role" className="flex items-center gap-1.5">
                <Shield className="size-3 text-zinc-500" />
                <span>Platform Governance Role *</span>
              </FieldLabel>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformRole)}
                className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              >
                <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT — Read-only telemetry, support oversight</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full platform authority, tenant mutations</option>
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="user-password" className="flex items-center gap-1.5">
                <Lock className="size-3 text-zinc-500" />
                <span>Temporary Provisioning Password</span>
              </FieldLabel>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for default (Platform@12345)"
              />
              <FieldDescription>Defaults to Platform@12345 if not specified.</FieldDescription>
            </Field>
          </FieldGroup>

          <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
            <ShieldAlert className="size-4 text-zinc-400 shrink-0" />
            <span>
              Action will be committed directly to <code className="text-zinc-300 font-mono">platform_users</code> and logged in the immutable audit stream.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
