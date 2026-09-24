// application/src/components/layout/AppHeader.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { Badge } from '../ui/UIPrimitives';
import { LogOut, User, Building2, Bell, Clock, ArrowRight, ChevronDown, FileText } from 'lucide-react';
import { useVendorReminders } from '../../hooks/useVendorReminders';
import { useCalibrationRequests } from '../../hooks/useOperations';
import tespaLogo from '../../assets/tespa-logo.jpg';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuthContext();
  const { reminders, count: vendorCount } = useVendorReminders();
  const { data: allRequests = [] } = useCalibrationRequests();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'quotes' | 'vendors'>('quotes');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Filter requests that requested quotation and are waiting for a quote
  const pendingQuotationRequests = allRequests.filter(
    (r) =>
      r.quotation_required &&
      (r.quotation_status === 'PENDING_QUOTE' || (!r.quotation_status && r.status !== 'QUOTATION')) &&
      r.status !== 'QUOTATION' &&
      r.status !== 'APPROVED' &&
      r.status !== 'INVOICED'
  );

  const totalNotifications = vendorCount + pendingQuotationRequests.length;

  // Auto-select tab with items if current is 0
  useEffect(() => {
    if (pendingQuotationRequests.length === 0 && vendorCount > 0) {
      setActiveTab('vendors');
    } else if (pendingQuotationRequests.length > 0) {
      setActiveTab('quotes');
    }
  }, [pendingQuotationRequests.length, vendorCount]);

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

  const enterpriseName =
    user?.tenantName || user?.organizationName || (user?.tenantId ? `Tenant ${user.tenantId.slice(0, 8)}` : '');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Enterprise Context */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
          <img
            src={tespaLogo}
            alt="Tespa"
            className="h-10 w-auto max-h-10 object-contain"
          />
        </Link>

        <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
          <Building2 className="size-4 text-slate-500" />
          <span className="text-xs text-slate-500">
            Tenant:{' '}
            <span className="font-semibold text-xs text-[#0274BB]">{enterpriseName}</span>
          </span>
          <ChevronDown className="size-3.5 text-[#0274BB]" />
        </div>
      </div>

      {/* Right User Actions & Reminders */}
      <div className="flex items-center gap-3">
        {/* Notification Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0274BB]/30 cursor-pointer"
            title="Operational & Quotation Alerts"
          >
            <Bell className="size-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Lab Notifications &amp; Alerts
                </span>
                <Badge variant={totalNotifications > 0 ? 'danger' : 'secondary'} pill>
                  {totalNotifications} Total
                </Badge>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-100/50 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('quotes')}
                  className={`flex-1 py-2 px-3 font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'quotes'
                      ? 'bg-white text-[#0274BB] border-b-2 border-[#0274BB]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Quotation Needed ({pendingQuotationRequests.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vendors')}
                  className={`flex-1 py-2 px-3 font-semibold text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'vendors'
                      ? 'bg-white text-[#0274BB] border-b-2 border-[#0274BB]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="size-3.5" />
                  <span>Vendor Returns ({vendorCount})</span>
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {activeTab === 'quotes' ? (
                  pendingQuotationRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <p className="font-medium text-slate-700">No pending quotation requests</p>
                      <p className="mt-1 text-[11px] text-slate-400">All inward requests requiring quotation have been processed.</p>
                    </div>
                  ) : (
                    pendingQuotationRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 hover:bg-slate-50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#0274BB]">
                            {req.request_number}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Quotation Requested
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-snug">
                          Client: <span className="font-semibold text-slate-900">{req.clients?.client_name || 'Client'}</span>
                        </p>

                        <p className="text-[11px] text-slate-500 leading-tight">
                          {req.request_items?.length || 1} instrument(s) physically inwarded. Commercial quotation required prior to calibration.
                        </p>

                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Inward: {new Date(req.collection_date || req.created_at).toLocaleDateString()}
                          </span>
                          <Link
                            to={`/commercial/quotations/new?source=inward&requestId=${req.id}`}
                            onClick={() => setShowNotifications(false)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#0274BB] hover:underline bg-[#EFF6FF] px-2.5 py-1 rounded border border-[#BFDBFE]"
                          >
                            Raise Quotation <ArrowRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  vendorCount === 0 ? (
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
                  )
                )}
              </div>

              {totalNotifications > 0 && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500">
                    Retrieve instruments from vendors to conclude calibration and raise invoices.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Avatar */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2">
          <div className="size-8 rounded-full bg-[#EBF5FF] text-[#0274BB] flex items-center justify-center border border-blue-200/60 font-semibold text-xs shrink-0">
            <User className="size-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {user?.fullName || 'Lab Entry Technician'}
          </span>
          <ChevronDown className="size-3.5 text-slate-400" />
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1"
        >
          <LogOut className="size-4 text-slate-500" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
