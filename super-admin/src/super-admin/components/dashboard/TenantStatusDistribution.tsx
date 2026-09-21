// src/super-admin/components/dashboard/TenantStatusDistribution.tsx
import React from 'react';
import { Card } from '../../../components/ui/UIPrimitives';
import { Activity } from 'lucide-react';
import type { TenantStatus } from '../../types/superAdmin';

interface Props {
  distribution: {
    status: TenantStatus;
    count: number;
    percentage: number;
  }[];
  totalTenants: number;
}

export const TenantStatusDistribution: React.FC<Props> = ({ distribution, totalTenants }) => {
  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bar: 'bg-emerald-500',
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/20',
          border: 'border-emerald-800/30',
        };
      case 'DEACTIVATED':
        return {
          bar: 'bg-zinc-600',
          text: 'text-zinc-400',
          bg: 'bg-zinc-900/40',
          border: 'border-zinc-800',
        };
      default:
        return {
          bar: 'bg-zinc-600',
          text: 'text-zinc-400',
          bg: 'bg-zinc-900/40',
          border: 'border-zinc-800',
        };
    }
  };

  return (
    <Card className="p-5 bg-zinc-900/40 border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Activity className="size-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Status Distribution</h3>
            <p className="text-[11px] text-zinc-500">Live multi-tenant distribution</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
          Total: {totalTenants}
        </span>
      </div>

      {totalTenants === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          No tenant records found in database.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Distribution Progress Bar */}
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            {distribution.map((d, i) => {
              const styles = getStatusColor(d.status);
              if (d.percentage === 0) return null;
              return (
                <div
                  key={i}
                  style={{ width: `${d.percentage}%` }}
                  className={`${styles.bar} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                  title={`${d.status}: ${d.count} (${d.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-3">
            {distribution.map((d, i) => {
              const styles = getStatusColor(d.status);
              return (
                <div
                  key={i}
                  className={`p-3 rounded-md border ${styles.border} ${styles.bg} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono font-medium tracking-wide ${styles.text}`}>
                      {d.status}
                    </span>
                    <span className="text-xs font-mono font-medium text-zinc-300">
                      {d.percentage}%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-zinc-100">
                    {d.count} <span className="text-[11px] font-normal text-zinc-500">tenants</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
