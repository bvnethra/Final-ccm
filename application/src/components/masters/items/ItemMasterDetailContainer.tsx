// application/src/components/masters/items/ItemMasterDetailContainer.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useItemMaster } from '../../../hooks/useItemMaster';
import { ItemMasterDetailPresenter } from './ItemMasterDetailPresenter';

export const ItemMasterDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, error } = useItemMaster(id);

  return (
    <ItemMasterDetailPresenter
      item={item}
      isLoading={isLoading}
      errorMessage={error ? (error as Error).message : null}
    />
  );
};
