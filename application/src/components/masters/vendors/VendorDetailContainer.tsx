// application/src/components/masters/vendors/VendorDetailContainer.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useVendor } from '../../../hooks/useVendorMaster';
import { VendorDetailPresenter } from './VendorDetailPresenter';

export const VendorDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading, error } = useVendor(id);

  return (
    <VendorDetailPresenter
      vendor={vendor}
      isLoading={isLoading}
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
