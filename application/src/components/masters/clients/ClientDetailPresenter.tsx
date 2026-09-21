// application/src/components/masters/clients/ClientDetailPresenter.tsx
import React from 'react';
import type { Client } from '../../../types/domain';
import { ClientDetailView } from './ClientDetailView';
import { Button } from '../../ui/UIPrimitives';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ClientDetailPresenterProps {
  client?: Client;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const ClientDetailPresenter: React.FC<ClientDetailPresenterProps> = ({
  client,
  isLoading,
  errorMessage,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span>Loading client profile...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !client) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage || 'Client profile not found'}
        </div>
        <Link to="/masters/clients">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return <ClientDetailView client={client} />;
};
