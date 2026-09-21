// application/src/components/masters/items/ItemMasterListContainer.tsx
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useItemMasters, useToggleItemMasterStatus } from '../../../hooks/useItemMaster';
import { createItemMastersBulk } from '../../../services/itemMasterService';
import { ItemMasterListPresenter } from './ItemMasterListPresenter';

export const ItemMasterListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const queryClient = useQueryClient();
  const { tenantId, organizationId } = useAuthContext();
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

  const handleBulkImport = async (rows: any[]) => {
    if (!tenantId) throw new Error('Tenant context missing');
    return createItemMastersBulk(tenantId, organizationId, rows);
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['item_masters'] });
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
      isImportOpen={isImportOpen}
      onToggleImport={() => setIsImportOpen((prev) => !prev)}
      onCloseImport={() => setIsImportOpen(false)}
      onImportBulk={handleBulkImport}
      onImportSuccess={handleImportSuccess}
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
