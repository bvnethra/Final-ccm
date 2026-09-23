// application/src/components/operations/IntakeRequestPresenter.tsx
import React from 'react';
import { IntakeRequestView, type IntakeItemFormState } from './IntakeRequestView';
import type { Client, ItemMaster, Vendor, RequestPriority, RequestAttachment } from '../../types/domain';

export interface IntakeRequestPresenterProps {
  clients: Client[];
  itemMasters: ItemMaster[];
  vendors: Vendor[];
  voucherNo: string;
  setVoucherNo: (v: string) => void;
  dcNumber: string;
  setDcNumber: (v: string) => void;
  paymentTerms: string;
  setPaymentTerms: (v: string) => void;
  dispatchedThrough: string;
  setDispatchedThrough: (v: string) => void;
  clientId: string;
  setClientId: (id: string) => void;
  collectionDate: string;
  setCollectionDate: (date: string) => void;
  priority: RequestPriority;
  setPriority: (p: RequestPriority) => void;
  quotationRequired: boolean;
  setQuotationRequired: (req: boolean) => void;
  clientPoRef: string;
  setClientPoRef: (ref: string) => void;
  remarks: string;
  setRemarks: (r: string) => void;
  items: IntakeItemFormState[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof IntakeItemFormState, value: any) => void;
  attachments: RequestAttachment[];
  onAddAttachments: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isLoadingData: boolean;
  errorMessage?: string;
  /** Full Client object resolved from Client Master — drives auto-fill card */
  selectedClient?: Client;
}

export const IntakeRequestPresenter: React.FC<IntakeRequestPresenterProps> = (props) => {
  if (props.isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Client &amp; Equipment Master Data...</span>
        </div>
      </div>
    );
  }

  return <IntakeRequestView {...props} />;
};
