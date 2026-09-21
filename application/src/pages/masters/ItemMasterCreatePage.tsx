// application/src/pages/masters/ItemMasterCreatePage.tsx
import React from 'react';
import { ItemMasterFormContainer } from '../../components/masters/items/ItemMasterFormContainer';

export const ItemMasterCreatePage: React.FC = () => {
  return <ItemMasterFormContainer isEditMode={false} />;
};

export default ItemMasterCreatePage;
