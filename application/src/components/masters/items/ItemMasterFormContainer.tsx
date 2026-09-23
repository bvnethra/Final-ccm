// application/src/components/masters/items/ItemMasterFormContainer.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ItemMaster, ItemMasterFormData } from '../../../types/domain';
import { useCreateItemMaster, useUpdateItemMaster } from '../../../hooks/useItemMaster';
import { deriveItemCode } from '../../../services/itemMasterService';
import { ItemMasterFormPresenter } from './ItemMasterFormPresenter';

interface ItemMasterFormContainerProps {
  initialData?: ItemMaster;
  isEditMode?: boolean;
}

export const ItemMasterFormContainer: React.FC<ItemMasterFormContainerProps> = ({
  initialData,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const createMutation = useCreateItemMaster();
  const updateMutation = useUpdateItemMaster();

  const [formData, setFormData] = useState<ItemMasterFormData>({
    item_code: '',
    item_name: '',
    item_category: '',
    manufacturer: '',
    model: '',
    range_min: 0,
    range_max: 150,
    range_unit: 'mm',
    least_count: 0.01,
    least_count_unit: 'mm',
    standard_cost: 0,
    calibration_frequency: 12,
    status: 'ACTIVE',
  });

  const [isCodeCustomized, setIsCodeCustomized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        item_code: initialData.item_code,
        item_name: initialData.item_name,
        item_category: initialData.item_category || initialData.item_type || '',
        manufacturer: initialData.manufacturer || '',
        model: initialData.model || '',
        range_min: initialData.range_min ?? 0,
        range_max: initialData.range_max ?? 100,
        range_unit: initialData.range_unit || 'mm',
        least_count: initialData.least_count ?? 0.01,
        least_count_unit: initialData.least_count_unit || initialData.range_unit || 'mm',
        standard_cost: initialData.standard_cost ?? 0,
        calibration_frequency: initialData.calibration_frequency || 12,
        status: initialData.status || 'ACTIVE',
      });
      setIsCodeCustomized(true);
    }
  }, [initialData]);

  const handleChange = (field: keyof ItemMasterFormData, value: any) => {
    if (field === 'item_code') {
      setIsCodeCustomized(Boolean(value && String(value).trim()));
    }

    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-sync least count unit if range unit is changed and least count unit was same
      if (field === 'range_unit' && prev.least_count_unit === prev.range_unit) {
        next.least_count_unit = value;
      }

      // Automatically suggest dynamic item code (e.g. VC-50 for Vernier Caliper 0-50mm)
      // if not manually overridden by user and not in edit mode of existing item
      if (!isEditMode && (!isCodeCustomized || field === 'item_name')) {
        const derived = deriveItemCode(
          next.item_name,
          next.range_max,
          `${next.range_min} - ${next.range_max} ${next.range_unit}`
        );
        if (derived && derived !== 'ITM') {
          next.item_code = derived;
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.item_name.trim()) errs.item_name = 'Instrument name is required';

    if (formData.range_min === null || isNaN(formData.range_min)) {
      errs.range = 'Range Min must be numeric';
    } else if (formData.range_max === null || isNaN(formData.range_max)) {
      errs.range = 'Range Max must be numeric';
    } else if (Number(formData.range_min) > Number(formData.range_max)) {
      errs.range = `Range Min (${formData.range_min}) cannot be greater than Range Max (${formData.range_max})`;
    }

    if (!formData.range_unit.trim()) {
      errs.range = 'Measurement unit of measure is required';
    }

    if (formData.least_count === null || isNaN(formData.least_count) || Number(formData.least_count) <= 0) {
      errs.least_count = 'Least Count must be a numeric value greater than zero';
    }

    if (formData.standard_cost === null || isNaN(formData.standard_cost) || Number(formData.standard_cost) < 0) {
      errs.standard_cost = 'Standard Cost must be zero or a positive amount';
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
      navigate('/masters/items');
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'An error occurred while saving item master record.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ItemMasterFormPresenter
      formData={formData}
      errors={errors}
      isSubmitting={isSubmitting}
      isEditMode={isEditMode}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};
