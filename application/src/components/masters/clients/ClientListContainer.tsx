// application/src/components/masters/clients/ClientListContainer.tsx
import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useClients, useToggleClientStatus } from '../../../hooks/useClientMaster';
import { createClientsBulk } from '../../../services/clientMasterService';
import { ClientListPresenter } from './ClientListPresenter';

export const ClientListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const queryClient = useQueryClient();
  const { tenantId, organizationId } = useAuthContext();
  const { data: allClients = [], isLoading, error } = useClients();
  const toggleMutation = useToggleClientStatus();

  // Dynamic metric counts directly from live database state
  const totalCount = allClients.length;
  const activeCount = useMemo(
    () => allClients.filter((c) => c.status === 'ACTIVE').length,
    [allClients]
  );
  const inactiveCount = useMemo(
    () => allClients.filter((c) => c.status === 'INACTIVE').length,
    [allClients]
  );
  const enterpriseCount = useMemo(
    () =>
      allClients.filter(
        (c) =>
          c.payment_term === '60_DAYS' ||
          Boolean(c.gst_tax_number && c.gst_tax_number.trim().length >= 15)
      ).length,
    [allClients]
  );

  // Client-side search and filtering for instant UI responsiveness
  const filteredClients = useMemo(() => {
    return allClients.filter((client) => {
      if (statusFilter === 'ACTIVE' && client.status !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && client.status !== 'INACTIVE') return false;
      if (statusFilter === 'ENTERPRISE') {
        const isEnterprise =
          client.payment_term === '60_DAYS' ||
          Boolean(client.gst_tax_number && client.gst_tax_number.trim().length >= 15);
        if (!isEnterprise) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          client.client_name?.toLowerCase().includes(q) ||
          client.client_code?.toLowerCase().includes(q) ||
          client.contact_person?.toLowerCase().includes(q) ||
          client.city?.toLowerCase().includes(q) ||
          client.phone?.toLowerCase().includes(q) ||
          client.email?.toLowerCase().includes(q) ||
          client.gst_tax_number?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allClients, searchQuery, statusFilter]);

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle client status:', err);
    } finally {
      setTogglingId(undefined);
    }
  };

  const handleBulkImport = async (rows: any[]) => {
    if (!tenantId) throw new Error('Tenant context missing');
    return createClientsBulk(tenantId, organizationId, rows);
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return (
    <ClientListPresenter
      clients={filteredClients}
      totalCount={totalCount}
      activeCount={activeCount}
      inactiveCount={inactiveCount}
      enterpriseCount={enterpriseCount}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
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
