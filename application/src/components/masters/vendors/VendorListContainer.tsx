// application/src/components/masters/vendors/VendorListContainer.tsx
import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useVendors, useToggleVendorStatus, useVendorOutsourcedItems } from '../../../hooks/useVendorMaster';
import { createVendorsBulk } from '../../../services/vendorMasterService';
import { VendorListPresenter } from './VendorListPresenter';

export const VendorListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const queryClient = useQueryClient();
  const { tenantId, organizationId } = useAuthContext();
  const { data: allVendors = [], isLoading, error } = useVendors();
  const { data: outsourcedItems = [] } = useVendorOutsourcedItems();
  const toggleMutation = useToggleVendorStatus();

  // Dynamic metric counts directly from database state (zero hardcoding)
  const totalCount = allVendors.length;
  const activeCount = useMemo(
    () => allVendors.filter((v) => v.status === 'ACTIVE').length,
    [allVendors]
  );
  const inactiveCount = useMemo(
    () => allVendors.filter((v) => v.status === 'INACTIVE').length,
    [allVendors]
  );
  const labCount = useMemo(
    () =>
      allVendors.filter(
        (v) =>
          v.serviced_categories?.some((c) => {
            const lower = c.toLowerCase();
            return lower.includes('calib') || lower.includes('lab') || lower.includes('testing') || lower.includes('metrology');
          }) || v.vendor_name?.toLowerCase().includes('lab')
      ).length,
    [allVendors]
  );
  const outsourcedCount = outsourcedItems.length;

  // Client-side instant filtering across search, status, and category
  const filteredVendors = useMemo(() => {
    return allVendors.filter((vendor) => {
      // Status filter
      if (statusFilter === 'ACTIVE' && vendor.status !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && vendor.status !== 'INACTIVE') return false;
      if (statusFilter === 'OUTSOURCED') {
        const hasOutsourced = outsourcedItems.some(
          (i) => i.vendorId === vendor.id || (i.vendorName && i.vendorName.toLowerCase() === vendor.vendor_name.toLowerCase())
        );
        if (!hasOutsourced) return false;
      }
      if (statusFilter === 'LABS') {
        const isLab =
          vendor.serviced_categories?.some((c) => {
            const lower = c.toLowerCase();
            return lower.includes('calib') || lower.includes('lab') || lower.includes('testing') || lower.includes('metrology');
          }) || vendor.vendor_name?.toLowerCase().includes('lab');
        if (!isLab) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (!vendor.serviced_categories?.includes(categoryFilter)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          vendor.vendor_name?.toLowerCase().includes(q) ||
          vendor.vendor_code?.toLowerCase().includes(q) ||
          vendor.contact_person?.toLowerCase().includes(q) ||
          vendor.city?.toLowerCase().includes(q) ||
          vendor.phone?.toLowerCase().includes(q) ||
          vendor.email?.toLowerCase().includes(q) ||
          vendor.gst_tax_number?.toLowerCase().includes(q) ||
          vendor.serviced_categories?.some((cat) => cat.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allVendors, searchQuery, statusFilter, categoryFilter, outsourcedItems]);

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

  const handleBulkImport = async (rows: any[]) => {
    if (!tenantId) throw new Error('Tenant context missing');
    return createVendorsBulk(tenantId, organizationId, rows);
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  };

  return (
    <VendorListPresenter
      vendors={filteredVendors}
      totalCount={totalCount}
      activeCount={activeCount}
      inactiveCount={inactiveCount}
      labCount={labCount}
      outsourcedCount={outsourcedCount}
      outsourcedItems={outsourcedItems}
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

