// application/src/components/masters/items/ItemMasterListContainer.tsx
import React, { useState } from 'react';
import { useItemMasters, useToggleItemMasterStatus } from '../../../hooks/useItemMaster';
import { ItemMasterListPresenter } from './ItemMasterListPresenter';

export const ItemMasterListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);

  const { data: items = [], isLoading, error } = useItemMasters(
    searchQuery,
    statusFilter,
    categoryFilter
  );
  const toggleMutation = useToggleItemMasterStatus();

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle item status:', err);
    } finally {
      setTogglingId(undefined);
    }
  };

  return (
    <ItemMasterListPresenter
      items={items}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      onToggleStatus={handleToggleStatus}
      isTogglingId={togglingId}
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
