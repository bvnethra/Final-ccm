// application/src/components/masters/vendors/VendorListContainer.tsx
import React, { useState } from 'react';
import { useVendors, useToggleVendorStatus } from '../../../hooks/useVendorMaster';
import { VendorListPresenter } from './VendorListPresenter';

export const VendorListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);

  const { data: vendors = [], isLoading, error } = useVendors(
    searchQuery,
    statusFilter,
    categoryFilter
  );
  const toggleMutation = useToggleVendorStatus();

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle vendor status:', err);
    } finally {
      setTogglingId(undefined);
    }
  };

  return (
    <VendorListPresenter
      vendors={vendors}
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
