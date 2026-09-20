// src/super-admin/components/dashboard/RecentPlatformActivity.tsx
import React from 'react';
import { Card, Badge } from '../../../components/ui/UIPrimitives';
import { Activity, Clock, AlertCircle } from 'lucide-react';
import type { PlatformAuditLog } from '../../types/superAdmin';
import { Link } from 'react-router-dom';

interface Props {
  activity: PlatformAuditLog[];
}

export const RecentPlatformActivity: React.FC<Props> = ({ activity }) => {
  const formatTimeAgo = (isoString: string) => {
    const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('ONBOARDED') || action.includes('CREATED')) return 'success';
    if (action.includes('DEACTIVATED') || action.includes('DELETED')) return 'destructive';
    if (action.includes('STATUS') || action.includes('UPDATED')) return 'warning';
    return 'outline';
  };

  return (
    <Card className="p-5 bg-zinc-900/40 border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Activity className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Recent Platform Activity</h3>
            <p className="text-[11px] text-zinc-500">Immutable audit telemetry from platform_audit_logs</p>
          </div>
        </div>
        <Link
          to="/audit"
          className="text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
        >
          View Full Trail &rarr;
        </Link>
      </div>

      {activity.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
          <AlertCircle className="size-4 text-zinc-600" />
          <span>No platform audit records registered yet.</span>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {activity.map((item) => (
            <div key={item.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getActionBadgeVariant(item.action)}>
                    {item.action}
                  </Badge>
                  <span className="text-zinc-200 font-medium">
                    {item.reason || item.action}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>Actor: <strong className="text-zinc-400">{item.actorEmail || 'System'}</strong></span>
                  {item.referenceId && (
                    <span>Ref: <code className="text-zinc-400 font-mono">{item.referenceId}</code></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-500 shrink-0 font-mono">
                <Clock className="size-3 text-zinc-600" />
                <span>{formatTimeAgo(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
