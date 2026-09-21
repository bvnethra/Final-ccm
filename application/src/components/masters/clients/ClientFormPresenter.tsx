// application/src/components/masters/clients/ClientFormPresenter.tsx
import React from 'react';
import type { ClientFormData } from '../../../types/domain';
import { ClientFormView } from './ClientFormView';

interface ClientFormPresenterProps {
  formData: ClientFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditMode: boolean;
  onChange: (field: keyof ClientFormData, value: any) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
  onPhoneChange: (index: number, value: string) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
  onEmailChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ClientFormPresenter: React.FC<ClientFormPresenterProps> = (props) => {
  return <ClientFormView {...props} />;
};
