// src/super-admin/components/tenants/onboarding/OnboardingWizard.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/UIPrimitives';
import { useOnboardTenant } from '../../../hooks/useTenants';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';
import { generateTenantCodeFromName } from '../../../services/tenantManagementService';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

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
  const [isCodeCustomized, setIsCodeCustomized] = useState(false);
  const [customTenantType, setCustomTenantType] = useState('');

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
    // Step 3: Administrator Account
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
      if (formData.tenantType === 'OTHER' && !customTenantType.trim()) {
        setErrorMessage('Please specify your custom Tenant Type.');
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
      if (!formData.currency) {
        setErrorMessage('Operational Currency is required.');
        return false;
      }
      if (!formData.timezone) {
        setErrorMessage('Timezone is required.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.adminName.trim()) {
        setErrorMessage('Administrator Full Name is required.');
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
    if (!validateStep(3)) return;

    const effectiveTenantType =
      formData.tenantType === 'OTHER' ? customTenantType.trim() : formData.tenantType;

    onboardMutation.mutate(
      {
        name: formData.name,
        code: formData.code,
        tenantType: effectiveTenantType,
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
        branchesCount: 1,
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
    { num: 1, label: 'Tenant Information', subtitle: 'Legal identity & code', icon: Building2 },
    { num: 2, label: 'Address & Regional', subtitle: 'Country, timezone & currency', icon: MapPin },
    { num: 3, label: 'Initial Administrator', subtitle: 'Master credential setup', icon: UserCheck },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Top Header Bar matching localhost:5174 ClientFormView */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/tenants">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 h-9"
            >
              <ArrowLeft className="size-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Enterprise Tenant Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Provision new enterprise lab accounts with PostgreSQL multi-tenant isolation
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0274BB] border border-blue-200">
            Step {step} of 3
          </span>
        </div>
      </div>

      {/* 2. Sleek Step Indicators matching localhost:5174 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stepIndicators.map((s) => {
          const Icon = s.icon;
          const isCurrent = s.num === step;
          const isDone = s.num < step;

          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setStep(s.num);
              }}
              className={cn(
                'p-3.5 rounded-xl border flex items-center gap-3 transition-all select-none',
                isDone && 'cursor-pointer',
                isCurrent
                  ? 'bg-[#E6F2FF] border-[#b8dcff] text-[#003B8C] shadow-xs'
                  : isDone
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                  : 'bg-white border-slate-200 text-slate-400'
              )}
            >
              <div
                className={cn(
                  'size-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                  isCurrent
                    ? 'bg-[#0274BB] text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {isDone ? <CheckCircle2 className="size-5" /> : <Icon className="size-4.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  Step {s.num}
                </div>
                <div className="text-xs font-semibold truncate text-slate-800">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate hidden md:block">
                  {s.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="size-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* 3. Main Form Container matching localhost:5174 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* STEP 1: Tenant Information */}
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="size-9 rounded-lg bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center font-bold shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Tenant Organization Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Specify official enterprise legal name, auto-generated code, and business classification
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tenant Legal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Metrology Systems Ltd"
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData((prev) => {
                        const updates: Record<string, any> = { name: newName };
                        if (!isCodeCustomized) {
                          updates.code = generateTenantCodeFromName(newName);
                        }
                        return { ...prev, ...updates };
                      });
                    }}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Official registered name used for audit logs and system invoices.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Tenant Code / ID *
                    </label>
                    <span className="text-[11px] text-[#0274BB] font-medium flex items-center gap-1">
                      <Sparkles className="size-3" /> Auto-generated
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. TNT-APEX"
                    value={formData.code}
                    onChange={(e) => {
                      setIsCodeCustomized(true);
                      handleChange('code', e.target.value.toUpperCase());
                    }}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#0274BB] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unique uppercase prefix for cross-tenant database isolation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tenant Classification (Dynamic from DB) *
                  </label>
                  <select
                    value={formData.tenantType}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('tenantType', val);
                      if (val !== 'OTHER') {
                        setCustomTenantType('');
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  >
                    {tenantTypes.length === 0 ? (
                      <option value="">Loading classifications from database...</option>
                    ) : (
                      tenantTypes.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))
                    )}
                    <option value="OTHER">Other / Custom Classification</option>
                  </select>

                  {formData.tenantType === 'OTHER' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Specify custom classification..."
                        value={customTenantType}
                        onChange={(e) => setCustomTenantType(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Business Registration / CIN Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. U72200TN2020PTC123456"
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange('registrationNumber', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    GST / Tax Identification Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 80 4123 4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Address & Regional Configuration */}
          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="size-9 rounded-lg bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center font-bold shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Address &amp; Regional Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dynamic countries, states, currencies, and timezones queried directly from PostgreSQL
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 42, Tech Innovation Zone"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phase 2, Industrial Corridor"
                    value={formData.addressLine2}
                    onChange={(e) => handleChange('addressLine2', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Country (Dynamic from DB) *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  >
                    {countries.length === 0 ? (
                      <option value="">Loading countries...</option>
                    ) : (
                      countries.map((c) => (
                        <option key={c.code} value={c.label}>
                          {c.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    State / Province
                  </label>
                  {availableStates.length > 0 ? (
                    <select
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                    >
                      <option value="">Select State / Province</option>
                      {availableStates.map((st) => (
                        <option key={st.code} value={st.label}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter state or province"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pincode / Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 560001"
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Operational Currency *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  >
                    {currencies.length === 0 ? (
                      <option value="">Loading currencies...</option>
                    ) : (
                      currencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Timezone *
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  >
                    {timezones.length === 0 ? (
                      <option value="">Loading timezones...</option>
                    ) : (
                      timezones.map((tz) => (
                        <option key={tz.code} value={tz.code}>
                          {tz.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Tenant Administrator */}
          {step === 3 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="size-9 rounded-lg bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Primary Tenant Administrator
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Master credentials for the designated operational laboratory administrator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh Sundaram"
                    value={formData.adminName}
                    onChange={(e) => handleChange('adminName', e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Administrator Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. admin@apexmetrology.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    An automated email invitation and login token will be generated.
                  </p>
                </div>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Temporary Initial Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for automated invite link"
                  value={formData.adminPassword}
                  onChange={(e) => handleChange('adminPassword', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  If left blank, the tenant admin will receive an email to set their own secure password.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <Shield className="size-4 text-[#0274BB] mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  Upon submission, the new organization record, default facility branch, and admin account are atomically provisioned in PostgreSQL with triple-key process linking (<code className="text-slate-900 font-mono font-semibold">tenant_id</code>, <code className="text-slate-900 font-mono font-semibold">organization_id</code>).
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Buttons matching localhost:5174 */}
          <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between">
            <div>
              {step > 1 ? (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handlePrev}
                  className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-white inline-flex items-center gap-2"
                >
                  <ArrowLeft className="size-4" />
                  <span>Previous Step</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate('/tenants')}
                  className="h-10 px-4 border-slate-200 text-slate-600 hover:bg-white"
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step < 3 ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleNext}
                  className="h-10 px-5 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs inline-flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="h-10 px-6 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs inline-flex items-center gap-2"
                >
                  <Building2 className="size-4" />
                  <span>{onboardMutation.isPending ? 'Provisioning Enterprise...' : 'Complete Onboarding & Provision'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
