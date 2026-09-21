// application/src/pages/masters/VendorEditPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVendor } from '../../hooks/useVendorMaster';
import { VendorFormContainer } from '../../components/masters/vendors/VendorFormContainer';
import { Button } from '../../components/ui/UIPrimitives';
import { ArrowLeft } from 'lucide-react';

export const VendorEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading, error } = useVendor(id);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-8 border-2 border-[#EF7626] border-t-transparent rounded-full animate-spin" />
          <span>Loading vendor record for edit...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <div className="p-4 bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {error ? (error as Error).message : 'Vendor record not found'}
        </div>
        <Link to="/masters/vendors">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Return to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return <VendorFormContainer initialData={vendor} isEditMode={true} />;
};

export default VendorEditPage;
