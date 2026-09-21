// application/src/components/masters/clients/ClientListContainer.tsx
import React, { useState } from 'react';
import { useClients, useToggleClientStatus } from '../../../hooks/useClientMaster';
import { ClientListPresenter } from './ClientListPresenter';

export const ClientListContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [togglingId, setTogglingId] = useState<string | undefined>(undefined);

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
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
