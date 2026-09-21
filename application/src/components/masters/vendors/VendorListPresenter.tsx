// application/src/components/masters/vendors/VendorListPresenter.tsx
import React from 'react';
import type { Vendor } from '../../../types/domain';
import { VendorListView } from './VendorListView';

interface VendorListPresenterProps {
  vendors: Vendor[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
  errorMessage?: string | null;
}

export const VendorListPresenter: React.FC<VendorListPresenterProps> = ({
  vendors,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onToggleStatus,
  isTogglingId,
  errorMessage,
}) => {
  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage}
        </div>
      )}

      <VendorListView
        vendors={vendors}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        onToggleStatus={onToggleStatus}
        isTogglingId={isTogglingId}
      />
    </div>
  );
};
