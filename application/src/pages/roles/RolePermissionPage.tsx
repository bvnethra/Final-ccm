// application/src/pages/roles/RolePermissionPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../../components/ui/UIPrimitives';
import {
  useRolesWithPermissions,
  useUpdateRolePermissions,
  useCreateCustomRole,
  useDeleteCustomRole,
} from '../../hooks/useRolePermissions';
import { useAuthContext } from '../../contexts/AuthContext';
import type { PermissionLevel } from '../../services/rolePermissionService';
import {
  ArrowLeft,
  Shield,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';
import { Skeleton, TableBodySkeleton } from '../../components/ui/Skeleton';

const PERMISSION_LEVELS: {
  value: PermissionLevel;
  label: string;
  badgeVariant: 'default' | 'outline' | 'success' | 'destructive' | 'secondary';
  bgClass: string;
  textClass: string;
}[] = [
  { value: 'NONE', label: '— None', badgeVariant: 'outline', bgClass: 'bg-slate-50', textClass: 'text-slate-400 font-mono' },
  { value: 'VIEW', label: 'View', badgeVariant: 'secondary', bgClass: 'bg-slate-100', textClass: 'text-slate-700 font-medium' },
  { value: 'CREATE', label: 'Create', badgeVariant: 'success', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700 font-medium' },
  { value: 'CREATE_EDIT', label: 'Create / Edit', badgeVariant: 'default', bgClass: 'bg-blue-50', textClass: 'text-[#0274BB] font-medium' },
  { value: 'APPROVE', label: 'Approve', badgeVariant: 'destructive', bgClass: 'bg-amber-50', textClass: 'text-amber-700 font-medium' },
];

export const RolePermissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, canPerform, refreshPermissions } = useAuthContext();
  const isAuthorized = Boolean(isSuperAdmin || isAdmin || canPerform('ROLE_PERMISSION_MANAGEMENT', 'VIEW'));

  const { data, isLoading, error } = useRolesWithPermissions();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const createRoleMutation = useCreateCustomRole();
  const deleteRoleMutation = useDeleteCustomRole();

  // Local state for interactive editing matrix: roleId -> moduleCode -> PermissionLevel
  const [matrixDraft, setMatrixDraft] = useState<Record<string, Record<string, PermissionLevel>>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // In-Page Create Role Panel State (Zero Modal Architecture)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Sync loaded data into draft matrix
  useEffect(() => {
    if (data?.roles) {
      const initial: Record<string, Record<string, PermissionLevel>> = {};
      data.roles.forEach((r) => {
        initial[r.id] = { ...r.permissions };
      });
      setMatrixDraft(initial);
      setIsDirty(false);
    }
  }, [data]);

  const handleCellChange = (roleId: string, moduleCode: string, newLevel: PermissionLevel) => {
    setMatrixDraft((prev) => {
      const updated = {
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [moduleCode]: newLevel,
        },
      };
      return updated;
    });
    setIsDirty(true);
  };

  const handleDiscardChanges = () => {
    if (data?.roles) {
      const initial: Record<string, Record<string, PermissionLevel>> = {};
      data.roles.forEach((r) => {
        initial[r.id] = { ...r.permissions };
      });
      setMatrixDraft(initial);
      setIsDirty(false);
    }
  };

  const handleSaveAllChanges = async () => {
    if (!data?.roles || !isDirty) return;
    setErrorMsg('');
    try {
      // Save changes for all modified roles
      for (const role of data.roles) {
        const currentDraft = matrixDraft[role.id];
        if (currentDraft) {
          await updatePermissionsMutation.mutateAsync({
            roleId: role.id,
            roleName: role.name,
            permissions: currentDraft,
          });
        }
      }
      setIsDirty(false);
      // Reload the current user's permissions from DB immediately
      await refreshPermissions();
      setSuccessMsg('Role & permission matrix saved successfully. Permissions updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save permissions matrix.');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleCode.trim()) {
      setErrorMsg('Role name and code are required.');
      return;
    }

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName.trim(),
        code: newRoleCode.trim(),
        description: newRoleDescription.trim() || undefined,
      });

      setNewRoleName('');
      setNewRoleCode('');
      setNewRoleDescription('');
      setIsCreateRoleOpen(false);
      setSuccessMsg(`Role '${newRoleName.trim()}' successfully created and added to permission matrix.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create role.');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const confirmed = window.confirm(`Permanently delete custom role '${roleName}'?`);
    if (!confirmed) return;

    try {
      await deleteRoleMutation.mutateAsync({ roleId, roleName });
      setSuccessMsg(`Role '${roleName}' removed.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete role.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <Card className="p-0 overflow-hidden bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-32" /></th>
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-28 mx-auto" /></th>
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-28 mx-auto" /></th>
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-28 mx-auto" /></th>
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-28 mx-auto" /></th>
                  <th className="py-3.5 px-4"><Skeleton className="h-4 w-28 mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <TableBodySkeleton rows={8} columns={6} hasAvatar={false} actionCol={false} />
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[8px] text-rose-800 text-xs space-y-1.5">
          <div className="font-bold text-sm text-rose-900">Access Restricted</div>
          <div>Only Administrators and Super Administrators are authorized to view and configure the Role &amp; Permission Matrix.</div>
        </div>
        <Button variant="outlineInk" size="sm" onClick={() => navigate('/')}>
          Back
        </Button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-sm max-w-lg mx-auto text-center space-y-4">
        <div>Failed to load permission matrix: {(error as Error)?.message}</div>
        <Button variant="outlineInk" size="sm" onClick={() => navigate('/')}>
          Back
        </Button>
      </div>
    );
  }

  const { modules, roles } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outlineInk"
            size="sm"
            onClick={() => navigate(-1)}
            className="size-8 p-0 border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
            title="Go Back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">
                Role &amp; Permission Management
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#0274BB] bg-[#E6F2FF] px-2 py-0.5 rounded-[4px] border border-[#b8dcff]">
                <Shield className="size-3 text-[#0274BB]" /> RBAC CONTROL MATRIX
              </span>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Admin-level role configuration and module permission matrix governing operator capabilities and actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <>
              <Button
                variant="outlineInk"
                size="sm"
                onClick={handleDiscardChanges}
                className="text-xs h-8 gap-1.5 border-[#E5E7EB] text-[#374151] hover:bg-slate-100"
              >
                <RotateCcw className="size-3.5" />
                <span>Discard</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAllChanges}
                disabled={updatePermissionsMutation.isPending}
                className="text-xs h-8 gap-1.5"
              >
                <Save className="size-3.5" />
                <span>{updatePermissionsMutation.isPending ? 'Saving...' : 'Save Matrix'}</span>
              </Button>
            </>
          )}
          <Button
            variant={isCreateRoleOpen ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setIsCreateRoleOpen(!isCreateRoleOpen)}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>{isCreateRoleOpen ? 'Close Role Form' : 'Create Custom Role'}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-[6px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-[6px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* In-Page Create Role Panel (Zero Modal Architecture) */}
      {isCreateRoleOpen && (
        <Card className="p-5 border border-[#E5E7EB] bg-white rounded-[8px] shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E6F2FF] rounded-[6px] text-[#0274BB]">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Create Custom Operational Role</h3>
                <p className="text-xs text-[#6B7280]">
                  Add a dynamic role to the organization. Newly defined roles appear as configurable columns in the matrix below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateRoleOpen(false)}
              className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quality Auditor"
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (!newRoleCode) {
                      setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    }
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                  Role Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QUALITY_AUDITOR"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs font-mono text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Operational responsibilities..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outlineInk"
                size="sm"
                type="button"
                onClick={() => setIsCreateRoleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={createRoleMutation.isPending}
                className="text-xs"
              >
                {createRoleMutation.isPending ? 'Provisioning...' : 'Add Role to Matrix'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Floating Dirty Changes Alert */}
      {isDirty && (
        <div className="p-3 rounded-[6px] bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-amber-600" />
            <span>You have unsaved changes in the permission matrix. Click <strong>Save Matrix</strong> to commit updates.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlineInk"
              size="sm"
              onClick={handleDiscardChanges}
              className="text-xs h-7 px-2.5 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAllChanges}
              disabled={updatePermissionsMutation.isPending}
              className="text-xs h-7 px-3"
            >
              {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Matrix'}
            </Button>
          </div>
        </div>
      )}

      {/* Role & Permission Configuration Matrix Table */}
      <Card className="p-0 overflow-hidden bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA]">
                <th className="py-3.5 px-4 text-[11px] font-bold text-[#374151] uppercase tracking-wider min-w-[280px] sticky left-0 bg-[#F5F7FA] z-10 shadow-[1px_0_0_#E5E7EB]">
                  Module / Action
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="py-3.5 px-4 text-center min-w-[170px] border-l border-[#E5E7EB]">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-xs font-bold text-[#111827]">{role.name}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">{role.code}</div>
                      {/* Allow deleting custom non-seed roles */}
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          title="Delete custom role"
                          className="mt-1 text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-1 transition"
                        >
                          <Trash2 className="size-3" />
                          <span>Delete Role</span>
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs">
              {modules.map((m, idx) => (
                <tr key={m.moduleCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                  {/* Module Name Column */}
                  <td className={`py-3 px-4 sticky left-0 z-10 font-medium text-[#111827] shadow-[1px_0_0_#E5E7EB] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
                    <div className="font-semibold text-xs text-[#111827]">{m.moduleName}</div>
                    {m.description && (
                      <div className="text-[11px] text-[#6B7280] font-normal mt-0.5">{m.description}</div>
                    )}
                  </td>

                  {/* Role Permission Level Cells */}
                  {roles.map((role) => {
                    const currentLevel: PermissionLevel =
                      matrixDraft[role.id]?.[m.moduleCode] ??
                      role.permissions[m.moduleCode] ??
                      'NONE';

                    return (
                      <td key={`${role.id}-${m.moduleCode}`} className="py-2.5 px-3 text-center border-l border-[#E5E7EB]">
                        <select
                          value={currentLevel}
                          onChange={(e) =>
                            handleCellChange(role.id, m.moduleCode, e.target.value as PermissionLevel)
                          }
                          className={`w-full max-w-[150px] border border-[#E5E7EB] rounded-[4px] px-2 py-1 text-xs text-center font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB] transition ${
                            currentLevel === 'NONE'
                              ? 'bg-slate-50 text-slate-400'
                              : currentLevel === 'VIEW'
                              ? 'bg-slate-100 text-slate-800'
                              : currentLevel === 'CREATE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : currentLevel === 'CREATE_EDIT'
                              ? 'bg-blue-50 text-[#0274BB] border-blue-200 font-semibold'
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                          }`}
                        >
                          {PERMISSION_LEVELS.map((pl) => (
                            <option key={pl.value} value={pl.value}>
                              {pl.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend / Help */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F5F7FA] flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B7280]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#374151]">Permission Levels:</span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-400">— None</span>
            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">View</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">Create</span>
            <span className="inline-flex items-center gap-1 text-[#0274BB] font-semibold">Create / Edit</span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">Approve</span>
          </div>

          <div className="text-[11px] text-[#9CA3AF]">
            Managed directly in PostgreSQL &bull; Fully configurable by Tenant Administrator
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RolePermissionPage;
