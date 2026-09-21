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
      <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
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
          className="gap-1.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Tenant</span>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Provision Organization / Branch
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Add an operational laboratory branch, calibration facility, or division under{' '}
          <strong className="text-slate-800">{tenant?.name || 'this enterprise'}</strong>.
        </p>
      </div>

      {/* Parent Tenant Reference Banner */}
      <Card className="p-4 bg-slate-50 border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Building className="size-4" />
          </div>
          <div>
            <span className="text-slate-500">Parent Enterprise:</span>{' '}
            <strong className="text-slate-800 font-medium">{tenant?.name}</strong>
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-mono">Code: {tenant?.code}</span>
        </div>
      </Card>

      {/* Full-Page Form Card */}
      <Card className="p-6 bg-white border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
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
                  <Mail className="size-3 text-slate-400" />
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
                  <Phone className="size-3 text-slate-400" />
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
                <MapPin className="size-3 text-slate-400" />
                <span>Physical Facility Address</span>
              </FieldLabel>
              <textarea
                id="org-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street, Industrial Estate, City, State, Pincode"
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </Field>
          </FieldGroup>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
            <Shield className="size-4 text-indigo-600 shrink-0" />
            <span>
              This organization will be directly governed under tenant <strong className="text-slate-800">{tenant?.code}</strong> and recorded in immutable platform audit logs.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(tenantDetailPath)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={createOrgMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
            >
              {createOrgMutation.isPending ? 'Provisioning...' : 'Provision Organization'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
