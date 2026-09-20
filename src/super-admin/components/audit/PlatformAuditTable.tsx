// src/super-admin/components/audit/PlatformAuditTable.tsx
import React, { useState } from 'react';
import { Card, Badge, Button } from '../../../components/ui/UIPrimitives';
import { usePlatformAudit } from '../../hooks/usePlatformAudit';
import type { PlatformAuditLog } from '../../types/superAdmin';
import { FileText, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';

export const PlatformAuditTable: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [inspectedLog, setInspectedLog] = useState<PlatformAuditLog | null>(null);

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
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Platform Immutable Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only security log of all tenant onboardings, status transitions, and config updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs"
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

      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs animate-pulse">
            Loading immutable audit trail from platform_audit_logs...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-sm">
            Error: {(error as Error).message}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No audit records found matching the action filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Ref</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => {
                  const isInspected = inspectedLog?.id === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors ${isInspected ? 'bg-slate-50' : ''}`}>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-slate-900">{log.actorEmail || 'System'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getActionBadgeVariant(log.action)} className="rounded-md">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {log.referenceId || '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 max-w-sm truncate">
                          {log.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant={isInspected ? 'secondary' : 'outline'}
                            size="sm"
                            className="text-xs h-7 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => setInspectedLog(isInspected ? null : log)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {isInspected ? 'Collapse' : 'Inspect'}
                            {isInspected ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </Button>
                        </td>
                      </tr>

                      {/* In-Line Expandable Inspection Row */}
                      {isInspected && (
                        <tr className="bg-slate-50/80 border-y border-slate-200">
                          <td colSpan={6} className="p-4 sm:p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">
                                    Event Payload Inspector — <span className="font-mono text-slate-500">{log.id}</span>
                                  </h4>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Recorded at {new Date(log.createdAt).toISOString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                                  onClick={() => setInspectedLog(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs">
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Action</span>
                                  <span className="font-semibold text-slate-900 mt-0.5 block">{log.action}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Actor</span>
                                  <span className="text-slate-700 mt-0.5 block font-mono">{log.actorEmail} ({log.actorRole})</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Target Ref</span>
                                  <span className="text-slate-700 mt-0.5 block font-mono">{log.referenceId || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">IP / Client</span>
                                  <span className="text-slate-700 mt-0.5 block font-mono">{log.ipAddress || 'Internal'}</span>
                                </div>
                              </div>

                              {log.reason && (
                                <div>
                                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Governance Reason / Remarks
                                  </div>
                                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800">
                                    {log.reason}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.previousState && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">
                                      Previous State
                                    </div>
                                    <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400 max-h-48">
                                      {JSON.stringify(log.previousState, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.newState && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                                      New State
                                    </div>
                                    <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400 max-h-48">
                                      {JSON.stringify(log.newState, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                    Event Metadata
                                  </div>
                                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto text-emerald-400 max-h-40">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
