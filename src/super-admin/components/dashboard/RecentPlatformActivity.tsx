// src/super-admin/components/dashboard/RecentPlatformActivity.tsx
import React from 'react';
import { Card } from '../../../components/ui/UIPrimitives';
import { Activity, Clock, Inbox } from 'lucide-react';
import type { PlatformAuditLog } from '../../types/superAdmin';
import { Link } from 'react-router-dom';

interface Props {
  activity: PlatformAuditLog[];
}

/** Formats ISO timestamp to a human-readable relative or short date+time */
function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
}

/** Truncates a UUID to last 8 chars for display */
function truncateId(id?: string): string | null {
  if (!id) return null;
  // If it looks like a UUID (36 chars with dashes), truncate
  if (id.length === 36 && id.includes('-')) return `…${id.slice(-8)}`;
  return id.length > 16 ? `${id.slice(0, 8)}…` : id;
}

interface ActionStyle {
  dot: string;
  badge: string;
}

/** Derives semantic color from audit action string without hardcoding specific action names */
function getActionStyle(action: string): ActionStyle {
  const upper = action.toUpperCase();
  if (upper.includes('DELETE') || upper.includes('REMOVE')) {
    return { dot: 'bg-[#DC2626]', badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]' };
  }
  if (upper.includes('SUSPEND') || upper.includes('DEACTIVAT') || upper.includes('INACTIVE')) {
    return { dot: 'bg-[#F59E0B]', badge: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]' };
  }
  if (upper.includes('CREAT') || upper.includes('ONBOARD') || upper.includes('PROVISION')) {
    return { dot: 'bg-[#16A34A]', badge: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' };
  }
  if (upper.includes('ACTIVAT') || upper.includes('RESTOR') || upper.includes('ENABLE')) {
    return { dot: 'bg-[#16A34A]', badge: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]' };
  }
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('CHANGE') || upper.includes('MODIF')) {
    return { dot: 'bg-[#0274BB]', badge: 'bg-[#E6F2FF] text-[#0274BB] border-[#b8dcff]' };
  }
  // Default — informational
  return { dot: 'bg-[#0284C7]', badge: 'bg-[#F0F9FF] text-[#0284C7] border-[#BAE6FD]' };
}

export const RecentPlatformActivity: React.FC<Props> = ({ activity }) => {
  return (
    <Card className="p-5 bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-[4px] bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Recent Platform Activity</h3>
            <p className="text-xs text-[#6B7280]">Immutable audit telemetry from platform logs</p>
          </div>
        </div>
        <Link
          to="/audit"
          className="text-xs text-[#0274BB] hover:text-[#003B8C] font-semibold transition-colors flex items-center gap-1"
        >
          Full Trail →
        </Link>
      </div>

      {activity.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#9CA3AF] flex flex-col items-center gap-2">
          <Inbox className="size-6 text-[#D1D5DB]" />
          <span>No platform audit records registered yet.</span>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F7FA]">
          {activity.map((item) => {
            const style = getActionStyle(item.action);
            const shortRef = truncateId(item.referenceId);
            return (
              <div
                key={item.id}
                className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
              >
                {/* Left: dot + action badge + description */}
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`size-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span
                        className={`px-2 py-0.5 rounded-[3px] border text-[10px] font-mono font-bold tracking-tight shrink-0 ${style.badge}`}
                      >
                        {item.action}
                      </span>
                      {shortRef && (
                        <code className="text-[10px] text-[#9CA3AF] font-mono">{shortRef}</code>
                      )}
                    </div>
                    <span className="text-xs text-[#374151] line-clamp-1">
                      {item.reason || item.action}
                    </span>
                    {item.actorEmail && (
                      <span className="text-[10px] text-[#9CA3AF] font-mono">
                        {item.actorEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: timestamp */}
                <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] shrink-0 font-mono whitespace-nowrap">
                  <Clock className="size-3 text-[#D1D5DB]" />
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
