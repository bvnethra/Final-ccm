// src/super-admin/pages/AddOrganizationPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, FieldGroup, Field, FieldLabel, FieldDescription } from '../../components/ui/UIPrimitives';
import { useTenantDetail, useCreateOrganization } from '../hooks/useTenants';
import { ArrowLeft, Building, Mail, Phone, MapPin, Shield } from 'lucide-react';

export default function AddOrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading: isTenantLoading } = useTenantDetail(id);
  const createOrgMutation = useCreateOrganization();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const tenantDetailPath = window.location.pathname.startsWith('/super-admin')
    ? `/super-admin/tenants/${id}`
    : `/tenants/${id}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name.trim()) {
      setErrorMsg('Organization name is mandatory.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Organization code is mandatory.');
      return;
    }

    setErrorMsg('');
    createOrgMutation.mutate(
      {
        tenantId: id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        status: 'ACTIVE',
      },
      {
        onSuccess: () => {
          navigate(tenantDetailPath);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Failed to provision organization.');
        },
      }
    );
  };

  if (isTenantLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 font-mono text-xs animate-pulse">
        Loading parent tenant reference...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Back Action */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(tenantDetailPath)}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Tenant</span>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Provision Organization / Branch
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Add an operational laboratory branch, calibration facility, or division under{' '}
          <strong className="text-zinc-200">{tenant?.name || 'this enterprise'}</strong>.
        </p>
      </div>

      {/* Parent Tenant Reference Banner */}
      <Card className="p-4 bg-zinc-900/30 border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
            <Building className="size-4 text-zinc-300" />
          </div>
          <div>
            <span className="text-zinc-400">Parent Enterprise:</span>{' '}
            <strong className="text-zinc-100 font-medium">{tenant?.name}</strong>
          </div>
        </div>
        <div>
          <span className="text-zinc-500 font-mono">Code: {tenant?.code}</span>
        </div>
      </Card>

      {/* Full-Page Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-md bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-name">Organization / Branch Name *</FieldLabel>
                <Input
                  id="org-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Central Metrology Facility"
                />
                <FieldDescription>The official operating title of this branch or sub-lab.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="org-code">Branch Code *</FieldLabel>
                <Input
                  id="org-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ORG-HQ, BLR-LAB-01"
                  className="font-mono uppercase"
                />
                <FieldDescription>Unique uppercase identifier under this tenant.</FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-email" className="flex items-center gap-1.5">
                  <Mail className="size-3 text-zinc-500" />
                  <span>Contact Email</span>
                </FieldLabel>
                <Input
                  id="org-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch.ops@enterprise.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="org-phone" className="flex items-center gap-1.5">
                  <Phone className="size-3 text-zinc-500" />
                  <span>Contact Phone</span>
                </FieldLabel>
                <Input
                  id="org-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 80 1234 5678"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="org-address" className="flex items-center gap-1.5">
                <MapPin className="size-3 text-zinc-500" />
                <span>Physical Facility Address</span>
              </FieldLabel>
              <textarea
                id="org-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street, Industrial Estate, City, State, Pincode"
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
            </Field>
          </FieldGroup>

          <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
            <Shield className="size-4 text-zinc-400 shrink-0" />
            <span>
              This organization will be directly governed under tenant <strong className="text-zinc-200">{tenant?.code}</strong> and recorded in immutable platform audit logs.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(tenantDetailPath)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={createOrgMutation.isPending}
            >
              {createOrgMutation.isPending ? 'Provisioning...' : 'Provision Organization'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
