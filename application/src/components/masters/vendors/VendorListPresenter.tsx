// application/src/components/masters/vendors/VendorListPresenter.tsx
import React from 'react';
import type { Vendor } from '../../../types/domain';
import type { VendorOutsourcedItem } from '../../../services/vendorMasterService';
import { VendorListView } from './VendorListView';

interface VendorListPresenterProps {
  vendors: Vendor[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  labCount: number;
  outsourcedCount?: number;
  outsourcedItems?: VendorOutsourcedItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
  isImportOpen: boolean;
  onToggleImport: () => void;
  onCloseImport: () => void;
  onImportBulk: (rows: any[]) => Promise<{ count: number }>;
  onImportSuccess: () => void;
  errorMessage?: string | null;
}

export const VendorListPresenter: React.FC<VendorListPresenterProps> = ({
  vendors,
  totalCount,
  activeCount,
  inactiveCount,
  labCount,
  outsourcedCount = 0,
  outsourcedItems = [],
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onToggleStatus,
  isTogglingId,
  isImportOpen,
  onToggleImport,
  onCloseImport,
  onImportBulk,
  onImportSuccess,
  errorMessage,
}) => {
  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <VendorListView
        vendors={vendors}
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        labCount={labCount}
        outsourcedCount={outsourcedCount}
        outsourcedItems={outsourcedItems}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        onToggleStatus={onToggleStatus}
        isTogglingId={isTogglingId}
        isImportOpen={isImportOpen}
        onToggleImport={onToggleImport}
        onCloseImport={onCloseImport}
        onImportBulk={onImportBulk}
        onImportSuccess={onImportSuccess}
      />
    </div>
  );
};
