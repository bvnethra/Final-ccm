// application/src/pages/masters/VendorCreatePage.tsx
import React from 'react';
import { VendorFormContainer } from '../../components/masters/vendors/VendorFormContainer';

export const VendorCreatePage: React.FC = () => {
  return <VendorFormContainer isEditMode={false} />;
};

export default VendorCreatePage;
