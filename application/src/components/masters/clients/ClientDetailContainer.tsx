// application/src/components/masters/clients/ClientDetailContainer.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useClient } from '../../../hooks/useClientMaster';
import { useInvoices, useClientPastServicedItems } from '../../../hooks/useOperations';
import { ClientDetailPresenter } from './ClientDetailPresenter';

export const ClientDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading, error } = useClient(id);
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices();
  const { data: pastServicedItems = [], isLoading: isLoadingItems } = useClientPastServicedItems(id);

  // Filter invoices to only those belonging to this client
  const clientInvoices = allInvoices.filter((inv) => inv.client_id === id);

  return (
    <ClientDetailPresenter
      client={client}
      isLoading={isLoading}
      errorMessage={error ? (error as Error).message : null}
      clientInvoices={clientInvoices}
      isLoadingInvoices={isLoadingInvoices}
      pastServicedItems={pastServicedItems}
      isLoadingItems={isLoadingItems}
    />
  );
};
