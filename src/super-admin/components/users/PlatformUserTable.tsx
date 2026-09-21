// src/super-admin/components/users/PlatformUserTable.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../../../components/ui/UIPrimitives';
import { 
  usePlatformUsers, 
  useUpdatePlatformUserStatus, 
  useUpdatePlatformUserRole,
  useDeletePlatformUser,
} from '../../hooks/usePlatformUsers';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformUser, PlatformRole, PlatformUserStatus } from '../../types/superAdmin';
import { Users, Plus, Shield, UserCheck, UserX, Trash2, AlertTriangle, X } from 'lucide-react';

export const PlatformUserTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSuperAdmin = platformSession?.isSuperAdmin;
  const currentUserId = platformSession?.user?.id;

  const { data: users = [], isLoading, error } = usePlatformUsers();
  const updateStatusMutation = useUpdatePlatformUserStatus();
  const updateRoleMutation = useUpdatePlatformUserRole();
  const deleteUserMutation = useDeletePlatformUser();

  const [userToDelete, setUserToDelete] = React.useState<PlatformUser | null>(null);
  const [deleteReason, setDeleteReason] = React.useState('');
  const [deleteError, setDeleteError] = React.useState('');

  const [roleChangeTarget, setRoleChangeTarget] = React.useState<{ user: PlatformUser; targetRole: PlatformRole } | null>(null);
  const [roleChangeError, setRoleChangeError] = React.useState('');

  const [statusChangeTarget, setStatusChangeTarget] = React.useState<{ user: PlatformUser; targetStatus: PlatformUserStatus } | null>(null);
  const [statusChangeError, setStatusChangeError] = React.useState('');

  const handleOpenRoleModal = (u: PlatformUser) => {
    const targetRole: PlatformRole = u.role === 'SUPER_ADMIN' ? 'PLATFORM_SUPPORT' : 'SUPER_ADMIN';
    setRoleChangeTarget({ user: u, targetRole });
    setRoleChangeError('');
  };

  const handleOpenStatusModal = (u: PlatformUser) => {
    const targetStatus: PlatformUserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusChangeTarget({ user: u, targetStatus });
    setStatusChangeError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            <span>Platform Governance Operators</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System administrators and platform support personnel with platform-level privileges.
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/users/new')}
            className="gap-1.5 text-xs font-medium bg-[#0274BB] hover:bg-[#003B8C] text-white rounded-[4px] shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Platform Operator</span>
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden bg-white border border-[#E5E7EB] rounded-[8px] shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-[#9CA3AF] font-mono text-xs animate-pulse">
            Querying platform_users from PostgreSQL...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-[#DC2626] text-sm">
            Error: {(error as Error).message}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF] text-xs">
            No platform operators registered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA] text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                  <th className="py-3 px-4">Operator Name & Email</th>
                  <th className="py-3 px-4">Platform Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registration Date</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F7FA] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#111827]">{u.fullName}</div>
                      <div className="text-xs text-[#6B7280] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#0274BB] bg-[#E6F2FF] px-2 py-0.5 rounded-[4px] border border-[#b8dcff]">
                          <Shield className="size-3 text-[#0274BB]" /> SUPER_ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#374151] bg-[#F5F7FA] px-2 py-0.5 rounded-[4px] border border-[#E5E7EB]">
                          <UserCheck className="size-3 text-[#6B7280]" /> PLATFORM_SUPPORT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'ACTIVE' ? (
                        <Badge variant="success">ACTIVE</Badge>
                      ) : (
                        <Badge variant="outline">INACTIVE</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleOpenRoleModal(u)}
                            title="Switch Role"
                          >
                            Switch Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-slate-400 hover:text-red-600"
                            onClick={() => handleOpenStatusModal(u)}
                            title={u.status === 'ACTIVE' ? 'Deactivate Operator' : 'Activate Operator'}
                          >
                            {u.status === 'ACTIVE' ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={u.id === currentUserId}
                            className={`text-xs h-7 px-2 ${
                              u.id === currentUserId 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-rose-50'
                            }`}
                            onClick={() => {
                              if (u.id === currentUserId) return;
                              setUserToDelete(u);
                              setDeleteReason('Removed by Super Admin');
                              setDeleteError('');
                            }}
                            title={u.id === currentUserId ? 'Cannot delete your own active account' : 'Delete Operator'}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-[6px] text-[#DC2626]">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Delete Platform Operator</h3>
                  <p className="text-xs text-[#6B7280]">Permanent privilege revocation</p>
                </div>
              </div>
              <button
                onClick={() => setUserToDelete(null)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to permanently delete platform operator <strong className="text-[#111827]">{userToDelete.fullName}</strong> (<span className="font-mono">{userToDelete.email}</span>)?
              This account will immediately lose all governance and administrative access. This action <strong className="text-[#DC2626]">cannot be undone</strong>.
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
                placeholder="Reason for operator removal..."
                className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#111827] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DC2626] focus-visible:border-[#DC2626]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={deleteUserMutation.isPending}
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[4px]"
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

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E6F2FF] rounded-[6px] text-[#0274BB]">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Change Platform Role</h3>
                  <p className="text-xs text-[#6B7280]">Modify system governance privileges</p>
                </div>
              </div>
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Select the new platform governance role for <strong className="text-[#111827]">{roleChangeTarget.user.fullName}</strong> (<span className="font-mono text-xs">{roleChangeTarget.user.email}</span>). Current role: <span className="font-mono font-semibold text-[#0274BB]">{roleChangeTarget.user.role}</span>.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
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
                className="w-full bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-2 text-xs text-[#111827] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] focus-visible:border-[#0274BB]"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full platform authority, tenant mutations</option>
                <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT — Read-only telemetry, support oversight</option>
              </select>
            </div>

            {roleChangeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-xs text-rose-700">
                {roleChangeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={updateRoleMutation.isPending}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs bg-[#0274BB] hover:bg-[#003B8C] text-white rounded-[4px]"
                disabled={updateRoleMutation.isPending}
                onClick={() => {
                  if (roleChangeTarget.targetRole === roleChangeTarget.user.role) {
                    setRoleChangeError(`Operator already has the '${roleChangeTarget.targetRole}' role. Please select a different role.`);
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

      {/* Status Change Modal */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-[6px] ${statusChangeTarget.targetStatus === 'INACTIVE' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {statusChangeTarget.targetStatus === 'INACTIVE' ? <UserX className="size-5" /> : <UserCheck className="size-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {statusChangeTarget.targetStatus === 'INACTIVE' ? 'Deactivate Operator' : 'Activate Operator'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Account access control</p>
                </div>
              </div>
              <button
                onClick={() => setStatusChangeTarget(null)}
                className="text-[#9CA3AF] hover:text-[#374151] p-1 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to mark <strong className="text-[#111827]">{statusChangeTarget.user.fullName}</strong> as <strong className={statusChangeTarget.targetStatus === 'INACTIVE' ? 'text-amber-600' : 'text-emerald-600'}>{statusChangeTarget.targetStatus}</strong>?
              {statusChangeTarget.targetStatus === 'INACTIVE'
                ? ' This will prevent them from signing in until reactivated.'
                : ' This will restore platform access for this operator.'}
            </p>

            {statusChangeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-[4px] text-xs text-rose-700">
                {statusChangeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
                disabled={updateStatusMutation.isPending}
                onClick={() => setStatusChangeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className={`text-xs text-white rounded-[4px] ${
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
