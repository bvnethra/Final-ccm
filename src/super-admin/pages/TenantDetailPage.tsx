// src/super-admin/pages/TenantDetailPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useTenantDetail, 
  useTriggerAdminInvite, 
  useTenantOrganizations, 
  useUpdateTenantStatus 
} from '../hooks/useTenants';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import { usePlatformAudit } from '../hooks/usePlatformAudit';
import { Card, Button, Badge } from '../../components/ui/UIPrimitives';
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
  ChevronDown
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

  // In-Page Status Governance Panel State (Zero Modal Architecture)
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<TenantStatus>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

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
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="size-3.5 text-slate-400" />
              <span>Enterprise Details</span>
            </h3>

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
          </Card>

          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="size-3.5 text-slate-400" />
              <span>Location & Regional Configuration</span>
            </h3>

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
          </Card>
        </div>

        {/* Right Column: Admin & Status Metadata */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 bg-white border-slate-200 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="size-3.5 text-slate-400" />
              <span>Designated Tenant Admin</span>
            </h3>

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
