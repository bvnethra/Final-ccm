// src/super-admin/components/tenants/AddOrganizationDialog.tsx
import React, { useState } from 'react';
import { Button, Input, FieldGroup, Field, FieldLabel, FieldDescription } from '../../../components/ui/UIPrimitives';
import { useCreateOrganization } from '../../hooks/useTenants';
import { Building2, X, Mail, Phone, MapPin, Shield } from 'lucide-react';

interface AddOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName?: string;
  tenantCode?: string;
  onSuccess?: () => void;
}

export const AddOrganizationDialog: React.FC<AddOrganizationDialogProps> = ({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  tenantCode,
  onSuccess,
}) => {
  const createOrgMutation = useCreateOrganization();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setAddress('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Organization name is required.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Organization code is required.');
      return;
    }

    setErrorMsg('');
    createOrgMutation.mutate(
      {
        tenantId,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        status: 'ACTIVE',
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Failed to provision organization.');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={handleClose}
      />

      {/* Dialog Modal Content */}
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Provision Organization / Branch
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add a laboratory branch or division under{' '}
                <strong className="text-slate-800">{tenantName || 'this tenant'}</strong>
                {tenantCode ? ` (${tenantCode})` : ''}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field>
                <FieldLabel htmlFor="dialog-org-name">Organization / Branch Name *</FieldLabel>
                <Input
                  id="dialog-org-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Central Metrology Facility"
                />
                <FieldDescription>Operating title of this branch or sub-lab.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="dialog-org-code">Branch Code *</FieldLabel>
                <Input
                  id="dialog-org-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ORG-HQ, BLR-01"
                  className="font-mono uppercase"
                />
                <FieldDescription>Unique uppercase identifier code.</FieldDescription>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field>
                <FieldLabel htmlFor="dialog-org-email" className="flex items-center gap-1.5">
                  <Mail className="size-3 text-slate-400" />
                  <span>Contact Email</span>
                </FieldLabel>
                <Input
                  id="dialog-org-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="branch@enterprise.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dialog-org-phone" className="flex items-center gap-1.5">
                  <Phone className="size-3 text-slate-400" />
                  <span>Contact Phone</span>
                </FieldLabel>
                <Input
                  id="dialog-org-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 80 1234 5678"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="dialog-org-address" className="flex items-center gap-1.5">
                <MapPin className="size-3 text-slate-400" />
                <span>Physical Facility Address</span>
              </FieldLabel>
              <textarea
                id="dialog-org-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street, Industrial Corridor, City, Pincode"
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </Field>
          </FieldGroup>

          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <Shield className="size-3.5 text-slate-400 shrink-0" />
            <span>
              This organization is automatically registered in <code className="font-mono text-slate-800">platform_audit_logs</code>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              type="button"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              type="submit"
              size="sm"
              disabled={createOrgMutation.isPending}
            >
              {createOrgMutation.isPending ? 'Provisioning...' : 'Provision Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
