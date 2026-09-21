// application/src/pages/masters/ClientCreatePage.tsx
import React from 'react';
import { ClientFormContainer } from '../../components/masters/clients/ClientFormContainer';

export const ClientCreatePage: React.FC = () => {
  return <ClientFormContainer isEditMode={false} />;
};

export default ClientCreatePage;
