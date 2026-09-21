// application/src/components/masters/clients/ClientFormView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { ClientFormData, PaymentTerm } from '../../../types/domain';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Field,
  FieldLabel,
} from '../../ui/UIPrimitives';
import {
  Building2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  MapPin,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ClientFormViewProps {
  formData: ClientFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof ClientFormData, value: any) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
  onPhoneChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
  onEmailChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ClientFormView: React.FC<ClientFormViewProps> = ({
  formData,
  errors,
  isSubmitting,
  isEditMode,
  onChange,
  onAddPhone,
  onRemovePhone,
  onPhoneChange,
  onAddEmail,
  onRemoveEmail,
  onEmailChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/masters/clients">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {isEditMode ? 'Edit Client Profile' : 'Register New Client'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {isEditMode
                ? `Updating master record for ${formData.client_name || 'Client'}`
                : 'Enter corporate entity information, tax numbers, and contact channels'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Toggle Button */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[4px]">
            <span className="text-xs font-semibold text-[#4B5563]">Status:</span>
            <button
              type="button"
              onClick={() =>
                onChange('status', formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
              }
              className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-80"
            >
              {formData.status === 'ACTIVE' ? (
                <>
                  <ToggleRight className="size-5 text-[#16A34A]" />
                  <span className="text-[#16A34A]">ACTIVE</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="size-5 text-[#9CA3AF]" />
                  <span className="text-[#6B7280]">INACTIVE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errors.form && (
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errors.form}
        </div>
      )}

      {/* Section 1: Entity Identification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Entity Identification</CardTitle>
              <CardDescription>Legal enterprise registration details and code</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                Client Code <span className="text-xs text-[#6B7280]">(Auto-generated if empty)</span>
              </FieldLabel>
              <Input
                placeholder="e.g. CLI-2026-48201"
                value={formData.client_code || ''}
                onChange={(e) => onChange('client_code', e.target.value)}
                disabled={isEditMode}
              />
              {errors.client_code && (
                <span className="text-xs text-[#DC2626]">{errors.client_code}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Legal Client Name <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. Acme Precision Technologies Pvt Ltd"
                value={formData.client_name}
                onChange={(e) => onChange('client_name', e.target.value)}
                required
              />
              {errors.client_name && (
                <span className="text-xs text-[#DC2626]">{errors.client_name}</span>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>GSTIN / Tax ID Number <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={formData.gst_tax_number}
                onChange={(e) => onChange('gst_tax_number', e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
              <span className="text-[11px] text-[#6B7280]">
                Standard 15-character alphanumeric GSTIN format
              </span>
              {errors.gst_tax_number && (
                <span className="text-xs text-[#DC2626] block">{errors.gst_tax_number}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Primary Contact Person <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. Rajesh Kumar (Quality Head)"
                value={formData.contact_person}
                onChange={(e) => onChange('contact_person', e.target.value)}
                required
              />
              {errors.contact_person && (
                <span className="text-xs text-[#DC2626]">{errors.contact_person}</span>
              )}
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Address & Location Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Facility & Billing Addresses</CardTitle>
              <CardDescription>
                Physical plant/lab location and financial invoice destination
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Registered Facility Address (Multiline) <span className="text-[#DC2626]">*</span></FieldLabel>
            <textarea
              rows={3}
              placeholder="Plot No. 42, Industrial Area, Sector 8, Phase II..."
              value={formData.address}
              onChange={(e) => {
                onChange('address', e.target.value);
                if (formData.same_as_registered_address) {
                  onChange('billing_address', e.target.value);
                }
              }}
              required
              className="w-full rounded-[4px] border border-[#E5E7EB] p-2.5 text-sm focus:border-[#0274BB] focus:outline-none focus:ring-1 focus:ring-[#0274BB]"
            />
            {errors.address && <span className="text-xs text-[#DC2626]">{errors.address}</span>}
          </Field>

          {/* Same as Registered Address Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sameAddressCheckbox"
              checked={Boolean(formData.same_as_registered_address)}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange('same_as_registered_address', checked);
                if (checked) {
                  onChange('billing_address', formData.address);
                }
              }}
              className="rounded text-[#0274BB] focus:ring-[#0274BB]"
            />
            <label htmlFor="sameAddressCheckbox" className="text-xs font-medium text-[#4B5563] cursor-pointer">
              Billing Address is identical to Registered Facility Address
            </label>
          </div>

          {!formData.same_as_registered_address && (
            <Field>
              <FieldLabel>
                Billing Address <span className="text-xs text-[#6B7280]">(Defaults to Registered Address if blank)</span>
              </FieldLabel>
              <textarea
                rows={3}
                placeholder="Finance Dept, Corporate Tower 3, Suite 400..."
                value={formData.billing_address || ''}
                onChange={(e) => onChange('billing_address', e.target.value)}
                className="w-full rounded-[4px] border border-[#E5E7EB] p-2.5 text-sm focus:border-[#0274BB] focus:outline-none focus:ring-1 focus:ring-[#0274BB]"
              />
            </Field>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Field>
              <FieldLabel>City <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. Pune"
                value={formData.city}
                onChange={(e) => onChange('city', e.target.value)}
                required
              />
              {errors.city && <span className="text-xs text-[#DC2626]">{errors.city}</span>}
            </Field>

            <Field>
              <FieldLabel>State <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => onChange('state', e.target.value)}
                required
              />
              {errors.state && <span className="text-xs text-[#DC2626]">{errors.state}</span>}
            </Field>

            <Field>
              <FieldLabel>PIN Code <span className="text-[#DC2626]">*</span></FieldLabel>
              <Input
                placeholder="e.g. 411018"
                value={formData.pin}
                onChange={(e) => onChange('pin', e.target.value)}
                required
              />
              {errors.pin && <span className="text-xs text-[#DC2626]">{errors.pin}</span>}
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Contact Channels (Multiple Phone Numbers & Emails) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Communication Channels</CardTitle>
              <CardDescription>
                Direct contact phone lines and electronic notifications with multi-entry support
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Numbers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Phone Number(s) <span className="text-[#DC2626]">*</span></FieldLabel>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAddPhone}
                className="text-xs"
              >
                <Plus className="size-3.5" /> Add Another Phone
              </Button>
            </div>

            {formData.phone_numbers.map((phone, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="tel"
                  placeholder={idx === 0 ? 'Primary phone (e.g. +91 98765 43210)' : `Alternate phone #${idx + 1}`}
                  value={phone}
                  onChange={(e) => onPhoneChange(idx, e.target.value)}
                  className="flex-1"
                  required={idx === 0}
                />
                {formData.phone_numbers.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onRemovePhone(idx)}
                    title="Remove phone number"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {errors.phone && <span className="text-xs text-[#DC2626]">{errors.phone}</span>}
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Email Addresses List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel>Email Address(es) <span className="text-[#DC2626]">*</span></FieldLabel>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAddEmail}
                className="text-xs"
              >
                <Plus className="size-3.5" /> Add Another Email
              </Button>
            </div>

            {formData.email_addresses.map((email, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder={idx === 0 ? 'Primary email (e.g. quality@acme.com)' : `Alternate email #${idx + 1}`}
                  value={email}
                  onChange={(e) => onEmailChange(idx, e.target.value)}
                  className="flex-1"
                  required={idx === 0}
                />
                {formData.email_addresses.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveEmail(idx)}
                    title="Remove email address"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {errors.email && <span className="text-xs text-[#DC2626]">{errors.email}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Commercial & Payment Terms */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Commercial Payment Terms</CardTitle>
              <CardDescription>Default billing settlement agreement</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>Payment Term <span className="text-[#DC2626]">*</span></FieldLabel>
            <select
              value={formData.payment_term}
              onChange={(e) => onChange('payment_term', e.target.value as PaymentTerm)}
              className="w-full max-w-xs rounded-[4px] border border-[#E5E7EB] bg-white p-2.5 text-sm focus:border-[#0274BB] focus:outline-none focus:ring-1 focus:ring-[#0274BB]"
            >
              <option value="IMMEDIATE">Immediate Settlement</option>
              <option value="30_DAYS">30 Days Net Credit</option>
              <option value="60_DAYS">60 Days Net Credit</option>
            </select>
            <span className="text-xs text-[#6B7280]">
              Defines invoice payment due cycle generated on quotations and commercial bills.
            </span>
          </Field>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB] p-6">
          <Link to="/masters/clients">
            <Button variant="secondary" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting ? 'Saving Client Master...' : isEditMode ? 'Update Client' : 'Save Client Master'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
