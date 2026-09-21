// application/src/components/masters/clients/ClientDetailContainer.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useClient } from '../../../hooks/useClientMaster';
import { ClientDetailPresenter } from './ClientDetailPresenter';

export const ClientDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading, error } = useClient(id);

  return (
    <ClientDetailPresenter
      client={client}
      isLoading={isLoading}
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
