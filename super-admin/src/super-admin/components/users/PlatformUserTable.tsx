// src/super-admin/components/users/PlatformUserTable.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/UIPrimitives';
import { 
  usePlatformUsers, 
  useUpdatePlatformUserStatus, 
  useUpdatePlatformUserRole,
  useDeletePlatformUser,
} from '../../hooks/usePlatformUsers';
import { useRolesWithPermissions } from '../../hooks/useRolePermissions';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformUser, PlatformRole, PlatformUserStatus } from '../../types/superAdmin';
import { 
  Users, 
  Plus, 
  Shield, 
  UserCheck, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Calendar, 
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { TableBodySkeleton } from '../../../components/ui/Skeleton';
import { cn } from '../../../lib/utils';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
];

export const PlatformUserTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSuperAdmin = platformSession?.isSuperAdmin;
  const currentUserId = platformSession?.user?.id;

  const { data: users = [], isLoading, error } = usePlatformUsers();
  const { data: rolesData } = useRolesWithPermissions();
  const rolesList = useMemo(() => rolesData?.roles || [], [rolesData]);
  const updateStatusMutation = useUpdatePlatformUserStatus();
  const updateRoleMutation = useUpdatePlatformUserRole();
  const deleteUserMutation = useDeletePlatformUser();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [userToDelete, setUserToDelete] = useState<PlatformUser | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: PlatformUser; targetRole: PlatformRole } | null>(null);
  const [roleChangeError, setRoleChangeError] = useState('');

  const [statusChangeTarget, setStatusChangeTarget] = useState<{ user: PlatformUser; targetStatus: PlatformUserStatus } | null>(null);
  const [statusChangeError, setStatusChangeError] = useState('');

  const handleOpenRoleModal = (u: PlatformUser) => {
    setRoleChangeTarget({ user: u, targetRole: u.role });
    setRoleChangeError('');
  };

  const handleOpenStatusModal = (u: PlatformUser) => {
    const targetStatus: PlatformUserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusChangeTarget({ user: u, targetStatus });
    setStatusChangeError('');
  };

  // Filtered & Paginated Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'ALL' || u.status === statusFilter;

      const matchesRole =
        roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const activeCount = useMemo(() => users.filter((u) => u.status === 'ACTIVE').length, [users]);
  const inactiveCount = useMemo(() => users.filter((u) => u.status === 'INACTIVE').length, [users]);

  return (
    <div className="space-y-5">
      {/* 1. Command Center Top Header Banner matching Tenant Directory */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-[#0274BB] flex items-center justify-center text-white shadow-sm shrink-0">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Platform Users &amp; Operators
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              System Governance Operators &amp; Role Privilege Assignment ({users.length} Registered)
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-semibold text-[#0274BB] tracking-wide">
            Govern • Audit • Scale
          </span>
          <div className="h-0.5 w-7 bg-[#0274BB] mt-1 rounded-full" />
        </div>
      </div>

      {/* 2. Filter & Search Toolbar matching Tenant Directory */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by operator name, email, platform role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB] transition-all shadow-xs"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('ALL');
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              statusFilter === 'ALL'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All ({users.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('ACTIVE');
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              statusFilter === 'ACTIVE'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <ShieldCheck
              className={cn(
                'size-4',
                statusFilter === 'ACTIVE' ? 'text-white' : 'text-emerald-500'
              )}
            />
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('INACTIVE');
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none',
              statusFilter === 'INACTIVE'
                ? 'bg-[#0274BB] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                statusFilter === 'INACTIVE' ? 'bg-white' : 'bg-rose-500'
              )}
            />
            Inactive ({inactiveCount})
          </button>

          {/* Dynamic Role Filter Dropdown (Zero Hardcoding) */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
          >
            <option value="ALL">All Roles</option>
            {rolesList.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name || role.code}
              </option>
            ))}
          </select>

          {/* Items Per Page */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-10 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0274BB]/20 focus:border-[#0274BB]"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          {/* Actions for SuperAdmin */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => navigate('/users/permissions')}
                className="h-10 px-3.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold shadow-xs inline-flex items-center gap-1.5"
                title="Configure Role &amp; Permission Matrix"
              >
                <Shield className="size-4 text-[#0274BB]" />
                <span>Permissions</span>
              </Button>

              <Button
                variant="primary"
                size="default"
                onClick={() => navigate('/users/new')}
                className="h-10 px-4 rounded-lg bg-[#0274BB] hover:bg-[#003B8C] text-white font-semibold shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>Add Platform Operator</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Table Container matching Tenant Directory */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5 whitespace-nowrap">Operator Info</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Email &amp; Identity</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Platform Role</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Account Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Registered Date</th>
                  {isSuperAdmin && (
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <TableBodySkeleton rows={6} columns={isSuperAdmin ? 6 : 5} hasAvatar avatarShape="square" />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            Error loading operators: {(error as Error).message}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <Users className="size-12 text-slate-300" />
            <div className="text-base font-bold text-slate-800">No Platform Operators Found</div>
            <p className="text-xs text-slate-500 max-w-sm">
              {search || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                ? 'No operators matched your filter criteria. Try resetting the filters.'
                : 'No platform governance operators registered yet.'}
            </p>
            {isSuperAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/users/new')}
                className="mt-2 text-xs bg-[#0274BB]"
              >
                Add Platform Operator
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5 whitespace-nowrap">Operator Info</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Email &amp; Identity</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Platform Role</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Account Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Registered Date</th>
                  {isSuperAdmin && (
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedUsers.map((u, idx) => {
                  const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* OPERATOR INFO */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'size-10 rounded-lg flex items-center justify-center border shrink-0',
                              palette.bg,
                              palette.text,
                              palette.border
                            )}
                          >
                            <Users className="size-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm leading-tight block">
                              {u.fullName}
                            </span>
                            <span className="inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-1 whitespace-nowrap">
                              ID: {u.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL & IDENTITY */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <Mail className="size-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs">{u.email}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 ml-5">
                            {u.id === currentUserId ? 'Active Session (You)' : 'Operator Account'}
                          </div>
                        </div>
                      </td>

                      {/* PLATFORM ROLE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
                            <Shield className="size-3.5 text-[#0274BB]" />
                            <span>SUPER_ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            <Lock className="size-3 text-slate-500" />
                            <span>{u.role}</span>
                          </span>
                        )}
                      </td>

                      {/* ACCOUNT STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
                            u.status === 'ACTIVE'
                              ? 'bg-[#E8F8F0] text-[#16A34A] border-[#D1F2E0]'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          )}
                        >
                          {u.status === 'ACTIVE' ? (
                            <ShieldCheck className="size-3.5 text-[#16A34A]" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-rose-500" />
                          )}
                          <span>{u.status}</span>
                        </span>
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-slate-400" />
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      {isSuperAdmin && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
                              onClick={() => handleOpenRoleModal(u)}
                              title="Switch Operator Role"
                            >
                              Role
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(u)}
                              className={cn(
                                'size-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer',
                                u.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-200 hover:border-amber-200'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200'
                              )}
                              title={u.status === 'ACTIVE' ? 'Deactivate Operator' : 'Activate Operator'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <UserX className="size-3.5" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => navigate('/users/permissions')}
                              className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0274BB] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                              title="Role &amp; Permissions Matrix"
                            >
                              <Shield className="size-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={u.id === currentUserId}
                              onClick={() => {
                                if (u.id === currentUserId) return;
                                setUserToDelete(u);
                                setDeleteReason('Removed by Super Admin');
                                setDeleteError('');
                              }}
                              className={cn(
                                'size-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer',
                                u.id === currentUserId
                                  ? 'text-slate-200 border-slate-100 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                              )}
                              title={u.id === currentUserId ? 'Cannot delete your active account' : 'Delete Operator'}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Numbered Pagination Bar matching Tenant Directory */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + pageSize, filteredUsers.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredUsers.length}</span> operators
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={validPage <= 1}
                className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 1)
                .map((pageNum, i, arr) => {
                  const prevPage = arr[i - 1];
                  const showEllipsis = prevPage && pageNum - prevPage > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                          validPage === pageNum
                            ? 'bg-[#0274BB] text-white'
                            : 'border border-slate-200 hover:bg-white text-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage >= totalPages}
                className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Platform Operator</h3>
                  <p className="text-xs text-slate-500">Permanent privilege revocation</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete platform operator{' '}
              <strong className="text-slate-900">{userToDelete.fullName}</strong> (
              <span className="font-mono text-slate-800">{userToDelete.email}</span>)?
              This account will immediately lose all governance and administrative access. This action{' '}
              <strong className="text-rose-600">cannot be undone</strong>.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Audit Reason
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Reason for operator removal..."
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={deleteUserMutation.isPending}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-md"
                disabled={deleteUserMutation.isPending}
                onClick={() => {
                  if (!deleteReason.trim()) {
                    setDeleteError('A reason is required for audit compliance.');
                    return;
                  }
                  deleteUserMutation.mutate(
                    { userId: userToDelete.id, reason: deleteReason.trim() },
                    {
                      onSuccess: () => {
                        setUserToDelete(null);
                      },
                      onError: (err: any) => {
                        setDeleteError(err.message || 'Failed to delete platform operator');
                      },
                    }
                  );
                }}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Role Change Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg text-[#0274BB]">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Platform Role</h3>
                  <p className="text-xs text-slate-500">Modify system governance privileges</p>
                </div>
              </div>
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select the new platform governance role for{' '}
              <strong className="text-slate-900">{roleChangeTarget.user.fullName}</strong> (
              <span className="font-mono text-xs">{roleChangeTarget.user.email}</span>). Current role:{' '}
              <span className="font-mono font-semibold text-[#0274BB]">
                {roleChangeTarget.user.role}
              </span>.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Platform Role
              </label>
              <select
                value={roleChangeTarget.targetRole}
                onChange={(e) => {
                  const newRole = e.target.value as PlatformRole;
                  setRoleChangeTarget({
                    ...roleChangeTarget,
                    targetRole: newRole,
                  });
                  setRoleChangeError('');
                }}
                className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB]"
              >
                {rolesList.length === 0 ? (
                  <option value={roleChangeTarget.targetRole}>{roleChangeTarget.targetRole}</option>
                ) : (
                  rolesList.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code} — {r.name || r.description || r.code}
                    </option>
                  ))
                )}
              </select>
            </div>

            {roleChangeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                {roleChangeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={updateRoleMutation.isPending}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs bg-[#0274BB] hover:bg-[#003B8C] text-white rounded-md"
                disabled={updateRoleMutation.isPending}
                onClick={() => {
                  if (roleChangeTarget.targetRole === roleChangeTarget.user.role) {
                    setRoleChangeError(
                      `Operator already has the '${roleChangeTarget.targetRole}' role. Please select a different role.`
                    );
                    return;
                  }
                  updateRoleMutation.mutate(
                    {
                      userId: roleChangeTarget.user.id,
                      role: roleChangeTarget.targetRole,
                      reason: `Role changed to ${roleChangeTarget.targetRole} by Super Admin`,
                    },
                    {
                      onSuccess: () => {
                        setRoleChangeTarget(null);
                      },
                      onError: (err: any) => {
                        setRoleChangeError(err.message || 'Failed to update role');
                      },
                    }
                  );
                }}
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Confirm Role Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Status Change Modal */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    statusChangeTarget.targetStatus === 'INACTIVE'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {statusChangeTarget.targetStatus === 'INACTIVE' ? (
                    <UserX className="size-5" />
                  ) : (
                    <UserCheck className="size-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {statusChangeTarget.targetStatus === 'INACTIVE'
                      ? 'Deactivate Operator'
                      : 'Activate Operator'}
                  </h3>
                  <p className="text-xs text-slate-500">Account access control</p>
                </div>
              </div>
              <button
                onClick={() => setStatusChangeTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-slate-900">{statusChangeTarget.user.fullName}</strong> as{' '}
              <strong
                className={
                  statusChangeTarget.targetStatus === 'INACTIVE'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }
              >
                {statusChangeTarget.targetStatus}
              </strong>
              ?
              {statusChangeTarget.targetStatus === 'INACTIVE'
                ? ' This will prevent them from signing in until reactivated.'
                : ' This will restore platform access for this operator.'}
            </p>

            {statusChangeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
                {statusChangeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={updateStatusMutation.isPending}
                onClick={() => setStatusChangeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className={`text-xs text-white rounded-md ${
                  statusChangeTarget.targetStatus === 'INACTIVE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  updateStatusMutation.mutate(
                    {
                      userId: statusChangeTarget.user.id,
                      status: statusChangeTarget.targetStatus,
                      reason: `Status changed to ${statusChangeTarget.targetStatus} by Super Admin`,
                    },
                    {
                      onSuccess: () => {
                        setStatusChangeTarget(null);
                      },
                      onError: (err: any) => {
                        setStatusChangeError(err.message || 'Failed to update status');
                      },
                    }
                  );
                }}
              >
                {updateStatusMutation.isPending
                  ? 'Saving...'
                  : statusChangeTarget.targetStatus === 'INACTIVE'
                  ? 'Deactivate'
                  : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
