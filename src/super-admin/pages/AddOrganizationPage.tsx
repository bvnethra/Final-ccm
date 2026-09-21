// src/super-admin/pages/AddOrganizationPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, FieldGroup, Field, FieldLabel } from '../../components/ui/UIPrimitives';
import { useTenantDetail, useCreateOrganization } from '../hooks/useTenants';
import { ArrowLeft, Building, Shield } from 'lucide-react';

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
          <div className="size-8 rounded-[4px] bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center shrink-0">
            <Building className="size-4" />
          </div>
          <div>
            <span className="text-[#6B7280]">Parent Enterprise:</span>{' '}
            <strong className="text-[#111827] font-medium">{tenant?.name}</strong>
          </div>
        </div>
        <div>
          <span className="text-[#6B7280] font-mono">Code: {tenant?.code}</span>
        </div>
      </Card>

      {/* Full-Page Form Card */}
      <Card className="p-6 bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-name">Organization / Lab Facility Name *</FieldLabel>
                <Input
                  id="org-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Central Metrology & Standards Lab"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="org-code">Facility Code *</FieldLabel>
                <Input
                  id="org-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAB-HQ"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-email">Facility Contact Email</FieldLabel>
                <Input
                  id="org-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lab.contact@enterprise.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="org-phone">Facility Contact Phone</FieldLabel>
                <Input
                  id="org-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="org-address">Physical Location / Address</FieldLabel>
              <textarea
                id="org-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street, Industrial Estate, City, State, Pincode"
                className="flex w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
              />
            </Field>
          </FieldGroup>

          <div className="p-3.5 rounded-[4px] bg-[#F5F7FA] border border-[#E5E7EB] text-xs text-[#6B7280] flex items-center gap-2.5">
            <Shield className="size-4 text-[#0274BB] shrink-0" />
            <span>
              This organization will be directly governed under tenant <strong className="text-[#111827]">{tenant?.code}</strong> and recorded in immutable platform audit logs.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(tenantDetailPath)}
              className="border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              disabled={createOrgMutation.isPending}
              className="bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold rounded-[4px] shadow-xs"
            >
              {createOrgMutation.isPending ? 'Provisioning...' : 'Provision Organization'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
