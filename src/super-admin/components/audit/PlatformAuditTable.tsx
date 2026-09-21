// src/super-admin/components/audit/PlatformAuditTable.tsx
import React, { useState } from 'react';
import { Card, Badge } from '../../../components/ui/UIPrimitives';
import { usePlatformAudit } from '../../hooks/usePlatformAudit';
import { FileText } from 'lucide-react';

export const PlatformAuditTable: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('ALL');

  const { data: logs = [], isLoading, error } = usePlatformAudit({
    action: selectedAction,
    limit: 100,
  });

  const getActionBadgeVariant = (action: string): 'success' | 'destructive' | 'warning' | 'secondary' => {
    if (action.includes('ONBOARDED') || action.includes('CREATED')) return 'success';
    if (action.includes('DEACTIVATED') || action.includes('SUSPENDED') || action.includes('DELETED')) return 'destructive';
    if (action.includes('STATUS') || action.includes('UPDATED')) return 'warning';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0274BB]" />
            <span>Platform Immutable Audit Trail</span>
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Append-only security log of all tenant onboardings, status transitions, and config updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-[4px] px-3 py-1.5 text-xs text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#0274BB] focus:border-[#0274BB] transition shadow-2xs"
          >
            <option value="ALL">All Event Actions</option>
            <option value="TENANT_ONBOARDED">TENANT_ONBOARDED</option>
            <option value="TENANT_STATUS_ACTIVE">TENANT_STATUS_ACTIVE</option>
            <option value="TENANT_STATUS_DEACTIVATED">TENANT_STATUS_DEACTIVATED</option>
            <option value="TENANT_ADMIN_INVITED">TENANT_ADMIN_INVITED</option>
            <option value="ORGANIZATION_CREATED">ORGANIZATION_CREATED</option>
            <option value="CONFIG_ITEM_CREATED">CONFIG_ITEM_CREATED</option>
            <option value="CONFIG_ITEM_UPDATED">CONFIG_ITEM_UPDATED</option>
            <option value="PLATFORM_USER_CREATED">PLATFORM_USER_CREATED</option>
          </select>
        </div>
      </div>

      <Card className="border-[#E5E7EB] bg-white rounded-[8px] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#9CA3AF] font-mono text-xs animate-pulse">
            Loading immutable audit trail from platform_audit_logs...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-[#DC2626] text-sm">
            Error: {(error as Error).message}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-[#9CA3AF] text-xs">
            No audit records found matching the action filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F5F7FA] text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F5F7FA] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6B7280] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-[#111827]">{log.actorEmail || 'System'}</div>
                      <div className="text-[10px] text-[#6B7280] font-mono">{log.actorRole}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getActionBadgeVariant(log.action)} className="rounded-full px-2.5">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#374151] max-w-lg">
                      {log.reason || '—'}
                    </td>
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
