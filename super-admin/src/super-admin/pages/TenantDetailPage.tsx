// src/super-admin/pages/TenantDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useTenantDetail, 
  useTriggerAdminInvite, 
  useTenantOrganizations, 
  useUpdateTenantStatus,
  useUpdateTenantDetails,
  useDeleteTenant,
  useDeleteOrganization,
} from '../hooks/useTenants';
import { usePlatformConfig } from '../hooks/usePlatformConfig';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { usePlatformAudit } from '../hooks/usePlatformAudit';
import { Card, Button, Badge, Input } from '../../components/ui/UIPrimitives';
import type { TenantStatus, TenantOrganization } from '../types/superAdmin';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  MapPin, 
  Shield, 
  Phone, 
  Layers, 
  History, 
  AlertCircle, 
  Plus, 
  Network,
  X,
  ChevronDown,
  Pencil,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { openOperationalApp } from '../../services/crossAppNav';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading, error } = useTenantDetail(id);
  const { data: organizations = [], isLoading: isOrgsLoading } = useTenantOrganizations(id);
  const { data: tenantAuditLogs = [] } = usePlatformAudit({ referenceId: id });
  const { data: platformSession } = usePlatformAuth();
  const isSupport = platformSession?.isPlatformSupport;

  const triggerInviteMutation = useTriggerAdminInvite();
  const updateStatusMutation = useUpdateTenantStatus();
  const updateTenantMutation = useUpdateTenantDetails();
  const deleteTenantMutation = useDeleteTenant();
  const deleteOrgMutation = useDeleteOrganization();

  // Dynamic configuration lists for editing selects
  const { data: tenantTypes = [] } = usePlatformConfig('tenant_types');
  const { data: countries = [] } = usePlatformConfig('countries');
  const { data: states = [] } = usePlatformConfig('states');
  const { data: currencies = [] } = usePlatformConfig('currencies');
  const { data: timezones = [] } = usePlatformConfig('timezones');

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Deleted by Super Admin');
  const [deleteError, setDeleteError] = useState('');

  // Delete organization modal state
  const [orgToDelete, setOrgToDelete] = useState<TenantOrganization | null>(null);
  const [orgDeleteReason, setOrgDeleteReason] = useState('Deleted by Super Admin');
  const [orgDeleteError, setOrgDeleteError] = useState('');

  // In-Page Status Governance Panel State (Zero Modal Architecture)
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TenantStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Enterprise Details Edit State
  const [isEditingEnterprise, setIsEditingEnterprise] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: '',
    tenantType: '',
    gstNumber: '',
    registrationNumber: '',
    phone: '',
    branchesCount: 1,
  });

  // Designated Admin Edit State
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    adminName: '',
    adminEmail: '',
  });

  // Location & Regional Edit State
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    timezone: '',
    currency: '',
  });

  // Filter states based on locationForm.country (Zero Hardcoding!)
  const selectedLocationCountryObj = countries.find(
    (c) => c.label === locationForm.country || c.code === locationForm.country
  );

  const availableLocationStates = states.filter((st) => {
    if (!locationForm.country) return false;
    const code = selectedLocationCountryObj?.code?.toLowerCase();
    const label = (selectedLocationCountryObj?.label || locationForm.country).toLowerCase();
    const metaCode = (st.metadata?.country_code || '').toLowerCase();
    const metaCountry = (st.metadata?.country || '').toLowerCase();
    if (metaCode && code && metaCode === code) return true;
    if (metaCountry && metaCountry === label) return true;
    return false;
  });

  const handleLocationCountryChange = (newCountry: string) => {
    const matched = countries.find(c => c.label === newCountry || c.code === newCountry);
    setLocationForm(prev => ({
      ...prev,
      country: newCountry,
      state: '', // reset state on country change
      ...(matched?.metadata?.timezone ? { timezone: matched.metadata.timezone } : {}),
      ...(matched?.metadata?.currency ? { currency: matched.metadata.currency } : {})
    }));
  };

  const handleSaveEnterprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    updateTenantMutation.mutate(
      {
        tenantId: tenant.id,
        name: enterpriseForm.name.trim(),
        tenantType: enterpriseForm.tenantType,
        gstNumber: enterpriseForm.gstNumber.trim().toUpperCase(),
        registrationNumber: enterpriseForm.registrationNumber.trim(),
        phone: enterpriseForm.phone.trim(),
        branchesCount: enterpriseForm.branchesCount,
      },
      {
        onSuccess: () => {
          setFeedbackMsg('Enterprise details successfully updated.');
          setIsEditingEnterprise(false);
          setTimeout(() => setFeedbackMsg(''), 4000);
        },
      }
    );
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    updateTenantMutation.mutate(
      {
        tenantId: tenant.id,
        adminName: adminForm.adminName.trim(),
        adminEmail: adminForm.adminEmail.trim().toLowerCase(),
      },
      {
        onSuccess: () => {
          setFeedbackMsg('Designated tenant admin successfully updated.');
          setIsEditingAdmin(false);
          setTimeout(() => setFeedbackMsg(''), 4000);
        },
      }
    );
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    updateTenantMutation.mutate(
      {
        tenantId: tenant.id,
        addressLine1: locationForm.addressLine1.trim(),
        addressLine2: locationForm.addressLine2.trim(),
        city: locationForm.city.trim(),
        state: locationForm.state.trim(),
        pincode: locationForm.pincode.trim(),
        country: locationForm.country.trim(),
        timezone: locationForm.timezone.trim(),
        currency: locationForm.currency.trim(),
      },
      {
        onSuccess: () => {
          setFeedbackMsg('Location & regional configuration successfully updated.');
          setIsEditingLocation(false);
          setTimeout(() => setFeedbackMsg(''), 4000);
        },
      }
    );
  };

  const addOrgPath = window.location.pathname.startsWith('/super-admin')
    ? `/super-admin/tenants/${id}/organizations/new`
    : `/tenants/${id}/organizations/new`;

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
        Loading tenant profile from PostgreSQL...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm max-w-lg mx-auto text-center space-y-4">
        <div>Failed to load tenant record: {(error as Error)?.message || 'Not found'}</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/tenants')}>
          Back to Tenants
        </Button>
      </div>
    );
  }

  const handleInvite = () => {
    triggerInviteMutation.mutate(tenant.id, {
      onSuccess: () => {
        setFeedbackMsg(`Invitation dispatch recorded for ${tenant.adminEmail}`);
        setTimeout(() => setFeedbackMsg(''), 4000);
      },
    });
  };

  const handleCommitStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      setStatusError('A specific compliance audit reason is required.');
      return;
    }

    setStatusError('');
    updateStatusMutation.mutate(
      {
        tenantId: tenant.id,
        newStatus: targetStatus,
        reason: statusReason.trim(),
      },
      {
        onSuccess: () => {
          setStatusReason('');
          setIsStatusPanelOpen(false);
          setFeedbackMsg(`Tenant status successfully transitioned to ${targetStatus}`);
          setTimeout(() => setFeedbackMsg(''), 4000);
        },
        onError: (err: any) => {
          setStatusError(err.message || 'Status transition failed.');
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/tenants')}
            className="size-8 p-0 border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Back to Tenants List"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
              <Badge variant={tenant.status === 'ACTIVE' ? 'success' : 'destructive'} className="rounded-full px-2.5">
                {tenant.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code: <strong className="text-slate-700">{tenant.code}</strong> &bull; ID: {tenant.id}
            </p>
          </div>
        </div>

        {!isSupport && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetStatus(tenant.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE');
                setIsStatusPanelOpen(!isStatusPanelOpen);
              }}
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <span>Change Status</span>
              <ChevronDown className={`size-3 transition-transform ${isStatusPanelOpen ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(addOrgPath)}
              className="text-xs gap-1.5 border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
              title="Add an organization under this tenant"
            >
              <Plus className="size-3.5 text-slate-600" />
              <span>Add Organization</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openOperationalApp('/', tenant.id)}
              className="text-xs gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-[4px] shadow-xs cursor-pointer font-semibold"
              title="Launch and enter this Tenant's workspace in Operational App on localhost:5174"
            >
              <ExternalLink className="size-3.5 text-emerald-700" />
              <span>Launch App (5174)</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleInvite}
              disabled={triggerInviteMutation.isPending}
              className="text-xs gap-1.5 bg-[#0274BB] hover:bg-[#003B8C] text-white rounded-[4px] shadow-xs"
            >
              <Mail className="size-3.5" />
              <span>{triggerInviteMutation.isPending ? 'Dispatching...' : 'Invite Admin'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(true);
                setDeleteError('');
              }}
              className="text-xs gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-[4px] shadow-xs"
              title="Delete Enterprise Tenant"
            >
              <Trash2 className="size-3.5 text-rose-600" />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-[4px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-[#9CA3AF] hover:text-[#111827]">✕</button>
        </div>
      )}

      {/* In-Page Governance Status Change Panel (Zero Modal Architecture) */}
      {isStatusPanelOpen && (
        <Card className="p-5 border-[#E5E7EB] bg-white rounded-[8px] shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-[#0274BB]" />
              <h3 className="text-sm font-semibold text-[#111827]">
                Governance Status Transition: {tenant.name}
              </h3>
            </div>
            <button
              onClick={() => setIsStatusPanelOpen(false)}
              className="text-[#9CA3AF] hover:text-[#111827] text-xs"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleCommitStatusChange} className="space-y-4">
            {statusError && (
              <div className="p-3 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {statusError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#4B5563] font-medium uppercase tracking-wider">
                  Target Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as TenantStatus)}
                  className="flex h-9 rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-xs text-[#374151] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                >
                  <option value="ACTIVE">ACTIVE (Operational & Calibrating)</option>
                  <option value="DEACTIVATED">DEACTIVATED (Archived / Closed Tenant)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[#4B5563] font-medium uppercase tracking-wider">
                  Audit Reason / Governance Justification *
                </label>
                <textarea
                  required
                  rows={2}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="State the regulatory or operational reason for this status change..."
                  className="flex w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsStatusPanelOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="bg-[#0274BB] hover:bg-[#003B8C] text-white"
              >
                {updateStatusMutation.isPending ? 'Committing...' : 'Commit Status Change'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Organization & Regional */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Building2 className="size-3.5 text-slate-400" />
                <span>Enterprise Details</span>
              </h3>
              {!isSupport && !isEditingEnterprise && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#4B5563] gap-1 hover:text-[#0274BB] hover:border-[#b8dcff] hover:bg-[#E6F2FF] shadow-none rounded-[4px]"
                  onClick={() => {
                    setEnterpriseForm({
                      name: tenant.name,
                      tenantType: tenant.tenantType || 'COMMERCIAL_LAB',
                      gstNumber: tenant.gstNumber || '',
                      registrationNumber: tenant.registrationNumber || '',
                      phone: tenant.phone || '',
                      branchesCount: tenant.branchesCount || 1,
                    });
                    setIsEditingEnterprise(true);
                  }}
                >
                  <Pencil className="size-3 text-[#9CA3AF]" />
                  <span>Edit</span>
                </Button>
              )}
            </div>

            {isEditingEnterprise ? (
              <form onSubmit={handleSaveEnterprise} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Tenant Legal Name *"
                      value={enterpriseForm.name}
                      onChange={(e) => setEnterpriseForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                      Tenant Classification
                    </label>
                    <select
                      value={enterpriseForm.tenantType}
                      onChange={(e) => setEnterpriseForm(prev => ({ ...prev, tenantType: e.target.value }))}
                      className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                    >
                      {tenantTypes.length > 0 ? (
                        tenantTypes.map(t => (
                          <option key={t.code} value={t.code}>{t.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="COMMERCIAL_LAB">Commercial Testing & Calibration Lab</option>
                          <option value="MANUFACTURING_INHOUSE">Manufacturing In-house Calibration</option>
                          <option value="GOVERNMENT_DEFENSE">Government / Defense Metrology</option>
                        </>
                      )}
                      {enterpriseForm.tenantType && !tenantTypes.some(t => t.code === enterpriseForm.tenantType) && (
                        <option value={enterpriseForm.tenantType}>{enterpriseForm.tenantType}</option>
                      )}
                    </select>
                  </div>
                  <Input
                    label="GST Identification Number"
                    value={enterpriseForm.gstNumber}
                    onChange={(e) => setEnterpriseForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                  />
                  <Input
                    label="Registration Number"
                    value={enterpriseForm.registrationNumber}
                    onChange={(e) => setEnterpriseForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="e.g. U72200TN2020PTC123456"
                  />
                  <Input
                    label="Contact Phone"
                    value={enterpriseForm.phone}
                    onChange={(e) => setEnterpriseForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                  <Input
                    label="Branch Capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={enterpriseForm.branchesCount}
                    onChange={(e) => setEnterpriseForm(prev => ({ ...prev, branchesCount: parseInt(e.target.value, 10) || 1 }))}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsEditingEnterprise(false)}
                    disabled={updateTenantMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                  >
                    {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Tenant Classification</span>
                  <strong className="text-slate-800">{tenant.tenantType || 'COMMERCIAL_LAB'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">GST Identification Number</span>
                  <code className="text-slate-700 font-mono">{tenant.gstNumber || 'Not provided'}</code>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Registration Number</span>
                  <span className="text-slate-700 font-mono">{tenant.registrationNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Contact Phone</span>
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Phone className="size-3 text-slate-400" />
                    {tenant.phone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Branch Capacity</span>
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Layers className="size-3 text-slate-400" />
                    {tenant.branchesCount} Branch Facilities
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin className="size-3.5 text-slate-400" />
                <span>Location & Regional Configuration</span>
              </h3>
              {!isSupport && !isEditingLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#4B5563] gap-1 hover:text-[#0274BB] hover:border-[#b8dcff] hover:bg-[#E6F2FF] shadow-none rounded-[4px]"
                  onClick={() => {
                    setLocationForm({
                      addressLine1: tenant.addressLine1 || '',
                      addressLine2: tenant.addressLine2 || '',
                      city: tenant.city || '',
                      state: tenant.state || '',
                      pincode: tenant.pincode || '',
                      country: tenant.country || 'India',
                      timezone: tenant.timezone || 'Asia/Kolkata',
                      currency: tenant.currency || 'INR',
                    });
                    setIsEditingLocation(true);
                  }}
                >
                  <Pencil className="size-3 text-[#9CA3AF]" />
                  <span>Edit</span>
                </Button>
              )}
            </div>

            {isEditingLocation ? (
              <form onSubmit={handleSaveLocation} className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Physical Address Line 1"
                      value={locationForm.addressLine1}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                      placeholder="Plot / Street, Innovation Zone"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Physical Address Line 2"
                      value={locationForm.addressLine2}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Suite, Floor, Industrial Area"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                      Country
                    </label>
                    <select
                      value={locationForm.country}
                      onChange={(e) => handleLocationCountryChange(e.target.value)}
                      className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                    >
                      {countries.length > 0 ? (
                        countries.map(c => (
                          <option key={c.code} value={c.label}>{c.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="Germany">Germany</option>
                          <option value="United Kingdom">United Kingdom</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                      State / Province
                    </label>
                    {availableLocationStates.length > 0 ? (
                      <select
                        value={locationForm.state}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value }))}
                        className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                      >
                        <option value="">Select State / Province</option>
                        {availableLocationStates.map(s => (
                          <option key={s.code} value={s.label}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={locationForm.state}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="e.g. Karnataka"
                      />
                    )}
                  </div>
                  <Input
                    label="City"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Bangalore"
                  />
                  <Input
                    label="Pincode / Postal Code"
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="e.g. 560001"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                      Timezone
                    </label>
                    <select
                      value={locationForm.timezone}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, timezone: e.target.value }))}
                      className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                    >
                      {timezones.length > 0 ? (
                        timezones.map(tz => (
                          <option key={tz.code} value={tz.code}>{tz.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                          <option value="UTC">UTC (+0:00)</option>
                          <option value="America/New_York">America/New_York (EST -5:00)</option>
                          <option value="Europe/London">Europe/London (GMT +0:00)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                      Operational Currency
                    </label>
                    <select
                      value={locationForm.currency}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                    >
                      {currencies.length > 0 ? (
                        currencies.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.label}</option>
                        ))
                      ) : (
                        <>
                          <option value="INR">INR — Indian Rupee (₹)</option>
                          <option value="USD">USD — US Dollar ($)</option>
                          <option value="EUR">EUR — Euro (€)</option>
                          <option value="GBP">GBP — British Pound (£)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    disabled={updateTenantMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                  >
                    {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-0.5">Physical Address</span>
                  <div className="text-slate-800">
                    {tenant.addressLine1 || 'No street address recorded'}
                    {tenant.addressLine2 && <div>{tenant.addressLine2}</div>}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">City & State</span>
                  <span className="text-slate-800">
                    {tenant.city || 'N/A'}, {tenant.state || 'N/A'} {tenant.pincode ? `(${tenant.pincode})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Country</span>
                  <span className="text-slate-800">{tenant.country || 'India'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Timezone</span>
                  <code className="text-slate-700 font-mono">{tenant.timezone || 'Asia/Kolkata'}</code>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Operational Currency</span>
                  <code className="text-slate-700 font-mono">{tenant.currency || 'INR'}</code>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Admin & Status Metadata */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Shield className="size-3.5 text-slate-400" />
                <span>Designated Tenant Admin</span>
              </h3>
              {!isSupport && !isEditingAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#4B5563] gap-1 hover:text-[#0274BB] hover:border-[#b8dcff] hover:bg-[#E6F2FF] shadow-none rounded-[4px]"
                  onClick={() => {
                    setAdminForm({
                      adminName: tenant.adminName || '',
                      adminEmail: tenant.adminEmail || '',
                    });
                    setIsEditingAdmin(true);
                  }}
                >
                  <Pencil className="size-3 text-[#9CA3AF]" />
                  <span>Edit</span>
                </Button>
              )}
            </div>

            {isEditingAdmin ? (
              <form onSubmit={handleSaveAdmin} className="space-y-3 animate-fadeIn">
                <Input
                  label="Administrator Full Name"
                  value={adminForm.adminName}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, adminName: e.target.value }))}
                  placeholder="e.g. Dr. Sarah Connor"
                />
                <Input
                  label="Administrator Email Address"
                  type="email"
                  value={adminForm.adminEmail}
                  onChange={(e) => setAdminForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                  placeholder="admin@enterprise.com"
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsEditingAdmin(false)}
                    disabled={updateTenantMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                  >
                    {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Full Name</span>
                  <strong className="text-slate-800">{tenant.adminName || 'Not provisioned'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Email Address</span>
                  <div className="text-slate-700 font-mono">{tenant.adminEmail || 'Not provisioned'}</div>
                </div>
              </div>
            )}
          </Card>

          {tenant.statusReason && (
            <Card className="p-4 space-y-1.5 border-slate-200 bg-slate-50 shadow-2xs">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Latest Status Change Reason
              </h3>
              <p className="text-xs text-slate-700 italic">
                "{tenant.statusReason}"
              </p>
            </Card>
          )}

          <Card className="p-5 space-y-2.5 text-xs text-slate-500 bg-white border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span>Onboarded At:</span>
              <span className="text-slate-700 font-mono">{new Date(tenant.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Modified:</span>
              <span className="text-slate-700 font-mono">{new Date(tenant.updatedAt).toLocaleString()}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Sub-Organizations & Facilities Card */}
      <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">
              Provisioned Organizations & Branches ({organizations.length})
            </h3>
          </div>
          {!isSupport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(addOrgPath)}
              className="text-xs gap-1 h-7 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Plus className="size-3" />
              <span>Add Org</span>
            </Button>
          )}
        </div>

        {isOrgsLoading ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono animate-pulse">
            Loading tenant organizations from PostgreSQL...
          </div>
        ) : organizations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Building2 className="size-8 text-slate-300" />
            <span>No sub-organizations provisioned under this enterprise yet.</span>
            {!isSupport && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(addOrgPath)}
                className="mt-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                + Provision First Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {organizations.map((org) => (
              <div key={org.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{org.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2.5 mt-0.5">
                    <span className="text-slate-700 font-semibold">{org.code}</span>
                    {org.email && <span>&bull; {org.email}</span>}
                    {org.phone && <span>&bull; {org.phone}</span>}
                    {org.address && <span>&bull; {org.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={org.status === 'ACTIVE' ? 'success' : 'outline'} className="rounded-full px-2.5">
                    {org.status}
                  </Badge>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </span>
                  {!isSupport && (
                    <button
                      type="button"
                      title="Delete organization"
                      onClick={() => {
                        setOrgToDelete(org);
                        setOrgDeleteReason('Deleted by Super Admin');
                        setOrgDeleteError('');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tenant-Specific Audit Trail */}
      <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
          <History className="size-3.5 text-slate-400" />
          <span>Tenant Governance Audit Trail</span>
        </h3>

        {tenantAuditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <AlertCircle className="size-4 text-slate-300" />
            <span>No specific audit events logged for this tenant reference.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenantAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Badge variant={log.action.includes('DEACTIVATED') ? 'destructive' : 'default'} className="rounded-md">
                    {log.action}
                  </Badge>
                  <span className="text-slate-800 font-medium">{log.reason || log.action}</span>
                  <span className="text-slate-400 text-[11px]">by {log.actorEmail}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-[6px] text-[#DC2626]">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Delete Enterprise Tenant</h3>
                  <p className="text-xs text-[#6B7280]">Permanent removal from platform</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#111827]">{tenant.name}</strong> (<span className="font-mono">{tenant.code}</span>)?
              This will immediately remove the tenant, all associated branches, organizations, and tenant data. This action <strong className="text-[#DC2626]">cannot be undone</strong>.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for deletion..."
                className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={deleteTenantMutation.isPending}
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[4px]"
                disabled={deleteTenantMutation.isPending}
                onClick={() => {
                  if (!deleteReason.trim()) {
                    setDeleteError('A reason is required for audit compliance.');
                    return;
                  }
                  deleteTenantMutation.mutate(
                    { tenantId: tenant.id, reason: deleteReason.trim() },
                    {
                      onSuccess: () => {
                        navigate('/tenants');
                      },
                      onError: (err: any) => {
                        setDeleteError(err.message || 'Failed to delete tenant');
                      },
                    }
                  );
                }}
              >
                {deleteTenantMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Organization Confirmation Modal */}
      {orgToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-[6px] text-[#DC2626]">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Delete Organization / Branch</h3>
                  <p className="text-xs text-[#6B7280]">Permanent removal from enterprise tenant</p>
                </div>
              </div>
              <button
                onClick={() => setOrgToDelete(null)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to permanently delete organization <strong className="text-[#111827]">{orgToDelete.name}</strong> (<span className="font-mono">{orgToDelete.code}</span>)?
              This will remove this branch and all its associated data. This action <strong className="text-[#DC2626]">cannot be undone</strong>.
            </p>

            {orgDeleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-xs text-rose-700">
                {orgDeleteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={orgDeleteReason}
                onChange={(e) => setOrgDeleteReason(e.target.value)}
                placeholder="Reason for deletion..."
                className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={deleteOrgMutation.isPending}
                onClick={() => setOrgToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[4px]"
                disabled={deleteOrgMutation.isPending}
                onClick={() => {
                  if (!orgDeleteReason.trim()) {
                    setOrgDeleteError('A reason is required for audit compliance.');
                    return;
                  }
                  if (!tenant?.id) return;
                  deleteOrgMutation.mutate(
                    {
                      organizationId: orgToDelete.id,
                      tenantId: tenant.id,
                      reason: orgDeleteReason.trim(),
                    },
                    {
                      onSuccess: () => {
                        setOrgToDelete(null);
                      },
                      onError: (err: any) => {
                        setOrgDeleteError(err.message || 'Failed to delete organization');
                      },
                    }
                  );
                }}
              >
                {deleteOrgMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
