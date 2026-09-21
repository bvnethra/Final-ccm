// application/src/components/masters/clients/ClientListPresenter.tsx
import React from 'react';
import type { Client } from '../../../types/domain';
import { ClientListView } from './ClientListView';

interface ClientListPresenterProps {
  clients: Client[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
  errorMessage?: string | null;
}

export const ClientListPresenter: React.FC<ClientListPresenterProps> = ({
  clients,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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

      <ClientListView
        clients={clients}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onToggleStatus={onToggleStatus}
        isTogglingId={isTogglingId}
      />
    </div>
  );
};
