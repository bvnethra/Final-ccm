// application/src/components/masters/vendors/VendorDetailPresenter.tsx
import React from 'react';
import type { Vendor } from '../../../types/domain';
import { VendorDetailView } from './VendorDetailView';
import { Button } from '../../ui/UIPrimitives';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface VendorDetailPresenterProps {
  vendor?: Vendor;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const VendorDetailPresenter: React.FC<VendorDetailPresenterProps> = ({
  vendor,
  isLoading,
  errorMessage,
}) => {
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-8 border-2 border-[#EF7626] border-t-transparent rounded-full animate-spin" />
          <span>Loading vendor profile...</span>
        </div>
      </div>
    );
  }

  if (errorMessage || !vendor) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage || 'Vendor record not found'}
        </div>
        <Link to="/masters/vendors">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return <VendorDetailView vendor={vendor} />;
};
