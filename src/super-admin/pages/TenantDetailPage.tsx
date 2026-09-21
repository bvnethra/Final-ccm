// src/super-admin/pages/TenantDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useTenantDetail, 
  useTriggerAdminInvite, 
  useTenantOrganizations, 
  useUpdateTenantStatus,
  useUpdateTenantDetails,
} from '../hooks/useTenants';
import { usePlatformConfig } from '../hooks/usePlatformConfig';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { usePlatformAudit } from '../hooks/usePlatformAudit';
import { Card, Button, Badge, Input } from '../../components/ui/UIPrimitives';
import type { TenantStatus } from '../types/superAdmin';
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
  AlertTriangle,
  X,
  ChevronDown,
  Pencil
} from 'lucide-react';

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

  // Dynamic configuration lists for editing selects
  const { data: tenantTypes = [] } = usePlatformConfig('tenant_types');
  const { data: countries = [] } = usePlatformConfig('countries');
  const { data: currencies = [] } = usePlatformConfig('currencies');
  const { data: timezones = [] } = usePlatformConfig('timezones');

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
              variant="default"
              size="sm"
              onClick={handleInvite}
              disabled={triggerInviteMutation.isPending}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Mail className="size-3.5" />
              <span>{triggerInviteMutation.isPending ? 'Dispatching...' : 'Invite Admin'}</span>
            </Button>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* In-Page Governance Status Change Panel (Zero Modal Architecture) */}
      {isStatusPanelOpen && (
        <Card className="p-5 border-slate-200 bg-white shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Governance Status Transition: {tenant.name}
              </h3>
            </div>
            <button
              onClick={() => setIsStatusPanelOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleCommitStatusChange} className="space-y-4">
            {statusError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {statusError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 font-medium uppercase tracking-wider">
                  Target Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as TenantStatus)}
                  className="flex h-9 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE (Operational & Calibrating)</option>
                  <option value="DEACTIVATED">DEACTIVATED (Archived / Closed Tenant)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-600 font-medium uppercase tracking-wider">
                  Current Status
                </label>
                <div className="h-9 px-3 flex items-center bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono">
                  {tenant.status}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-600 font-medium uppercase tracking-wider">
                Mandatory Compliance Audit Reason *
              </label>
              <textarea
                rows={2}
                required
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Explain why this status transition is being committed (written to platform_audit_logs)..."
                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>

            {targetStatus === 'DEACTIVATED' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                <span>
                  Deactivating this enterprise will restrict operational staff from initiating new calibrations.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsStatusPanelOpen(false)}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'ACTIVE' ? 'default' : 'destructive'}
                size="sm"
                type="submit"
                disabled={updateStatusMutation.isPending}
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
                  className="h-7 px-2.5 text-xs text-slate-600 gap-1 hover:text-indigo-600 hover:border-indigo-200 shadow-none"
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
                  <Pencil className="size-3 text-slate-400" />
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
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Tenant Classification
                    </label>
                    <select
                      value={enterpriseForm.tenantType}
                      onChange={(e) => setEnterpriseForm(prev => ({ ...prev, tenantType: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                  className="h-7 px-2.5 text-xs text-slate-600 gap-1 hover:text-indigo-600 hover:border-indigo-200 shadow-none"
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
                  <Pencil className="size-3 text-slate-400" />
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
                  <Input
                    label="City"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Bangalore"
                  />
                  <Input
                    label="State / Province"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g. Karnataka"
                  />
                  <Input
                    label="Pincode / Postal Code"
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="e.g. 560001"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Country
                    </label>
                    <select
                      value={locationForm.country}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, country: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Timezone
                    </label>
                    <select
                      value={locationForm.timezone}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, timezone: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Operational Currency
                    </label>
                    <select
                      value={locationForm.currency}
                      onChange={(e) => setLocationForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  className="h-7 px-2.5 text-xs text-slate-600 gap-1 hover:text-indigo-600 hover:border-indigo-200 shadow-none"
                  onClick={() => {
                    setAdminForm({
                      adminName: tenant.adminName || '',
                      adminEmail: tenant.adminEmail || '',
                    });
                    setIsEditingAdmin(true);
                  }}
                >
                  <Pencil className="size-3 text-slate-400" />
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
    </div>
  );
}
