// application/src/components/layout/AppHeader.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button, Badge } from '../ui/UIPrimitives';
import { LogOut, User, Building2, Bell, Clock, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { useVendorReminders } from '../../hooks/useVendorReminders';
import { openSuperAdminApp } from '../../services/crossAppNav';

export const AppHeader: React.FC = () => {
  const { user, logout, isAdmin } = useAuthContext();
  const { reminders, count } = useVendorReminders();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-[4px] bg-[#0274BB] flex items-center justify-center text-white font-bold text-base shadow-xs">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#111827] leading-none tracking-tight">
              Nethra CCM
            </h1>
            <span className="text-[11px] text-[#6B7280]">Calibration Operations</span>
          </div>
        </div>

        {user?.tenantId && (
          <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-[#E5E7EB]">
            <Building2 className="size-3.5 text-[#6B7280]" />
            <span className="text-xs font-medium text-[#374151]">
              Tenant: <span className="font-mono text-[11px] text-[#0274BB]">{user.tenantId.slice(0, 8)}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Trigger for Collection Agent (Vendor Returns <= 5 days) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0274BB]/30"
            title="Collection Agent Reminders (Vendor Returns <= 5 Days)"
          >
            <Bell className="size-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {count}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[#0274BB]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Collection Agent Reminders
                  </span>
                </div>
                <Badge variant={count > 0 ? 'danger' : 'secondary'} pill>
                  {count} Active
                </Badge>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {count === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <p className="font-medium text-slate-700">All vendor items up to date!</p>
                    <p className="mt-1 text-[11px] text-slate-400">No outsource items due for collection within 5 days.</p>
                  </div>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.poId}
                      className="p-3.5 hover:bg-slate-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#0274BB]">
                          {rem.poNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rem.isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : rem.daysRemaining <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rem.isOverdue
                            ? `Overdue (${Math.abs(rem.daysRemaining)}d)`
                            : rem.daysRemaining === 0
                            ? 'Due Today'
                            : `${rem.daysRemaining} days left`}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-snug">
                        Vendor: <span className="font-semibold text-slate-900">{rem.vendorName}</span>
                      </p>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        {rem.message}
                      </p>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Due: {new Date(rem.expectedReturnDate).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/requests/${rem.requestId}`}
                          onClick={() => setShowNotifications(false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0274BB] hover:underline"
                        >
                          Collect &amp; Invoice <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {count > 0 && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500">
                    Retrieve instruments from vendors to conclude calibration and raise invoices.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-right">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#111827]">{user?.fullName || user?.email}</span>
            <span className="text-[11px] text-[#6B7280]">{user?.roles.join(', ') || 'Operator'}</span>
          </div>
          <div className="size-8 rounded-full bg-[#E6F2FF] text-[#0274BB] flex items-center justify-center font-semibold text-xs border border-[#0274BB]/20">
            <User className="size-4" />
          </div>
        </div>

        {user?.roles.length ? (
          <Badge variant="primary" pill>
            {user.roles[0]}
          </Badge>
        ) : null}

        {(user?.isSuperAdmin || isAdmin) && (
          <Button
            variant="outlineInk"
            size="sm"
            onClick={() => openSuperAdminApp()}
            className="text-xs flex items-center gap-1.5 border-[#b8dcff] bg-[#E6F2FF] text-[#0274BB] hover:bg-[#d0e7ff] font-semibold shadow-xs cursor-pointer"
            title="Switch to Super Admin Governance Portal on localhost:5173"
          >
            <ShieldCheck className="size-3.5 text-[#0274BB]" />
            <span className="hidden sm:inline">Super Admin</span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-[#b8dcff] text-[#0274BB]">5173</span>
            <ExternalLink className="size-3 text-[#0274BB]" />
          </Button>
        )}

        <Button
          variant="outlineInk"
          size="sm"
          onClick={() => logout()}
          className="text-xs flex items-center gap-1.5"
        >
          <LogOut className="size-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
};
