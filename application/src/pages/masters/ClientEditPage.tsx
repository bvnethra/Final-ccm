// application/src/pages/masters/ClientEditPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClient } from '../../hooks/useClientMaster';
import { ClientFormContainer } from '../../components/masters/clients/ClientFormContainer';
import { Button } from '../../components/ui/UIPrimitives';
import { ArrowLeft } from 'lucide-react';

export const ClientEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading, error } = useClient(id);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span>Loading client record for edit...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {error ? (error as Error).message : 'Client record not found'}
        </div>
        <Link to="/masters/clients">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return <ClientFormContainer initialData={client} isEditMode={true} />;
};

export default ClientEditPage;
