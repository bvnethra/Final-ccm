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
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={handleClose}
      />

      {/* Dialog Modal Content */}
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Provision Organization / Branch
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Add a laboratory branch or division under{' '}
                <strong className="text-zinc-200">{tenantName || 'this tenant'}</strong>
                {tenantCode ? ` (${tenantCode})` : ''}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
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
                  <Mail className="size-3 text-zinc-500" />
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
                  <Phone className="size-3 text-zinc-500" />
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
                <MapPin className="size-3 text-zinc-500" />
                <span>Physical Facility Address</span>
              </FieldLabel>
              <textarea
                id="dialog-org-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street, Industrial Corridor, City, Pincode"
                className="flex w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
            </Field>
          </FieldGroup>

          <div className="p-2.5 rounded-md bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
            <Shield className="size-3.5 text-zinc-400 shrink-0" />
            <span>
              This organization is automatically registered in <code className="font-mono text-zinc-300">platform_audit_logs</code>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
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
