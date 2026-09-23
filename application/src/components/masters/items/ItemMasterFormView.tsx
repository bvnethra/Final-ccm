// application/src/components/masters/items/ItemMasterFormView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { ItemMasterFormData } from '../../../types/domain';
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
  Compass,
  ArrowLeft,
  Save,
  Ruler,
  IndianRupee,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import {
  ITEM_METROLOGY_CATEGORIES,
  COMMON_MEASUREMENT_UNITS,
} from '../../../services/itemMasterService';

interface ItemMasterFormViewProps {
  formData: ItemMasterFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof ItemMasterFormData, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ItemMasterFormView: React.FC<ItemMasterFormViewProps> = ({
  formData,
  errors,
  isSubmitting,
  isEditMode,
  onChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/masters/items">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back to Catalog
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {isEditMode ? 'Edit Instrument Master' : 'Register New Instrument Master'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {isEditMode
                ? `Updating technical catalog definition for ${formData.item_name || 'Item'}`
                : 'Define metrology specifications, measurement tolerances, and commercial calibration rates'}
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

      {/* Section 1: Item Identification & Classification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Instrument Identification & Discipline</CardTitle>
              <CardDescription>
                Equipment naming and classification for vendor capability matching
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                Item Code <span className="text-xs text-[#6B7280]">(Auto-derived e.g. VC-50)</span>
              </FieldLabel>
              <Input
                placeholder="e.g. VC-50"
                value={formData.item_code || ''}
                onChange={(e) => onChange('item_code', e.target.value)}
                disabled={isEditMode}
              />
              <span className="text-[11px] text-[#6B7280]">
                Auto-derived from instrument name and range (e.g. VC-50 for Vernier Caliper 0-50mm) or custom code
              </span>
              {errors.item_code && (
                <span className="text-xs text-[#DC2626]">{errors.item_code}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>
                Instrument / Equipment Name <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <Input
                placeholder="e.g. Digital Vernier Caliper (0-150 mm)"
                value={formData.item_name}
                onChange={(e) => onChange('item_name', e.target.value)}
                required
              />
              {errors.item_name && (
                <span className="text-xs text-[#DC2626]">{errors.item_name}</span>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Item Category / Metrology Discipline</FieldLabel>
              <select
                value={formData.item_category || ''}
                onChange={(e) => onChange('item_category', e.target.value)}
                className="w-full rounded-[4px] border border-[#E5E7EB] bg-white p-2.5 text-sm focus:border-[#0274BB] focus:outline-none"
              >
                <option value="">Select Metrology Discipline...</option>
                {ITEM_METROLOGY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#6B7280]">
                Matches appropriate calibration vendor capability
              </span>
            </Field>

            <Field>
              <FieldLabel>Manufacturer / Make</FieldLabel>
              <Input
                placeholder="e.g. Mitutoyo, Fluke, Yokogawa"
                value={formData.manufacturer || ''}
                onChange={(e) => onChange('manufacturer', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Model Number</FieldLabel>
              <Input
                placeholder="e.g. 500-196-30"
                value={formData.model || ''}
                onChange={(e) => onChange('model', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Measurement Range & Least Count */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Measurement Specifications & Tolerances</CardTitle>
              <CardDescription>
                Calibrated range interval and instrument least count sensitivity
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FieldLabel>
              Measurement Range (Min / Max / Unit) <span className="text-[#DC2626]">*</span>
            </FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-[#6B7280] block mb-1">Range Min (Numeric)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={formData.range_min ?? ''}
                  onChange={(e) => onChange('range_min', e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-[#6B7280] block mb-1">Range Max (Numeric)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="150"
                  value={formData.range_max ?? ''}
                  onChange={(e) => onChange('range_max', e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-[#6B7280] block mb-1">Range Unit of Measure</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. mm, bar, °C"
                    value={formData.range_unit}
                    onChange={(e) => onChange('range_unit', e.target.value)}
                    required
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onChange('range_unit', e.target.value);
                    }}
                    className="rounded-[4px] border border-[#E5E7EB] bg-white p-2 text-xs text-[#6B7280]"
                    title="Quick pick common unit"
                  >
                    <option value="">Pick...</option>
                    {COMMON_MEASUREMENT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {errors.range && <span className="text-xs text-[#DC2626]">{errors.range}</span>}
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Least Count */}
          <div className="space-y-2">
            <FieldLabel>
              Instrument Least Count <span className="text-[#DC2626]">*</span>
            </FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <div>
                <span className="text-[11px] text-[#6B7280] block mb-1">Least Count Value (Numeric)</span>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.01"
                  value={formData.least_count ?? ''}
                  onChange={(e) => onChange('least_count', e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-[#6B7280] block mb-1">Least Count Unit</span>
                <Input
                  placeholder="e.g. mm, bar, °C"
                  value={formData.least_count_unit}
                  onChange={(e) => onChange('least_count_unit', e.target.value)}
                  required
                />
              </div>
            </div>
            {errors.least_count && (
              <span className="text-xs text-[#DC2626]">{errors.least_count}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Commercial Calibration Pricing & Frequency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IndianRupee className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Commercial Pricing & Calibration Cycle</CardTitle>
              <CardDescription>
                Default baseline fee for quotation generation and periodic recall interval
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <FieldLabel>
                Standard Calibration Cost (₹) <span className="text-[#DC2626]">*</span>
              </FieldLabel>
              <div className="relative">
                <IndianRupee className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="850.00"
                  value={formData.standard_cost ?? ''}
                  onChange={(e) =>
                    onChange('standard_cost', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="pl-9"
                  required
                />
              </div>
              <div className="flex items-start gap-1.5 mt-1 text-xs text-[#6B7280]">
                <Info className="size-3.5 text-[#0274BB] shrink-0 mt-0.5" />
                <span>
                  <strong>Cost Override Rule:</strong> This standard cost is auto-populated as the baseline quotation rate and can be overridden per line item during quotation preparation.
                </span>
              </div>
              {errors.standard_cost && (
                <span className="text-xs text-[#DC2626]">{errors.standard_cost}</span>
              )}
            </Field>

            <Field>
              <FieldLabel>Default Calibration Frequency (Months)</FieldLabel>
              <div className="flex items-center gap-3">
                <select
                  value={formData.calibration_frequency || 12}
                  onChange={(e) => onChange('calibration_frequency', Number(e.target.value))}
                  className="w-full rounded-[4px] border border-[#E5E7EB] bg-white p-2.5 text-sm focus:border-[#0274BB] focus:outline-none"
                >
                  <option value={3}>3 Months (Quarterly Recall)</option>
                  <option value={6}>6 Months (Semi-Annual Recall)</option>
                  <option value={12}>12 Months (Annual Standard)</option>
                  <option value={24}>24 Months (Bi-Annual Recall)</option>
                </select>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                Can be overridden per instrument instance during actual calibration certificate issuance.
              </span>
            </Field>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB] p-6">
          <Link to="/masters/items">
            <Button variant="secondary" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            <Save className="size-4" />
            {isSubmitting ? 'Saving Item Master...' : isEditMode ? 'Update Instrument' : 'Save Item Master'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
