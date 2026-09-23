// application/src/components/masters/clients/ClientListPresenter.tsx
import React from 'react';
import type { Client } from '../../../types/domain';
import { ClientListView } from './ClientListView';

interface ClientListPresenterProps {
  clients: Client[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  enterpriseCount: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
  isImportOpen: boolean;
  onToggleImport: () => void;
  onCloseImport: () => void;
  onImportBulk: (rows: any[]) => Promise<{ count: number }>;
  onImportSuccess: () => void;
  errorMessage?: string | null;
}

export const ClientListPresenter: React.FC<ClientListPresenterProps> = ({
  clients,
  totalCount,
  activeCount,
  inactiveCount,
  enterpriseCount,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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

      <ClientListView
        clients={clients}
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        enterpriseCount={enterpriseCount}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
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
