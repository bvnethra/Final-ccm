// src/super-admin/components/tenants/onboarding/OnboardingWizard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Input } from '../../../../components/ui/UIPrimitives';
import { useOnboardTenant } from '../../../hooks/useTenants';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';
import { 
  Building2, 
  MapPin, 
  Layers, 
  UserCheck, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const onboardMutation = useOnboardTenant();

  // Dynamic configuration lists from PostgreSQL (Zero Hardcoding!)
  const { data: tenantTypes = [] } = usePlatformConfig('tenant_types');
  const { data: countries = [] } = usePlatformConfig('countries');
  const { data: states = [] } = usePlatformConfig('states');
  const { data: currencies = [] } = usePlatformConfig('currencies');
  const { data: timezones = [] } = usePlatformConfig('timezones');

  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Tenant Information
    name: '',
    code: '',
    tenantType: '',
    registrationNumber: '',
    gstNumber: '',
    phone: '',
    // Step 2: Address & Regional
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    timezone: '',
    currency: '',
    // Step 3: Branch / Lab Infrastructure
    branchesCount: 1,
    // Step 4: Administrator Account
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Set default values once config loads if not already chosen
  React.useEffect(() => {
    if (tenantTypes.length > 0 && !formData.tenantType) {
      setFormData((prev) => ({ ...prev, tenantType: tenantTypes[0].code }));
    }
    if (countries.length > 0 && !formData.country) {
      setFormData((prev) => ({ ...prev, country: countries[0].label }));
    }
    if (currencies.length > 0 && !formData.currency) {
      setFormData((prev) => ({ ...prev, currency: currencies[0].code }));
    }
    if (timezones.length > 0 && !formData.timezone) {
      setFormData((prev) => ({ ...prev, timezone: timezones[0].code }));
    }
  }, [tenantTypes, countries, currencies, timezones]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filter states based on selected country (Zero Hardcoding!)
  const selectedCountryObj = React.useMemo(() => {
    return countries.find((c) => c.label === formData.country || c.code === formData.country);
  }, [countries, formData.country]);

  const availableStates = React.useMemo(() => {
    if (!formData.country) return [];
    const code = selectedCountryObj?.code?.toLowerCase();
    const label = (selectedCountryObj?.label || formData.country).toLowerCase();

    return states.filter((st) => {
      const metaCode = (st.metadata?.country_code || '').toLowerCase();
      const metaCountry = (st.metadata?.country || '').toLowerCase();
      if (metaCode && code && metaCode === code) return true;
      if (metaCountry && metaCountry === label) return true;
      return false;
    });
  }, [states, formData.country, selectedCountryObj]);

  const handleCountryChange = (newCountry: string) => {
    const matchedCountry = countries.find((c) => c.label === newCountry || c.code === newCountry);
    const updates: Record<string, any> = {
      country: newCountry,
      state: '', // Reset state on country change so incompatible states are not preserved
    };

    if (matchedCountry?.metadata?.currency) {
      updates.currency = matchedCountry.metadata.currency;
    }
    if (matchedCountry?.metadata?.timezone) {
      updates.timezone = matchedCountry.metadata.timezone;
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrorMessage('Tenant Legal Name is required.');
        return false;
      }
      if (!formData.code.trim()) {
        setErrorMessage('Tenant ID / Code is required.');
        return false;
      }
      if (!formData.tenantType) {
        setErrorMessage('Please select a Tenant Type from the dynamic list.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.city.trim()) {
        setErrorMessage('City is required.');
        return false;
      }
      if (!formData.country) {
        setErrorMessage('Country selection is required.');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.adminName.trim()) {
        setErrorMessage('Primary Administrator Name is required.');
        return false;
      }
      if (!formData.adminEmail.trim()) {
        setErrorMessage('Primary Administrator Email is required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    onboardMutation.mutate(
      {
        name: formData.name,
        code: formData.code,
        tenantType: formData.tenantType,
        registrationNumber: formData.registrationNumber,
        gstNumber: formData.gstNumber,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        timezone: formData.timezone,
        currency: formData.currency,
        branchesCount: Number(formData.branchesCount || 1),
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
      },
      {
        onSuccess: (newTenant) => {
          navigate(`/tenants/${newTenant.id}`);
        },
        onError: (err: any) => {
          setErrorMessage(err.message || 'Onboarding failed');
        },
      }
    );
  };

  const stepIndicators = [
    { num: 1, label: 'Tenant Info', icon: Building2 },
    { num: 2, label: 'Address & Regional', icon: MapPin },
    { num: 3, label: 'Infrastructure', icon: Layers },
    { num: 4, label: 'Initial Admin', icon: UserCheck },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Tenant Onboarding</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Provision new enterprise lab accounts with PostgreSQL multi-tenant isolation.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/tenants')}>
          Cancel
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stepIndicators.map((s) => {
          const Icon = s.icon;
          const isCurrent = s.num === step;
          const isDone = s.num < step;
          return (
            <div
              key={s.num}
              className={`p-3 rounded-[8px] border flex items-center gap-3 transition-colors ${
                isCurrent
                  ? 'bg-[#E6F2FF] border-[#b8dcff] text-[#003B8C] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                  : 'bg-white border-[#E5E7EB] text-[#9CA3AF]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-[4px] flex items-center justify-center text-xs font-semibold ${
                  isCurrent
                    ? 'bg-[#0274BB] text-white'
                    : isDone
                    ? 'bg-emerald-100 text-[#16A34A]'
                    : 'bg-[#F5F7FA] text-[#9CA3AF]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Step {s.num}
                </div>
                <div className="text-xs font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-xs">
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* STEP 1: Tenant Information */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Step 1: Tenant Organization Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Specify legal identity, unique code, and enterprise classification</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tenant Legal Name *"
                    placeholder="e.g. Apex Metrology Systems Ltd"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />

                  <Input
                    label="Tenant Code / ID *"
                    placeholder="e.g. TNT-APEX"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Tenant Type (Dynamic from DB) *
                    </label>
                    <select
                      value={formData.tenantType}
                      onChange={(e) => handleChange('tenantType', e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-[4px] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition"
                    >
                      {tenantTypes.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Business Registration Number"
                    placeholder="e.g. U72200TN2020PTC123456"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="GST / Tax Identification Number"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                  />

                  <Input
                    label="Official Contact Phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Address & Regional */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Step 2: Address & Regional Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Dynamic countries, currencies, and timezones from database configuration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Address Line 1"
                    placeholder="e.g. Plot 42, Tech Innovation Zone"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                  />

                  <Input
                    label="Address Line 2"
                    placeholder="e.g. Phase 2, Industrial Corridor"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Country (Dynamic from DB) *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-[4px] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      State / Province
                    </label>
                    {availableStates.length > 0 ? (
                      <select
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="bg-white border border-[#E5E7EB] rounded-[4px] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition"
                      >
                        <option value="">Select State / Province</option>
                        {availableStates.map((st) => (
                          <option key={st.code} value={st.label}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder="Enter state or province"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                      />
                    )}
                  </div>

                  <Input
                    label="City *"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Pincode / Postal Code"
                    placeholder="e.g. 560001"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563]">
                      Currency (Dynamic from DB) *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-[4px] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition"
                    >
                      {currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563]">
                      Timezone (Dynamic from DB) *
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-[4px] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Branch / Lab Infrastructure */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Step 3: Branch & Calibration Facilities Setup</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure initial organization tier capacity</p>
                </div>

                <div className="max-w-md">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    label="Initial Branch Count / Facilities *"
                    value={formData.branchesCount}
                    onChange={(e) => handleChange('branchesCount', parseInt(e.target.value, 10) || 1)}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    The tenant will be marked as <strong className="text-slate-800">ACTIVE</strong> or <strong className="text-slate-800">PENDING_ORG</strong> until the tenant administrator configures their first laboratory branch.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Initial Administrator Account */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-semibold text-slate-900">Step 4: Initial Tenant Administrator</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Primary administrative account credentials and invite mechanism</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Administrator Full Name *"
                    placeholder="e.g. Dr. Ramesh Sundaram"
                    value={formData.adminName}
                    onChange={(e) => handleChange('adminName', e.target.value)}
                    required
                  />

                  <Input
                    type="email"
                    label="Administrator Email *"
                    placeholder="admin@apexmetrology.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="max-w-md">
                  <Input
                    type="password"
                    label="Temporary Password (Optional)"
                    placeholder="Leave empty for automated invite link"
                    value={formData.adminPassword}
                    onChange={(e) => handleChange('adminPassword', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Upon onboarding, the tenant admin is provisioned and recorded into <code className="text-slate-800 font-mono">platform_audit_logs</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div>
                {step > 1 && (
                  <Button variant="secondary" type="button" onClick={handlePrev}>
                    <ChevronLeft className="w-4 h-4 mr-1.5" /> Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {step < 4 ? (
                  <Button variant="default" type="button" onClick={handleNext}>
                    Continue <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    type="submit"
                    disabled={onboardMutation.isPending}
                  >
                    {onboardMutation.isPending ? 'Provisioning Tenant...' : 'Complete Onboarding & Provision'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};
