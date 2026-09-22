// application/src/pages/audit/AuditLogsPage.tsx
import React, { useState } from 'react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
} from '../../components/ui/UIPrimitives';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import type { AuditLogEntry } from '../../services/auditLogService';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs({
    limit: 200,
    entity: selectedEntity === 'ALL' ? undefined : selectedEntity,
  });

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(term)) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(term)) ||
      (log.remarks && log.remarks.toLowerCase().includes(term))
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('INWARD') || action.includes('ROUTING')) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (action.includes('APPROV') || action.includes('CERTIFICATE') || action.includes('COMPLETE')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('REJECT') || action.includes('CANCEL') || action.includes('FAIL')) {
      return <Badge variant="error">{action}</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
            <ShieldCheck className="size-4 text-[#0274BB]" />
            Compliance &amp; Governance
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Audit Trail &amp; Activity Logs</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Immutable system logs tracking operational intake, routing, calibrations, approvals, and dispatches.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Trail
        </Button>
      </div>

      {/* Filter & Search Controls */}
      <Card className="border border-[#E5E7EB] bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by action, entity ID, actor, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gray-400 shrink-0" />
              <Select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
              >
                <option value="ALL">All Modules / Entities</option>
                <option value="CALIBRATION_REQUEST">Inward Requests</option>
                <option value="ROUTING">Item Routing (In-house/Vendor)</option>
                <option value="CALIBRATION">Calibrations &amp; Verifications</option>
                <option value="QUOTATION">Quotations &amp; Approvals</option>
                <option value="INVOICE">Tax Invoices</option>
                <option value="DISPATCH">Logistics &amp; Delivery Challans</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity Ref / ID</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Remarks / Summary</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <History className="size-8 text-gray-300 mx-auto mb-2" />
                    No audit records matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#64748B] font-mono">
                      {new Date(log.created_at).toLocaleDateString('en-GB')}{' '}
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1E293B]">
                      {log.entity.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#0274BB]">
                      {log.entity_id ? log.entity_id.slice(0, 18) : '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#334155] font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-gray-400" />
                        <span>{log.actor_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#475569] max-w-xs truncate">
                      {log.remarks || 'Standard operational transition recorded.'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2 text-[#0274BB] hover:bg-[#F0F9FF] cursor-pointer"
                      >
                        <Eye className="size-3.5 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#E2E8F0] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <History className="size-5 text-[#0274BB]" />
                <h3 className="font-bold text-[#0F172A] text-base">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-semibold">Action</span>
                <span className="font-bold text-gray-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Entity</span>
                <span className="font-bold text-gray-900">{selectedLog.entity}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Performed By</span>
                <span className="font-medium text-gray-900">{selectedLog.actor_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold">Date &amp; Time</span>
                <span className="font-mono text-gray-900">{new Date(selectedLog.created_at).toLocaleString('en-GB')}</span>
              </div>
            </div>

            {selectedLog.remarks && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-bold text-slate-700 block mb-1">Remarks / Notes</span>
                <p className="text-slate-800">{selectedLog.remarks}</p>
              </div>
            )}

            {selectedLog.new_data && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Payload / New Data</span>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded text-[11px] overflow-x-auto max-h-48 font-mono">
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
