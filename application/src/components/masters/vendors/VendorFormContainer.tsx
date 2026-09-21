// application/src/components/masters/vendors/VendorFormContainer.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vendor, VendorFormData } from '../../../types/domain';
import { useCreateVendor, useUpdateVendor } from '../../../hooks/useVendorMaster';
import { validateGSTIN, validateEmail, validatePhone } from '../../../services/clientMasterService';
import { VendorFormPresenter } from './VendorFormPresenter';

interface VendorFormContainerProps {
  initialData?: Vendor;
  isEditMode?: boolean;
}

export const VendorFormContainer: React.FC<VendorFormContainerProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  const [formData, setFormData] = useState<VendorFormData>({
    vendor_code: '',
    vendor_name: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    gst_tax_number: '',
    contact_person: '',
    phone_numbers: [''],
    email_addresses: [''],
    serviced_categories: [],
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        vendor_code: initialData.vendor_code,
        vendor_name: initialData.vendor_name,
        address: initialData.address || '',
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
        serviced_categories: initialData.serviced_categories || [],
        status: initialData.status || 'ACTIVE',
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof VendorFormData, value: any) => {
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

  const handleToggleCategory = (category: string) => {
    setFormData((prev) => {
      const exists = prev.serviced_categories.includes(category);
      const next = exists
        ? prev.serviced_categories.filter((c) => c !== category)
        : [...prev.serviced_categories, category];
      return { ...prev, serviced_categories: next };
    });
  };

  const handleAddCustomCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    setFormData((prev) => {
      if (prev.serviced_categories.includes(trimmed)) return prev;
      return { ...prev, serviced_categories: [...prev.serviced_categories, trimmed] };
    });
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.vendor_name.trim()) errs.vendor_name = 'Vendor name is required';
    if (!formData.address.trim()) errs.address = 'Vendor address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.state.trim()) errs.state = 'State is required';
    if (!formData.pin.trim()) errs.pin = 'PIN code is required';
    if (!formData.contact_person.trim()) errs.contact_person = 'Contact person is required';

    // GSTIN validation
    if (!formData.gst_tax_number.trim()) {
      errs.gst_tax_number = 'GST / Tax ID is required';
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
      navigate('/masters/vendors');
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'An error occurred while saving vendor master record.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VendorFormPresenter
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
      onToggleCategory={handleToggleCategory}
      onAddCustomCategory={handleAddCustomCategory}
      onSubmit={handleSubmit}
    />
  );
};
