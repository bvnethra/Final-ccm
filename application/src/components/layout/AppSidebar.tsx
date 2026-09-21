// application/src/components/layout/AppSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  FileText,
  Receipt,
  Truck,
  Building2,
  Gauge,
  CalendarClock,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthContext } from '../../contexts/AuthContext';
import { openSuperAdminApp } from '../../services/crossAppNav';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const operationalItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Inward Requests', to: '/requests', icon: ClipboardList },
  { label: 'Lab & Calibration', to: '/lab/queue', icon: CheckCircle2 },
  { label: 'Calibration Due List', to: '/lab/due-list', icon: CalendarClock },
  { label: 'Commercial Billing', to: '/commercial/quotations', icon: FileText },
  { label: 'Tax Invoices', to: '/commercial/invoices', icon: Receipt },
  { label: 'Logistics & Dispatch', to: '/logistics/dispatches', icon: Truck },
];

const masterDataItems: NavItem[] = [
  { label: 'Client Master', to: '/masters/clients', icon: Building2 },
  { label: 'Vendor Master', to: '/masters/vendors', icon: Truck },
  { label: 'Item Master', to: '/masters/items', icon: Gauge },
  { label: 'Role & Permissions', to: '/roles', icon: Shield },
];

export const AppSidebar: React.FC = () => {
  const { user, isCollectionAgent, isLabEntryPerson, isLabApprover, isAdmin } = useAuthContext();

  // Role-based operational items filtering:
  // - Collection Agent: Inward Requests only
  // - Lab Entry Person: Lab Verification & Queue, Calibration Due List, Tax Invoices
  // - Lab Approver: Inward Requests, Lab & Calibration, Commercial Quotations, Tax Invoices
  // - Admin: Inward Requests, Lab & Calibration, Calibration Due List, Commercial Quotations, Tax Invoices (Logistics hidden)
  let visibleOperationalItems = operationalItems;
  if (isCollectionAgent) {
    visibleOperationalItems = operationalItems.filter((item) => item.to === '/requests');
  } else if (isLabEntryPerson) {
    visibleOperationalItems = operationalItems.filter((item) =>
      ['/lab/queue', '/lab/due-list', '/commercial/invoices'].includes(item.to)
    );
  } else if (isLabApprover) {
    visibleOperationalItems = operationalItems.filter((item) =>
      ['/requests', '/lab/queue', '/commercial/quotations', '/commercial/invoices'].includes(item.to)
    );
  } else if (isAdmin) {
    visibleOperationalItems = operationalItems.filter((item) =>
      ['/requests', '/lab/queue', '/lab/due-list', '/commercial/quotations', '/commercial/invoices'].includes(item.to)
    );
  }

  // Master Data filtering:
  // - Lab Entry Person: View only Client and Vendor Master (Item Master & Roles hidden)
  // - Collection Agent & Lab Approver: View Client, Vendor, Item (Roles hidden)
  // - Admin & Super Admin: View and manage all: Client, Vendor, Item, and Role & Permissions
  let visibleMasterDataItems = masterDataItems;
  if (isLabEntryPerson) {
    visibleMasterDataItems = masterDataItems.filter((item) =>
      ['/masters/clients', '/masters/vendors'].includes(item.to)
    );
  } else if (isCollectionAgent || isLabApprover) {
    visibleMasterDataItems = masterDataItems.filter((item) =>
      ['/masters/clients', '/masters/vendors', '/masters/items'].includes(item.to)
    );
  } else if (!isAdmin && !user?.isSuperAdmin) {
    visibleMasterDataItems = masterDataItems.filter((item) => item.to !== '/roles');
  }

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <span className="px-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            Operational Workflows
          </span>
          <nav className="mt-2 space-y-1">
            {visibleOperationalItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[4px] text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[#E6F2FF] text-[#0274BB]'
                        : 'text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#111827]'
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            Master Data
          </span>
          <nav className="mt-2 space-y-1">
            {visibleMasterDataItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[4px] text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[#E6F2FF] text-[#0274BB]'
                        : 'text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#111827]'
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
        {(isAdmin || user?.isSuperAdmin) && (
          <button
            onClick={() => openSuperAdminApp()}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[4px] text-xs font-semibold text-[#0274BB] bg-[#E6F2FF] hover:bg-[#d0e7ff] border border-[#b8dcff] transition cursor-pointer shadow-xs"
            title="Open Connected Super Admin Portal on localhost:5173"
          >
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-[#0274BB]" />
              <span>Super Admin Portal</span>
            </div>
            <ExternalLink className="size-3.5 text-[#0274BB]" />
          </button>
        )}

        <div className="p-3 bg-[#F5F7FA] rounded-[4px] border border-[#E5E7EB]">
          <span className="text-xs font-semibold text-[#111827] block">Nethra CCM v2.0</span>
          <span className="text-[11px] text-[#6B7280] block mt-0.5">Metrology Commercial System</span>
        </div>
      </div>
    </aside>
  );
};
