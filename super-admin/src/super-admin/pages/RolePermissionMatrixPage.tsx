// src/super-admin/pages/RolePermissionMatrixPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/UIPrimitives';
import {
  useRolesWithPermissions,
  useUpdateRolePermissions,
  useCreateCustomRole,
  useDeleteCustomRole,
} from '../hooks/useRolePermissions';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import type { PermissionLevel } from '../services/rolePermissionService';
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
  Search,
  Layers,
  Lock,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const PERMISSION_LEVELS: { 
  value: PermissionLevel; 
  label: string; 
  bgClass: string; 
  textClass: string;
  borderClass: string;
}[] = [
  { value: 'NONE', label: '— None', bgClass: 'bg-slate-50', textClass: 'text-slate-400 font-mono', borderClass: 'border-slate-200' },
  { value: 'VIEW', label: 'View', bgClass: 'bg-slate-100', textClass: 'text-slate-700 font-medium', borderClass: 'border-slate-200' },
  { value: 'CREATE', label: 'Create', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700 font-medium', borderClass: 'border-emerald-200' },
  { value: 'CREATE_EDIT', label: 'Create / Edit', bgClass: 'bg-blue-50', textClass: 'text-[#0274BB] font-semibold', borderClass: 'border-blue-200' },
  { value: 'APPROVE', label: 'Approve', bgClass: 'bg-amber-50', textClass: 'text-amber-700 font-semibold', borderClass: 'border-amber-200' },
];

export default function RolePermissionMatrixPage() {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSuperAdmin = platformSession?.isSuperAdmin;

  const { data, isLoading, error } = useRolesWithPermissions();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const createRoleMutation = useCreateCustomRole();
  const deleteRoleMutation = useDeleteCustomRole();

  // Local state for interactive editing matrix: roleId -> moduleCode -> PermissionLevel
  const [matrixDraft, setMatrixDraft] = useState<Record<string, Record<string, PermissionLevel>>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

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
            reason: 'Matrix permission update from SuperAdmin Portal',
          });
        }
      }
      setIsDirty(false);
      setSuccessMsg('Role & Permission Matrix successfully committed to PostgreSQL database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save matrix permissions.');
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
      setSuccessMsg(`Role successfully created and added to permission matrix.`);
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

  const filteredModules = useMemo(() => {
    if (!data?.modules) return [];
    if (!moduleSearch.trim()) return data.modules;
    const term = moduleSearch.toLowerCase().trim();
    return data.modules.filter(
      (m) =>
        m.moduleName.toLowerCase().includes(term) ||
        m.moduleCode.toLowerCase().includes(term) ||
        (m.description && m.description.toLowerCase().includes(term))
    );
  }, [data?.modules, moduleSearch]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
        Loading Role &amp; Permission Configuration Matrix from PostgreSQL...
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1.5 shadow-xs">
          <div className="font-bold text-sm text-rose-900">Access Restricted</div>
          <div>Only Platform Super Administrators are authorized to access and configure the Role &amp; Permission Matrix.</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
          Back to Platform Users
        </Button>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm max-w-lg mx-auto text-center space-y-4 shadow-xs">
        <div>Failed to load permission matrix: {(error as Error)?.message}</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  const { roles } = data;

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Command Center Top Header Banner matching Tenant Directory */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/users')}
            className="size-10 p-0 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs shrink-0"
            title="Back to Users"
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="size-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Role &amp; Permission Matrix
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#0274BB] bg-[#E6F2FF] px-2.5 py-0.5 rounded-full border border-[#b8dcff]">
                <Shield className="size-3 text-[#0274BB]" /> SECTION 11.2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Dynamic role-based access control matrix governing operational laboratory modules ({roles.length} Roles, {data.modules.length} Modules)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleDiscardChanges}
                className="h-10 px-3.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium shadow-xs inline-flex items-center gap-1.5"
              >
                <RotateCcw className="size-4" />
                <span>Discard</span>
              </Button>
              <Button
                variant="primary"
                size="default"
                onClick={handleSaveAllChanges}
                disabled={updatePermissionsMutation.isPending}
                className="h-10 px-4 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs inline-flex items-center gap-1.5"
              >
                <Save className="size-4" />
                <span>{updatePermissionsMutation.isPending ? 'Saving...' : 'Save Matrix'}</span>
              </Button>
            </div>
          )}

          <Button
            variant={isCreateRoleOpen ? 'outline' : 'primary'}
            size="default"
            onClick={() => setIsCreateRoleOpen(!isCreateRoleOpen)}
            className={cn(
              'h-10 px-4 rounded-lg font-semibold shadow-xs inline-flex items-center gap-1.5',
              isCreateRoleOpen
                ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-[#0274BB] hover:bg-[#003B8C] text-white'
            )}
          >
            <Plus className="size-4" />
            <span>{isCreateRoleOpen ? 'Close Role Drawer' : 'Create Custom Role'}</span>
          </Button>

          <div className="hidden lg:flex flex-col items-end pl-2">
            <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
              Govern • Audit • Scale
            </span>
            <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Floating Dirty Changes Alert */}
      {isDirty && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="size-5 text-amber-600 shrink-0" />
            <span>You have unsaved changes in the permission matrix. Click <strong>Save Matrix</strong> to commit privileges to PostgreSQL.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              className="text-xs h-8 px-3 bg-white border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg"
            >
              Discard
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveAllChanges}
              disabled={updatePermissionsMutation.isPending}
              className="text-xs h-8 px-4 bg-[#0274BB] hover:bg-[#003B8C] text-white rounded-lg font-semibold"
            >
              {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Matrix'}
            </Button>
          </div>
        </div>
      )}

      {/* In-Page Create Role Panel (Zero Modal Architecture) */}
      {isCreateRoleOpen && (
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#0274BB]">
                <Shield className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Dynamic Role (FR-ROLE-01)</h3>
                <p className="text-xs text-slate-500">
                  Roles are admin-defined and dynamic. Newly created roles immediately appear as columns in the matrix below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateRoleOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QUALITY_AUDITOR"
                  value={newRoleCode}
                  onChange={(e) => setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Responsible for ISO audit compliance"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCreateRoleOpen(false)}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={createRoleMutation.isPending}
                className="text-xs bg-[#0274BB] hover:bg-[#003B8C] text-white"
              >
                {createRoleMutation.isPending ? 'Provisioning...' : 'Add Role to Matrix'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Filter & Search Toolbar matching Tenant Directory */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search operational modules, actions, and descriptions..."
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="size-3.5 text-slate-500" />
            <span>{filteredModules.length} Modules</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200">
            <Lock className="size-3.5 text-[#0274BB]" />
            <span>{roles.length} Dynamic Roles</span>
          </span>
        </div>
      </div>

      {/* 3. Role & Permission Configuration Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-600 text-xs">
                <th className="px-5 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[280px] sticky left-0 bg-[#F8FAFC] z-10 shadow-[1px_0_0_#E2E8F0]">
                  Module / Operational Action
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="px-4 py-3.5 text-center min-w-[170px] border-l border-slate-200">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-xs font-bold text-slate-900">{role.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{role.code}</div>
                      {/* Allow deleting custom non-seed roles */}
                      {!role.isSystem && isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          title="Delete custom role"
                          className="mt-1 text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
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
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={roles.length + 1} className="py-16 text-center text-slate-500">
                    No modules match "{moduleSearch}".
                  </td>
                </tr>
              ) : (
                filteredModules.map((m, idx) => (
                  <tr key={m.moduleCode} className="hover:bg-slate-50/70 transition-colors">
                    {/* Module Name Column */}
                    <td className="px-5 py-3.5 sticky left-0 z-10 bg-inherit shadow-[1px_0_0_#E2E8F0]">
                      <div className="font-semibold text-xs text-slate-900">{m.moduleName}</div>
                      {m.description && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{m.description}</div>
                      )}
                    </td>

                    {/* Role Permission Level Cells */}
                    {roles.map((role) => {
                      const currentLevel: PermissionLevel =
                        matrixDraft[role.id]?.[m.moduleCode] ??
                        role.permissions[m.moduleCode] ??
                        'NONE';

                      const currentMeta = PERMISSION_LEVELS.find((pl) => pl.value === currentLevel);

                      return (
                        <td key={`${role.id}-${m.moduleCode}`} className="py-2.5 px-3 text-center border-l border-slate-100">
                          {isSuperAdmin ? (
                            <select
                              value={currentLevel}
                              onChange={(e) =>
                                handleCellChange(role.id, m.moduleCode, e.target.value as PermissionLevel)
                              }
                              className={cn(
                                'w-full max-w-[145px] border rounded-lg px-2 py-1.5 text-xs text-center font-medium focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition shadow-2xs cursor-pointer',
                                currentMeta?.bgClass,
                                currentMeta?.textClass,
                                currentMeta?.borderClass
                              )}
                            >
                              {PERMISSION_LEVELS.map((pl) => (
                                <option key={pl.value} value={pl.value}>
                                  {pl.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={cn(
                                'inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border',
                                currentMeta?.bgClass,
                                currentMeta?.textClass,
                                currentMeta?.borderClass
                              )}
                            >
                              {currentLevel === 'NONE' ? '—' : currentLevel === 'CREATE_EDIT' ? 'Create / Edit' : currentLevel}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend / Help Bar */}
        <div className="p-4 border-t border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="font-semibold text-slate-700">Permission Levels:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono text-[11px] border border-slate-200">— None</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">View</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200">Create</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[#0274BB] font-semibold text-[11px] border border-blue-200">Create / Edit</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-200">Approve</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Matrix dynamically seeded from Section 11.2 &bull; Fully editable by Administrator
          </div>
        </div>
      </div>
    </div>
  );
}
