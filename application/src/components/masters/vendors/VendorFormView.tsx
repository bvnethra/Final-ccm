// application/src/components/masters/vendors/VendorFormView.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { VendorFormData } from '../../../types/domain';
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
  Truck,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  MapPin,
  Wrench,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { METROLOGY_SERVICE_CATEGORIES } from '../../../services/vendorMasterService';

interface VendorFormViewProps {
  formData: VendorFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof VendorFormData, value: any) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
  onPhoneChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
  onEmailChange: (index: number, value: string) => void;
  onToggleCategory: (category: string) => void;
  onAddCustomCategory: (cat: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VendorFormView: React.FC<VendorFormViewProps> = ({
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
  onToggleCategory,
  onAddCustomCategory,
  onSubmit,
}) => {
  const [customCatInput, setCustomCatInput] = useState('');

  const handleCustomCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customCatInput.trim()) {
        onAddCustomCategory(customCatInput.trim());
        setCustomCatInput('');
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/masters/vendors">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back to Vendors
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {isEditMode ? 'Edit Vendor Record' : 'Register New Vendor'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {isEditMode
                ? `Updating master record for ${formData.vendor_name || 'Vendor'}`
                : 'Enter calibration lab credentials, tax codes, and serviced metrology disciplines'}
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

      {/* Section 1: Vendor Profile & Identification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="size-5 text-[#EF7626]" />
            <div>
              <CardTitle>Vendor Profile & Registration</CardTitle>
              <CardDescription>Supplier entity name and commercial registration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                Vendor Code <span className="text-xs text-[#6B7280]">(Auto-generated if empty)</span>
              </FieldLabel>
              <Input
                placeholder="e.g. VND-2026-39102"
                value={formData.vendor_code || ''}
                onChange={(e) => onChange('vendor_code', e.target.value)}
                disabled={isEditMode}
              />
              {errors.vendor_code && (
                <span className="text-xs text-[#DC2626]">{errors.vendor_code}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>
                Legal Vendor Name <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. Apex Metrology Standards Pvt Ltd"
                value={formData.vendor_name}
                onChange={(e) => onChange('vendor_name', e.target.value)}
                required
              />
              {errors.vendor_name && (
                <span className="text-xs text-[#DC2626]">{errors.vendor_name}</span>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                GST / Tax ID Number <span className="text-[#DC2626]">*</span>
              </FieldLabel>
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
              <FieldLabel>
                Primary Contact Person <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. S. Ramaswamy (Lab Director)"
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

      {/* Section 2: Address & Geographic Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-[#EF7626]" />
            <div>
              <CardTitle>Physical Lab & Facility Address</CardTitle>
              <CardDescription>Official dispatch and calibration inward destination</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>
              Vendor Address (Multiline) <span className="text-[#DC2626]">*</span>
            </FieldLabel>
            <textarea
              rows={3}
              placeholder="Building 14, Electronic City Phase 1, Calibration Complex..."
              value={formData.address}
              onChange={(e) => onChange('address', e.target.value)}
              required
              className="w-full rounded-[4px] border border-[#E5E7EB] p-2.5 text-sm focus:border-[#EF7626] focus:outline-none focus:ring-1 focus:ring-[#EF7626]"
            />
            {errors.address && <span className="text-xs text-[#DC2626]">{errors.address}</span>}
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>
                City <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. Bengaluru"
                value={formData.city}
                onChange={(e) => onChange('city', e.target.value)}
                required
              />
              {errors.city && <span className="text-xs text-[#DC2626]">{errors.city}</span>}
            </Field>

            <Field>
              <FieldLabel>
                State <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => onChange('state', e.target.value)}
                required
              />
              {errors.state && <span className="text-xs text-[#DC2626]">{errors.state}</span>}
            </Field>

            <Field>
              <FieldLabel>
                PIN Code <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. 560100"
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
            <FileText className="size-5 text-[#EF7626]" />
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
              <FieldLabel>
                Phone Number(s) <span className="text-[#DC2626]">*</span>
              </FieldLabel>
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
                  placeholder={idx === 0 ? 'Primary phone (e.g. +91 98450 12345)' : `Alternate phone #${idx + 1}`}
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
              <FieldLabel>
                Email Address(es) <span className="text-[#DC2626]">*</span>
              </FieldLabel>
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
                  placeholder={idx === 0 ? 'Primary email (e.g. lab@apexstandards.com)' : `Alternate email #${idx + 1}`}
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

      {/* Section 4: Items / Categories Serviced */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-[#EF7626]" />
            <div>
              <CardTitle>Items & Metrology Categories Serviced</CardTitle>
              <CardDescription>
                Select scope of accreditation and disciplines this vendor calibrates or services
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {METROLOGY_SERVICE_CATEGORIES.map((cat) => {
              const isSelected = formData.serviced_categories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => onToggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-[#EF7626] text-white border-[#EF7626] shadow-xs'
                      : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {cat} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          {/* Custom Category Input */}
          <div className="pt-2">
            <FieldLabel>Custom Category / Tag</FieldLabel>
            <div className="flex items-center gap-2 max-w-md">
              <Input
                placeholder="Type custom discipline and press enter or click Add..."
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                onKeyDown={handleCustomCategoryKeyDown}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (customCatInput.trim()) {
                    onAddCustomCategory(customCatInput.trim());
                    setCustomCatInput('');
                  }
                }}
              >
                Add Tag
              </Button>
            </div>
          </div>

          {/* Selected Categories Tags */}
          {formData.serviced_categories.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-[#4B5563] block mb-2">
                Active Serviced Categories ({formData.serviced_categories.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {formData.serviced_categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF7ED] text-[#EF7626] border border-[#EF7626]/20 rounded text-xs font-medium"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => onToggleCategory(c)}
                      className="hover:text-[#DC2626]"
                      title="Remove category"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB] p-6">
          <Link to="/masters/vendors">
            <Button variant="secondary" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button variant="warning" type="submit" disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting ? 'Saving Vendor Record...' : isEditMode ? 'Update Vendor' : 'Save Vendor Master'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
