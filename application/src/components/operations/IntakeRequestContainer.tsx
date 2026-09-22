import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useClients } from '../../hooks/useClientMaster';
import { useItemMasters } from '../../hooks/useItemMaster';
import { useCreateRequest } from '../../hooks/useOperations';
import { IntakeRequestPresenter } from './IntakeRequestPresenter';
import type { RequestPriority, RequestAttachment } from '../../types/domain';
import type { IntakeItemFormState } from './IntakeRequestView';

export const IntakeRequestContainer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClientId = searchParams.get('clientId');
  const { tenantId, organizationId, user } = useAuthContext();

  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: itemMasters = [], isLoading: isLoadingItemMasters } = useItemMasters();
  const createRequestMutation = useCreateRequest();

  const [clientId, setClientId] = useState<string>(queryClientId || '');

  useEffect(() => {
    if (queryClientId && queryClientId !== clientId) {
      setClientId(queryClientId);
    }
  }, [queryClientId]);
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<RequestPriority>('NORMAL');
  const [clientPoRef, setClientPoRef] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<IntakeItemFormState[]>([
    { itemMasterId: '', quantity: 1, serialNumber: '', accessories: '', itemCondition: 'GOOD', remarks: '' },
  ]);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { itemMasterId: '', quantity: 1, serialNumber: '', accessories: '', itemCondition: 'GOOD', remarks: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof IntakeItemFormState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddAttachments = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newAttachments: RequestAttachment[] = [];

    for (const file of fileArray) {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        base64Data,
        uploaded_at: new Date().toISOString(),
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId) {
      setErrorMessage('User session error: missing tenantId or organizationId scope.');
      return;
    }

    if (!clientId) {
      setErrorMessage('Please select a client account.');
      return;
    }

    if (items.some((it) => !it.itemMasterId || it.quantity < 1)) {
      setErrorMessage('Please ensure all items have an equipment type and valid quantity (min 1).');
      return;
    }

    const selectedClient = clients.find((c) => c.id === clientId);

    try {
      const created = await createRequestMutation.mutateAsync({
        tenantId,
        organizationId,
        clientId,
        collectionDate,
        priority,
        clientPoRef,
        remarks,
        attachments,
        collector: {
          id: user?.id,
          name: user?.fullName || user?.email || 'Collection Agent',
        },
        clientData: selectedClient,
        items: items.map((it) => {
          const matchedItem = itemMasters.find((im) => im.id === it.itemMasterId);
          return {
            itemMasterId: it.itemMasterId,
            itemMasterData: matchedItem,
            quantity: it.quantity,
            serialNumber: it.serialNumber,
            accessories: it.accessories,
            itemCondition: it.itemCondition,
            remarks: it.remarks,
          };
        }),
      });

      // Seamless flow: Step 1 Intake -> Step 2 Segregation & Routing
      if (created?.id) {
        navigate(`/requests/${created.id}/routing`);
      } else {
        navigate('/requests');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit equipment inward request.');
    }
  };

  return (
    <IntakeRequestPresenter
      clients={clients}
      itemMasters={itemMasters}
      clientId={clientId}
      setClientId={setClientId}
      collectionDate={collectionDate}
      setCollectionDate={setCollectionDate}
      priority={priority}
      setPriority={setPriority}
      clientPoRef={clientPoRef}
      setClientPoRef={setClientPoRef}
      remarks={remarks}
      setRemarks={setRemarks}
      items={items}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onUpdateItem={handleUpdateItem}
      attachments={attachments}
      onAddAttachments={handleAddAttachments}
      onRemoveAttachment={handleRemoveAttachment}
      onSubmit={handleSubmit}
      isSubmitting={createRequestMutation.isPending}
      isLoadingData={isLoadingClients || isLoadingItemMasters}
      errorMessage={errorMessage}
    />
  );
};
