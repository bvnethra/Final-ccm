// application/src/components/masters/clients/ClientListContainer.tsx
import React, { useState } from 'react';
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
  const { data: clients = [], isLoading, error } = useClients(searchQuery, statusFilter);
  const toggleMutation = useToggleClientStatus();

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
      clients={clients}
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
