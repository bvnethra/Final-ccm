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
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>Platform Immutable Audit Trail</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Append-only security log of all tenant onboardings, status transitions, and config updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition"
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

      <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs animate-pulse">
            Loading immutable audit trail from platform_audit_logs...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 text-sm">
            Error: {(error as Error).message}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No audit records found matching the action filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Ref</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {logs.map((log) => {
                  const isInspected = inspectedLog?.id === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`hover:bg-zinc-800/40 transition-colors ${isInspected ? 'bg-zinc-800/30' : ''}`}>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-zinc-200">{log.actorEmail || 'System'}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{log.actorRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-300">
                          {log.referenceId || '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-300 max-w-sm truncate">
                          {log.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant={isInspected ? 'secondary' : 'ghost'}
                            size="sm"
                            className="text-xs h-7 px-2.5 text-zinc-300"
                            onClick={() => setInspectedLog(isInspected ? null : log)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {isInspected ? 'Collapse' : 'Inspect'}
                            {isInspected ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </Button>
                        </td>
                      </tr>

                      {/* In-Line Expandable Inspection Row (Zero Popups) */}
                      {isInspected && (
                        <tr className="bg-zinc-950/90 border-y border-zinc-800">
                          <td colSpan={6} className="p-4 sm:p-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                                <div>
                                  <h4 className="text-xs font-semibold text-zinc-200">
                                    Event Payload Inspector — <span className="font-mono text-zinc-400">{log.id}</span>
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Recorded at {new Date(log.createdAt).toISOString()}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                                  onClick={() => setInspectedLog(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-zinc-900/60 rounded-md border border-zinc-800/80 text-xs">
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Action</span>
                                  <span className="font-semibold text-zinc-200 mt-0.5 block">{log.action}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Actor</span>
                                  <span className="text-zinc-200 mt-0.5 block font-mono">{log.actorEmail} ({log.actorRole})</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Target Ref</span>
                                  <span className="text-zinc-200 mt-0.5 block font-mono">{log.referenceId || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">IP / Client</span>
                                  <span className="text-zinc-200 mt-0.5 block font-mono">{log.ipAddress || 'Internal'}</span>
                                </div>
                              </div>

                              {log.reason && (
                                <div>
                                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                    Governance Reason / Remarks
                                  </div>
                                  <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 text-xs text-zinc-200">
                                    {log.reason}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.previousState && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-wider mb-1">
                                      Previous State
                                    </div>
                                    <pre className="p-3 bg-zinc-950 rounded-md border border-zinc-800 font-mono text-[11px] overflow-x-auto text-zinc-300 max-h-48">
                                      {JSON.stringify(log.previousState, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.newState && (
                                  <div>
                                    <div className="text-[11px] font-semibold text-emerald-400/90 uppercase tracking-wider mb-1">
                                      New State
                                    </div>
                                    <pre className="p-3 bg-zinc-950 rounded-md border border-zinc-800 font-mono text-[11px] overflow-x-auto text-zinc-300 max-h-48">
                                      {JSON.stringify(log.newState, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                    Event Metadata
                                  </div>
                                  <pre className="p-3 bg-zinc-950 rounded-md border border-zinc-800 font-mono text-[11px] overflow-x-auto text-zinc-300 max-h-40">
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
