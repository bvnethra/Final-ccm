// application/src/components/masters/items/ItemMasterListPresenter.tsx
import React from 'react';
import type { ItemMaster } from '../../../types/domain';
import { ItemMasterListView } from './ItemMasterListView';

interface ItemMasterListPresenterProps {
  items: ItemMaster[];
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

export const ItemMasterListPresenter: React.FC<ItemMasterListPresenterProps> = ({
  items,
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

      <ItemMasterListView
        items={items}
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
