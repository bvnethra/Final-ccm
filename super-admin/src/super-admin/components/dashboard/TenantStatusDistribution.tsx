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
  return (
    <Card className="p-5 bg-white border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Status Distribution</h3>
            <p className="text-xs text-slate-500">Live multi-tenant distribution</p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
          Total: {totalTenants}
        </span>
      </div>

      {totalTenants === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No tenant records found in database.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Distribution Progress Bar */}
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {distribution.map((d, i) => {
              const isGreen = d.status === 'ACTIVE';
              if (d.percentage === 0) return null;
              return (
                <div
                  key={i}
                  style={{ width: `${d.percentage}%` }}
                  className={`${isGreen ? 'bg-emerald-500' : 'bg-slate-400'} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                  title={`${d.status}: ${d.count} (${d.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 gap-4">
            {distribution.map((d, i) => {
              const isGreen = d.status === 'ACTIVE';
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${isGreen ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className={`text-xs font-bold tracking-wide ${isGreen ? 'text-emerald-700' : 'text-slate-600'}`}>
                        {d.status}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {d.percentage}%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {d.count} <span className="text-xs font-normal text-slate-500">tenants</span>
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
