// src/super-admin/components/dashboard/TenantMetricsCards.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FlaskConical, Ban, ChevronRight } from 'lucide-react';
import type { SuperAdminDashboardMetrics } from '../../types/superAdmin';

interface Props {
  metrics: SuperAdminDashboardMetrics;
  isLoading?: boolean;
}

export const TenantMetricsCards: React.FC<Props> = ({ metrics, isLoading }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'TOTAL TENANTS',
      count: metrics.totalTenants,
      subtext: 'Registered platform enterprises',
      icon: Building2,
      cardBg: 'bg-[#eff6ff] border-[#dbeafe] hover:border-blue-300 hover:shadow-sm',
      iconBg: 'bg-blue-100 text-blue-600',
      arrowBg: 'bg-blue-100/80 text-blue-600 hover:bg-blue-200 group-hover:bg-blue-200',
      path: '/tenants',
    },
    {
      title: 'ACTIVE TENANTS',
      count: metrics.activeTenants,
      subtext: 'Operational & calibrating labs',
      icon: FlaskConical,
      cardBg: 'bg-[#f0fdf4] border-[#dcfce7] hover:border-emerald-300 hover:shadow-sm',
      iconBg: 'bg-emerald-100 text-emerald-600',
      arrowBg: 'bg-emerald-100/80 text-emerald-600 hover:bg-emerald-200 group-hover:bg-emerald-200',
      path: '/tenants?status=ACTIVE',
    },
    {
      title: 'DEACTIVATED TENANTS',
      count: metrics.deactivatedTenants,
      subtext: 'Archived / inactive enterprises',
      icon: Ban,
      cardBg: 'bg-[#fff1f2] border-[#ffe4e6] hover:border-rose-300 hover:shadow-sm',
      iconBg: 'bg-rose-100 text-rose-600',
      arrowBg: 'bg-rose-100/80 text-rose-600 hover:bg-rose-200 group-hover:bg-rose-200',
      path: '/tenants?status=DEACTIVATED',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            onClick={() => navigate(c.path)}
            className={`rounded-xl border ${c.cardBg} p-5 shadow-xs transition-all relative flex flex-col justify-between cursor-pointer group select-none`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(c.path);
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {c.title}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-0.5">
                    {isLoading ? (
                      <div className="w-12 h-8 rounded bg-slate-200 animate-pulse" />
                    ) : (
                      c.count
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(c.path);
                }}
                className={`size-7 rounded-full ${c.arrowBg} flex items-center justify-center transition-all shrink-0`}
                aria-label={`View ${c.title}`}
                title={`View ${c.title}`}
              >
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="text-xs text-slate-500 font-medium pl-1">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
