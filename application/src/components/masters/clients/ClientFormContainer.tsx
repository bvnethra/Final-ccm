// application/src/components/masters/clients/ClientFormContainer.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Client, ClientFormData } from '../../../types/domain';
import { useCreateClient, useUpdateClient } from '../../../hooks/useClientMaster';
import { validateGSTIN, validateEmail, validatePhone } from '../../../services/clientMasterService';
import { ClientFormPresenter } from './ClientFormPresenter';

interface ClientFormContainerProps {
  initialData?: Client;
  isEditMode?: boolean;
}

export const ClientFormContainer: React.FC<ClientFormContainerProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const [formData, setFormData] = useState<ClientFormData>({
    client_code: '',
    client_name: '',
    address: '',
    billing_address: '',
    same_as_registered_address: false,
    city: '',
    state: '',
    pin: '',
    gst_tax_number: '',
    contact_person: '',
    phone_numbers: [''],
    email_addresses: [''],
    payment_term: 'IMMEDIATE',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const isSameAddress =
        Boolean(initialData.address) &&
        (!initialData.billing_address || initialData.billing_address === initialData.address);

      setFormData({
        client_code: initialData.client_code,
        client_name: initialData.client_name,
        address: initialData.address || '',
        billing_address: initialData.billing_address || initialData.address || '',
        same_as_registered_address: isSameAddress,
        city: initialData.city || '',
        state: initialData.state || '',
        pin: initialData.pin || '',
        gst_tax_number: initialData.gst_tax_number || '',
        contact_person: initialData.contact_person || '',
        phone_numbers:
          initialData.phone_numbers && initialData.phone_numbers.length > 0
            ? initialData.phone_numbers
            : [initialData.phone || ''],
        email_addresses:
          initialData.email_addresses && initialData.email_addresses.length > 0
            ? initialData.email_addresses
            : [initialData.email || ''],
        payment_term: initialData.payment_term || 'IMMEDIATE',
        status: initialData.status || 'ACTIVE',
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof ClientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddPhone = () => {
    setFormData((prev) => ({
      ...prev,
      phone_numbers: [...prev.phone_numbers, ''],
    }));
  };

  const handleRemovePhone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      phone_numbers: prev.phone_numbers.filter((_, i) => i !== index),
    }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    setFormData((prev) => {
      const nextPhones = [...prev.phone_numbers];
      nextPhones[index] = value;
      return { ...prev, phone_numbers: nextPhones };
    });
    if (errors.phone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const handleAddEmail = () => {
    setFormData((prev) => ({
      ...prev,
      email_addresses: [...prev.email_addresses, ''],
    }));
  };

  const handleRemoveEmail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      email_addresses: prev.email_addresses.filter((_, i) => i !== index),
    }));
  };

  const handleEmailChange = (index: number, value: string) => {
    setFormData((prev) => {
      const nextEmails = [...prev.email_addresses];
      nextEmails[index] = value;
      return { ...prev, email_addresses: nextEmails };
    });
    if (errors.email) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.client_name.trim()) errs.client_name = 'Client name is required';
    if (!formData.address.trim()) errs.address = 'Registered address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state.trim()) errs.state = 'State is required';
    if (!formData.pin.trim()) errs.pin = 'PIN code is required';
    if (!formData.contact_person.trim()) errs.contact_person = 'Contact person is required';

    // GSTIN validation
    if (!formData.gst_tax_number.trim()) {
      errs.gst_tax_number = 'GSTIN / Tax ID is required';
    } else if (!validateGSTIN(formData.gst_tax_number)) {
      errs.gst_tax_number = 'Invalid GSTIN. Format: 2 numeric + 5 alpha + 4 numeric + 1 alpha + 1 alpha/numeric + Z + 1 alpha/numeric (e.g. 27AAAAA0000A1Z5)';
    }

    // Phone validation
    const validPhones = formData.phone_numbers.filter((p) => Boolean(p.trim()));
    if (validPhones.length === 0) {
      errs.phone = 'At least one phone number is required';
    } else {
      for (const p of validPhones) {
        if (!validatePhone(p)) {
          errs.phone = `Invalid phone number "${p}". Must be 10-15 digits.`;
          break;
        }
      }
    }

    // Email validation
    const validEmails = formData.email_addresses.filter((e) => Boolean(e.trim()));
    if (validEmails.length === 0) {
      errs.email = 'At least one email address is required';
    } else {
      for (const e of validEmails) {
        if (!validateEmail(e)) {
          errs.email = `Invalid email address format "${e}".`;
          break;
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      navigate('/masters/clients');
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'An error occurred while saving client master record.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientFormPresenter
      formData={formData}
      errors={errors}
      isSubmitting={isSubmitting}
      isEditMode={isEditMode}
      onChange={handleChange}
      onAddPhone={handleAddPhone}
      onRemovePhone={handleRemovePhone}
      onPhoneChange={handlePhoneChange}
      onAddEmail={handleAddEmail}
      onRemoveEmail={handleRemoveEmail}
      onEmailChange={handleEmailChange}
      onSubmit={handleSubmit}
    />
  );
};
