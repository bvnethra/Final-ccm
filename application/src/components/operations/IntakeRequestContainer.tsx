import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useClients } from '../../hooks/useClientMaster';
import { useItemMasters } from '../../hooks/useItemMaster';
import { useVendors } from '../../hooks/useVendorMaster';
import { useCreateRequest } from '../../hooks/useOperations';
import { generateUniqueCVNumber } from '../../services/operationsService';
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
  const { data: vendors = [], isLoading: isLoadingVendors } = useVendors();
  const createRequestMutation = useCreateRequest();

  const [clientId, setClientId] = useState<string>(queryClientId || '');

  useEffect(() => {
    if (queryClientId && queryClientId !== clientId) {
      setClientId(queryClientId);
    }
  }, [queryClientId]);

  const [voucherNo, setVoucherNo] = useState<string>(() => generateUniqueCVNumber(tenantId));
  const [dcNumber, setDcNumber] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [dispatchedThrough, setDispatchedThrough] = useState<string>('');

  // Dynamically sync payment terms from Client Master when client is selected
  useEffect(() => {
    if (clientId && clients.length > 0) {
      const selected = clients.find((c) => c.id === clientId);
      if (selected?.payment_term && !paymentTerms) {
        const formatted =
          selected.payment_term === '30_DAYS'
            ? '30 Days'
            : selected.payment_term === '60_DAYS'
            ? '60 Days'
            : selected.payment_term === 'IMMEDIATE'
            ? 'Immediate'
            : String(selected.payment_term);
        setPaymentTerms(formatted);
      }
    }
  }, [clientId, clients, paymentTerms]);

  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<RequestPriority>('NORMAL');
  const [quotationRequired, setQuotationRequired] = useState<boolean>(false);
  const [clientPoRef, setClientPoRef] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<IntakeItemFormState[]>([
    {
      itemMasterId: '',
      itemCode: '',
      quantity: 1,
      serialNumber: '',
      accessories: '',
      itemCondition: 'GOOD',
      remarks: '',
      destination: 'IN_HOUSE',
      vendorId: '',
      vendorName: '',
      unitRate: 0,
    },
  ]);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemMasterId: '',
        itemCode: '',
        quantity: 1,
        serialNumber: '',
        accessories: '',
        itemCondition: 'GOOD',
        remarks: '',
        destination: 'IN_HOUSE',
        vendorId: '',
        vendorName: '',
        unitRate: 0,
      },
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

    const missingVendorItems = items.filter(
      (it) => it.destination === 'VENDOR_OUTSOURCE' && !it.vendorId
    );
    if (missingVendorItems.length > 0) {
      setErrorMessage(
        `Please select an external vendor from Vendor Master for all outsource items (${missingVendorItems.length} item(s) unassigned).`
      );
      return;
    }

    const selectedClient = clients.find((c) => c.id === clientId);

    try {
      const created = await createRequestMutation.mutateAsync({
        tenantId,
        organizationId,
        clientId,
        voucherNo,
        dcNumber,
        paymentTerms,
        dispatchedThrough,
        collectionDate,
        priority,
        quotationRequired,
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
            itemCode: it.itemCode || matchedItem?.item_code,
            quantity: it.quantity,
            serialNumber: it.serialNumber,
            accessories: it.accessories,
            itemCondition: it.itemCondition,
            destination: it.destination || 'IN_HOUSE',
            vendorId: it.vendorId,
            vendorName: it.vendorName,
            unitRate: typeof it.unitRate === 'number' ? it.unitRate : (matchedItem?.standard_cost || 0),
            remarks: it.remarks,
          };
        }),
      });

      // Navigate to created CV Voucher details
      if (created?.id) {
        navigate(`/requests/${created.id}`);
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
      vendors={vendors}
      voucherNo={voucherNo}
      setVoucherNo={setVoucherNo}
      dcNumber={dcNumber}
      setDcNumber={setDcNumber}
      paymentTerms={paymentTerms}
      setPaymentTerms={setPaymentTerms}
      dispatchedThrough={dispatchedThrough}
      setDispatchedThrough={setDispatchedThrough}
      clientId={clientId}
      setClientId={setClientId}
      collectionDate={collectionDate}
      setCollectionDate={setCollectionDate}
      priority={priority}
      setPriority={setPriority}
      quotationRequired={quotationRequired}
      setQuotationRequired={setQuotationRequired}
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
      isLoadingData={isLoadingClients || isLoadingItemMasters || isLoadingVendors}
      errorMessage={errorMessage}
    />
  );
};
