// application/src/components/masters/items/ItemMasterListContainer.tsx
import React, { useState, useMemo } from 'react';
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
  const { data: allItems = [], isLoading, error } = useItemMasters();
  const toggleMutation = useToggleItemMasterStatus();

  // Dynamic live metric calculations (zero hardcoding)
  const totalCount = allItems.length;
  const activeCount = useMemo(
    () => allItems.filter((i) => i.status === 'ACTIVE').length,
    [allItems]
  );
  const inactiveCount = useMemo(
    () => allItems.filter((i) => i.status === 'INACTIVE').length,
    [allItems]
  );
  const standardCount = useMemo(
    () =>
      allItems.filter(
        (i) =>
          Boolean(i.calibration_frequency && i.calibration_frequency > 0) ||
          Boolean(i.range_max || i.measurement_range)
      ).length,
    [allItems]
  );

  // Client-side instant filtering across search query, status, and metrology discipline
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && item.status !== 'INACTIVE') return false;
      if (statusFilter === 'STANDARDS') {
        const isStandard =
          Boolean(item.calibration_frequency && item.calibration_frequency > 0) ||
          Boolean(item.range_max || item.measurement_range);
        if (!isStandard) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        const itemCat = item.item_category || item.item_type;
        if (itemCat !== categoryFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.item_name?.toLowerCase().includes(q) ||
          item.item_code?.toLowerCase().includes(q) ||
          item.manufacturer?.toLowerCase().includes(q) ||
          item.model?.toLowerCase().includes(q) ||
          item.serial_number?.toLowerCase().includes(q) ||
          item.item_category?.toLowerCase().includes(q) ||
          item.item_type?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allItems, searchQuery, statusFilter, categoryFilter]);

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
      items={filteredItems}
      totalCount={totalCount}
      activeCount={activeCount}
      inactiveCount={inactiveCount}
      standardCount={standardCount}
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
