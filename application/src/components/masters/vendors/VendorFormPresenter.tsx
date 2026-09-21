// application/src/components/masters/vendors/VendorFormPresenter.tsx
import React from 'react';
import type { VendorFormData } from '../../../types/domain';
import { VendorFormView } from './VendorFormView';

interface VendorFormPresenterProps {
  formData: VendorFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof VendorFormData, value: any) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
  onPhoneChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
  onEmailChange: (index: number, value: string) => void;
  onToggleCategory: (category: string) => void;
  onAddCustomCategory: (cat: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VendorFormPresenter: React.FC<VendorFormPresenterProps> = (props) => {
  return <VendorFormView {...props} />;
};
