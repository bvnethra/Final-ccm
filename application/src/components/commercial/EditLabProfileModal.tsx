// application/src/components/commercial/EditLabProfileModal.tsx
import React, { useState, useEffect } from 'react';
import type { LabIssuerProfile } from '../../types/domain';
import { Button, Input, Field, FieldLabel } from '../ui/UIPrimitives';
import { X, Check, RotateCcw, Building2, Image, Phone, CreditCard, Upload } from 'lucide-react';

export interface EditLabProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LabIssuerProfile;
  onSave: (updated: Partial<LabIssuerProfile>) => Promise<void>;
  onReset: () => Promise<void>;
}

export const EditLabProfileModal: React.FC<EditLabProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<LabIssuerProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof LabIssuerProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, logo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogoImage = () => {
    setFormData((prev) => ({ ...prev, logo_url: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save lab profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Reset all lab header details back to standard Tespa Calibration Centre default?')) {
      return;
    }
    setIsResetting(true);
    try {
      await onReset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset profile');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-700 rounded-lg shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-[#0274BB]" />
            <h2 className="text-base font-bold text-[#111827] dark:text-neutral-100">
              Customize Lab Issuer Branding &amp; Header
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {error}
              </div>
            )}

            {/* Logo Section */}
            <div className="border border-neutral-200 dark:border-neutral-700 rounded p-4 bg-[#FAFAFA] dark:bg-neutral-800/50 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                <Image className="size-4 text-[#0274BB]" />
                Lab Logo &amp; Brand Typography
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <FieldLabel>Upload Logo Image (PNG / SVG / JPG)</FieldLabel>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-md p-3 cursor-pointer hover:bg-white dark:hover:bg-neutral-800 transition-colors">
                    <Upload className="size-4 text-gray-500" />
                    <span className="text-xs text-gray-600 dark:text-neutral-300">
                      Choose logo file
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col items-center justify-center p-3 border border-gray-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 min-h-[70px]">
                  {formData.logo_url ? (
                    <div className="relative group flex flex-col items-center">
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="max-h-12 max-w-[160px] object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogoImage}
                        className="text-[10px] text-red-600 hover:underline mt-1 cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-xl font-serif font-black tracking-tight italic text-black dark:text-white lowercase">
                        {formData.logo_text || 'tespa'}
                      </div>
                      <div className="text-[7.5px] uppercase tracking-widest text-gray-500">
                        {formData.logo_tagline || 'PRECISION & QUALITY'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!formData.logo_url && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field>
                    <FieldLabel>Logo Brand Text</FieldLabel>
                    <Input
                      value={formData.logo_text || ''}
                      onChange={(e) => handleChange('logo_text', e.target.value)}
                      placeholder="e.g. tespa"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Brand Tagline</FieldLabel>
                    <Input
                      value={formData.logo_tagline || ''}
                      onChange={(e) => handleChange('logo_tagline', e.target.value)}
                      placeholder="e.g. PRECISION & QUALITY"
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Institution / Lab Names */}
            <div className="space-y-3">
              <div className="font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Building2 className="size-4 text-[#0274BB]" /> Lab Organization &amp; Division
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Laboratory / Entity Name</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Division / Parent Company</FieldLabel>
                  <Input
                    value={formData.division || ''}
                    onChange={(e) => handleChange('division', e.target.value)}
                    placeholder="e.g. A Division of TESPA TOOLS PVT LTD"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>GSTIN / UIN</FieldLabel>
                  <Input
                    value={formData.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>UDYAM Reg. No.</FieldLabel>
                  <Input
                    value={formData.udyam || ''}
                    onChange={(e) => handleChange('udyam', e.target.value)}
                    placeholder="e.g. UDYAM-TN-02-0048127 (Micro)"
                  />
                </Field>
              </div>
            </div>

            {/* Address & Communication */}
            <div className="space-y-3">
              <div className="font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Phone className="size-4 text-[#0274BB]" /> Address &amp; Contact Information
              </div>

              <Field>
                <FieldLabel>Address Line 1</FieldLabel>
                <Input
                  value={formData.address1}
                  onChange={(e) => handleChange('address1', e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>State &amp; Code</FieldLabel>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="col-span-2">
                      <Input
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        value={formData.state_code}
                        onChange={(e) => handleChange('state_code', e.target.value)}
                        placeholder="33"
                        required
                      />
                    </div>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>PIN Code</FieldLabel>
                  <Input
                    value={formData.pin}
                    onChange={(e) => handleChange('pin', e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Landline Phone(s)</FieldLabel>
                  <Input
                    value={formData.phones}
                    onChange={(e) => handleChange('phones', e.target.value)}
                    placeholder="e.g. 044-2663 2191, 2663 1820"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Mobile Phone</FieldLabel>
                  <Input
                    value={formData.mobile || ''}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="e.g. +91 9445191573"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Official Email Address</FieldLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Bank Details */}
            <div className="space-y-3">
              <div className="font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <CreditCard className="size-4 text-[#0274BB]" /> Bank Details (For Invoices)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field>
                  <FieldLabel>Bank Name</FieldLabel>
                  <Input
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="Indian Bank"
                  />
                </Field>
                <Field>
                  <FieldLabel>A/C No.</FieldLabel>
                  <Input
                    value={formData.account_no || ''}
                    onChange={(e) => handleChange('account_no', e.target.value)}
                    placeholder="504946658"
                  />
                </Field>
                <Field>
                  <FieldLabel>Branch &amp; IFSC</FieldLabel>
                  <Input
                    value={formData.branch_ifsc || ''}
                    onChange={(e) => handleChange('branch_ifsc', e.target.value)}
                    placeholder="Padi, Chennai & IDIB000P001"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t border-[#E5E7EB] dark:border-neutral-700 bg-[#F9FAFB] dark:bg-neutral-800/40 rounded-b-lg">
            <Button
              variant="outlineInk"
              type="button"
              size="sm"
              onClick={handleResetToDefault}
              disabled={isResetting || isSaving}
              className="text-gray-600 hover:text-black"
            >
              <RotateCcw className="size-3.5" />
              {isResetting ? 'Resetting...' : 'Reset to Tespa Default'}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                type="button"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                size="sm"
                disabled={isSaving || isResetting}
                className="flex items-center gap-1.5 shadow-sm"
              >
                <Check className="size-4" />
                {isSaving ? 'Saving Changes...' : 'Save Lab Profile'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLabProfileModal;
