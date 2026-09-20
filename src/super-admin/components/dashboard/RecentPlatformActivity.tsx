// src/super-admin/components/dashboard/RecentPlatformActivity.tsx
import React from 'react';
import { Card } from '../../../components/ui/UIPrimitives';
import { Activity, Clock, AlertCircle } from 'lucide-react';
import type { PlatformAuditLog } from '../../types/superAdmin';
import { Link } from 'react-router-dom';

interface Props {
  activity: PlatformAuditLog[];
}

export const RecentPlatformActivity: React.FC<Props> = ({ activity }) => {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const getBadgeStyle = (action: string) => {
    if (action.includes('DEACTIVATED') || action.includes('SUSPENDED')) {
      return {
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      dot: 'bg-blue-500',
      badge: 'bg-blue-50 text-blue-600 border-blue-200',
    };
  };

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Platform Activity</h3>
            <p className="text-xs text-slate-500">Immutable audit telemetry from platform, audit logs</p>
          </div>
        </div>
        <Link
          to="/audit"
          className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1"
        >
          View Full Trail &rarr;
        </Link>
      </div>

      {activity.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <AlertCircle className="size-4 text-slate-300" />
          <span>No platform audit records registered yet.</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {activity.map((item) => {
            const style = getBadgeStyle(item.action);
            return (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${style.dot} shrink-0`} />
                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold tracking-tight shrink-0 ${style.badge}`}>
                    {item.action}
                  </span>
                  <div>
                    <span className="text-slate-800 font-medium">
                      {item.reason || item.action}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>Actor: <strong className="text-slate-600 font-normal">{item.actorEmail || 'System'}</strong></span>
                      {item.referenceId && (
                        <span>Ref: <code className="text-slate-500">{item.referenceId}</code></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-mono">
                  <Clock className="size-3.5 text-slate-400" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
