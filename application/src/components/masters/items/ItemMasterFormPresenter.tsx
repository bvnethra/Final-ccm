// application/src/components/masters/items/ItemMasterFormPresenter.tsx
import React from 'react';
import type { ItemMasterFormData } from '../../../types/domain';
import { ItemMasterFormView } from './ItemMasterFormView';

interface ItemMasterFormPresenterProps {
  formData: ItemMasterFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof ItemMasterFormData, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ItemMasterFormPresenter: React.FC<ItemMasterFormPresenterProps> = (props) => {
  return <ItemMasterFormView {...props} />;
};
