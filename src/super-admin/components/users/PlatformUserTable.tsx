// src/super-admin/components/users/PlatformUserTable.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../../../components/ui/UIPrimitives';
import { 
  usePlatformUsers, 
  useUpdatePlatformUserStatus, 
  useUpdatePlatformUserRole 
} from '../../hooks/usePlatformUsers';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import type { PlatformUser, PlatformRole, PlatformUserStatus } from '../../types/superAdmin';
import { Users, Plus, Shield, UserCheck, UserX } from 'lucide-react';

export const PlatformUserTable: React.FC = () => {
  const navigate = useNavigate();
  const { data: platformSession } = usePlatformAuth();
  const isSuperAdmin = platformSession?.isSuperAdmin;

  const { data: users = [], isLoading, error } = usePlatformUsers();
  const updateStatusMutation = useUpdatePlatformUserStatus();
  const updateRoleMutation = useUpdatePlatformUserRole();

  const handleToggleStatus = (u: PlatformUser) => {
    const targetStatus: PlatformUserStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const reason = window.prompt(`Enter reason for marking ${u.fullName} as ${targetStatus}:`);
    if (reason) {
      updateStatusMutation.mutate({
        userId: u.id,
        status: targetStatus,
        reason,
      });
    }
  };

  const handleToggleRole = (u: PlatformUser) => {
    const targetRole: PlatformRole = u.role === 'SUPER_ADMIN' ? 'PLATFORM_SUPPORT' : 'SUPER_ADMIN';
    const reason = window.prompt(`Enter reason for changing role of ${u.fullName} to ${targetRole}:`);
    if (reason) {
      updateRoleMutation.mutate({
        userId: u.id,
        role: targetRole,
        reason,
      });
    }
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
                            onClick={() => handleToggleRole(u)}
                            title="Switch Role"
                          >
                            Switch Role
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-slate-400 hover:text-red-600"
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Deactivate Operator' : 'Activate Operator'}
                          >
                            {u.status === 'ACTIVE' ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
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
    </div>
  );
};
