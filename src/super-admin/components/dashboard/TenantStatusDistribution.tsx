// src/super-admin/components/dashboard/TenantStatusDistribution.tsx
import React from 'react';
import { Card } from '../../../components/ui/UIPrimitives';
import { BarChart2 } from 'lucide-react';
import type { TenantStatus } from '../../types/superAdmin';
import { getStatusConfig } from '../ui/StatusBadge';

interface DistributionItem {
  status: TenantStatus;
  count: number;
  percentage: number;
}

interface Props {
  distribution: DistributionItem[];
  totalTenants: number;
}

export const TenantStatusDistribution: React.FC<Props> = ({ distribution, totalTenants }) => {
  return (
    <Card className="p-5 bg-white border-[#E5E7EB] rounded-[8px] shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-[4px] bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
            <BarChart2 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Status Distribution</h3>
            <p className="text-xs text-[#6B7280]">Live tenant status breakdown</p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-[#6B7280] bg-[#F5F7FA] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
          {totalTenants} total
        </span>
      </div>

      {totalTenants === 0 ? (
        <div className="py-10 text-center text-xs text-[#9CA3AF]">
          No tenant records found in database.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Segmented Progress Bar */}
          <div className="h-2 w-full bg-[#F5F7FA] rounded-full overflow-hidden flex gap-px">
            {distribution.map((d) => {
              if (d.percentage === 0) return null;
              const cfg = getStatusConfig(d.status);
              return (
                <div
                  key={d.status}
                  style={{ width: `${d.percentage}%` }}
                  className={`${cfg.dot} transition-all duration-500`}
                  title={`${d.status}: ${d.count} (${d.percentage}%)`}
                />
              );
            })}
          </div>

          {/* Status breakdown rows */}
          <div className="space-y-2">
            {distribution.map((d) => {
              const cfg = getStatusConfig(d.status);
              return (
                <div
                  key={d.status}
                  className="flex items-center justify-between py-2 px-3 rounded-[6px] border border-[#E5E7EB] bg-[#FAFAFA]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
                      {d.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-[#111827] tabular-nums">{d.count}</span>
                    <span className="text-[#9CA3AF] tabular-nums w-10 text-right">{d.percentage}%</span>
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
