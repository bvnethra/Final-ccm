// application/src/components/masters/items/ItemMasterListPresenter.tsx
import React from 'react';
import type { ItemMaster } from '../../../types/domain';
import { ItemMasterListView } from './ItemMasterListView';

interface ItemMasterListPresenterProps {
  items: ItemMaster[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  standardCount: number;
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

export const ItemMasterListPresenter: React.FC<ItemMasterListPresenterProps> = ({
  items,
  totalCount,
  activeCount,
  inactiveCount,
  standardCount,
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

      <ItemMasterListView
        items={items}
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        standardCount={standardCount}
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
