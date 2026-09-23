import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Textarea,
  Field,
  FieldLabel,
  Badge,
} from '../ui/UIPrimitives';
import type { Client, ItemMaster, Vendor, RequestPriority, ItemCondition, RequestAttachment } from '../../types/domain';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Gauge,
  AlertCircle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  UploadCloud,
  X,
  Building2,
  Hash,
  Check,
  FileCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface IntakeItemFormState {
  itemMasterId: string;
  itemCode?: string;
  quantity: number;
  serialNumber: string;
  accessories: string;
  itemCondition: ItemCondition;
  remarks: string;
  destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE';
  vendorId?: string;
  vendorName?: string;
  unitRate?: number;
}

export interface IntakeRequestViewProps {
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
  errorMessage?: string;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(type: string, name: string) {
  const lowerName = name.toLowerCase();
  if (type.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp)$/)) {
    return <ImageIcon className="size-4 text-[#0274BB] shrink-0" />;
  }
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    return <FileText className="size-4 text-[#DC2626] shrink-0" />;
  }
  if (type.includes('sheet') || lowerName.match(/\.(xlsx|xls|csv)$/)) {
    return <FileSpreadsheet className="size-4 text-[#16A34A] shrink-0" />;
  }
  return <FileText className="size-4 text-[#4B5563] shrink-0" />;
}

export const IntakeRequestView: React.FC<IntakeRequestViewProps> = ({
  clients,
  itemMasters,
  vendors,
  voucherNo,
  setVoucherNo,
  dcNumber,
  setDcNumber,
  paymentTerms,
  setPaymentTerms,
  dispatchedThrough,
  setDispatchedThrough,
  clientId,
  setClientId,
  collectionDate,
  setCollectionDate,
  priority,
  setPriority,
  quotationRequired,
  setQuotationRequired,
  clientPoRef,
  setClientPoRef,
  remarks,
  setRemarks,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const nameContainerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find((c) => c.id === clientId);
  const totalItemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const [clientCodeQuery, setClientCodeQuery] = useState(selectedClient?.client_code || '');
  const [clientNameQuery, setClientNameQuery] = useState(selectedClient?.client_name || '');
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);

  // Synchronize input fields with current selected client
  useEffect(() => {
    if (selectedClient) {
      setClientCodeQuery(selectedClient.client_code || '');
      setClientNameQuery(selectedClient.client_name || '');
    } else if (!clientId) {
      setClientCodeQuery('');
      setClientNameQuery('');
    }
  }, [clientId, selectedClient]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (codeContainerRef.current && !codeContainerRef.current.contains(e.target as Node)) {
        setIsCodeDropdownOpen(false);
      }
      if (nameContainerRef.current && !nameContainerRef.current.contains(e.target as Node)) {
        setIsNameDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Filter clients dynamically by client code (and name fallback)
  const filteredClientsByCode = useMemo(() => {
    const q = clientCodeQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 50);
    return clients
      .filter((c) =>
        (c.client_code && c.client_code.toLowerCase().includes(q)) ||
        (c.client_name && c.client_name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aCode = (a.client_code || '').toLowerCase();
        const bCode = (b.client_code || '').toLowerCase();
        const aStarts = aCode.startsWith(q);
        const bStarts = bCode.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aCode.localeCompare(bCode);
      })
      .slice(0, 50);
  }, [clients, clientCodeQuery]);

  // Filter clients dynamically by client name (and code fallback)
  const filteredClientsByName = useMemo(() => {
    const q = clientNameQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 50);
    return clients
      .filter((c) =>
        (c.client_name && c.client_name.toLowerCase().includes(q)) ||
        (c.client_code && c.client_code.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aName = (a.client_name || '').toLowerCase();
        const bName = (b.client_name || '').toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      })
      .slice(0, 50);
  }, [clients, clientNameQuery]);

  const handleSelectClient = (c: Client) => {
    setClientId(c.id);
    setClientCodeQuery(c.client_code || '');
    setClientNameQuery(c.client_name || '');
    setIsCodeDropdownOpen(false);
    setIsNameDropdownOpen(false);
  };

  const handleClearClient = () => {
    setClientId('');
    setClientCodeQuery('');
    setClientNameQuery('');
    setIsCodeDropdownOpen(false);
    setIsNameDropdownOpen(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientCodeQuery(val);
    setIsCodeDropdownOpen(true);
    if (!val.trim()) {
      setClientId('');
      setClientNameQuery('');
    } else {
      const exactMatch = clients.find(
        (c) => c.client_code?.toLowerCase() === val.trim().toLowerCase()
      );
      if (exactMatch) {
        setClientId(exactMatch.id);
        setClientNameQuery(exactMatch.client_name);
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientNameQuery(val);
    setIsNameDropdownOpen(true);
    if (!val.trim()) {
      setClientId('');
      setClientCodeQuery('');
    } else {
      const exactMatch = clients.find(
        (c) => c.client_name?.toLowerCase() === val.trim().toLowerCase()
      );
      if (exactMatch) {
        setClientId(exactMatch.id);
        setClientCodeQuery(exactMatch.client_code);
      }
    }
  };

  const handleSelectItemByCode = (index: number, code: string) => {
    const matched = itemMasters.find(
      (im) => im.item_code?.toLowerCase() === code.trim().toLowerCase()
    );
    if (matched) {
      onUpdateItem(index, 'itemMasterId', matched.id);
      onUpdateItem(index, 'itemCode', matched.item_code);
      if (!items[index].unitRate) {
        onUpdateItem(index, 'unitRate', matched.standard_cost || 0);
      }
    } else {
      onUpdateItem(index, 'itemCode', code);
    }
  };

  const handleSelectItemById = (index: number, id: string) => {
    const matched = itemMasters.find((im) => im.id === id);
    onUpdateItem(index, 'itemMasterId', id);
    if (matched) {
      onUpdateItem(index, 'itemCode', matched.item_code);
      if (!items[index].unitRate) {
        onUpdateItem(index, 'unitRate', matched.standard_cost || 0);
      }
    }
  };

  const cvSubtotal = items.reduce(
    (sum, it) => {
      const matched = itemMasters.find((im) => im.id === it.itemMasterId);
      const rate = typeof it.unitRate === 'number' ? it.unitRate : (matched?.standard_cost || 0);
      return sum + (Number(it.quantity) || 0) * rate;
    },
    0
  );
  const cvCgst = Math.round(cvSubtotal * 0.09 * 100) / 100;
  const cvSgst = Math.round(cvSubtotal * 0.09 * 100) / 100;
  const cvTotal = Math.round(cvSubtotal + cvCgst + cvSgst);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddAttachments(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddAttachments(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/requests">
            <Button variant="secondary" size="sm" type="button">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827]">CV Generation — Equipment Inward &amp; Sale Order / CV</h1>
              <Badge variant="primary" className="font-mono text-xs">CV REGISTER</Badge>
            </div>
            <p className="text-sm text-[#6B7280]">
              Lifecycle Step 4 &amp; 5: Customer Gauge Intake, Routing (Lab / Vendor), and Official Voucher Generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F5F7FA] border border-[#E5E7EB] px-3 py-1.5 rounded-[4px] text-xs font-semibold text-[#374151]">
            <Gauge className="size-4 text-[#0274BB]" />
            <span>Total Units: </span>
            <span className="text-[#0274BB] font-mono font-bold">{totalItemCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1.5 rounded-[4px] text-xs font-semibold text-[#0274BB]">
            <FileCheck className="size-4 text-[#0274BB]" />
            <span>CV Voucher: </span>
            <span className="font-mono font-bold">{voucherNo}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Section 1: Inward Visit & Client Account Details */}
        <Card className="overflow-visible">
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center shrink-0">
                  <Building2 className="size-5 text-[#0274BB]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#111827]">
                    1. Inward Visit &amp; Client Account Details
                  </CardTitle>
                  <CardDescription className="text-xs text-[#6B7280]">
                    Select client account and specify collection schedule, priority turnaround, and reference numbers
                  </CardDescription>
                </div>
              </div>
              <Link
                to="/masters/clients/new?returnUrl=/requests/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0274BB] hover:bg-[#EBF5FF] bg-white px-3 py-1.5 rounded-[4px] border border-[#BFDBFE] transition-colors self-start sm:self-auto"
                title="Register a new client in Client Master"
              >
                <Plus className="size-3.5" /> + New Client Profile
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Client Search Row: Balanced 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Client Code Search/Filter Field */}
              <div ref={codeContainerRef} className="relative md:col-span-1">
                <div className="flex items-center justify-between mb-1.5">
                  <FieldLabel htmlFor="client-code-input" className="cursor-pointer">
                    Client Code {selectedClient && <span className="text-[#16A34A] text-xs font-semibold ml-1">✓ Linked</span>}
                  </FieldLabel>
                  <span className="text-[11px] text-[#6B7280]">
                    {clients.length} in Master
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Hash className="size-4" />
                  </div>
                  <Input
                    id="client-code-input"
                    type="text"
                    placeholder="Search Code (e.g. CLI-2026-00165)..."
                    value={clientCodeQuery}
                    onChange={handleCodeChange}
                    onFocus={() => setIsCodeDropdownOpen(true)}
                    className="pl-9 pr-8"
                    autoComplete="off"
                  />
                  {clientCodeQuery && (
                    <button
                      type="button"
                      onClick={handleClearClient}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#9CA3AF] hover:text-[#374151] cursor-pointer"
                      title="Clear client selection"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown for Client Code */}
                {isCodeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-900 border border-[#D1D5DB] dark:border-neutral-700 rounded-md shadow-2xl overflow-hidden max-h-64 flex flex-col">
                    <div className="px-3 py-1.5 bg-[#F9FAFB] dark:bg-neutral-800 border-b border-[#E5E7EB] dark:border-neutral-700 flex items-center justify-between text-xs text-[#6B7280]">
                      <span>{filteredClientsByCode.length} matching code{filteredClientsByCode.length === 1 ? '' : 's'}</span>
                      <span className="text-[10px] text-[#9CA3AF]">Click code to select</span>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-[#F3F4F6] dark:divide-neutral-800">
                      {filteredClientsByCode.length > 0 ? (
                        filteredClientsByCode.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                            className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-[#F0F7FF] dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                              c.id === clientId ? 'bg-[#EFF6FF] dark:bg-neutral-800/80 font-medium' : ''
                            }`}
                          >
                            <span className="inline-block px-2 py-0.5 font-mono text-xs font-semibold bg-[#EFF6FF] text-[#0274BB] border border-[#BFDBFE] rounded shrink-0">
                              {c.client_code}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#111827] dark:text-neutral-100 truncate">
                                {c.client_name}
                              </div>
                              {(c.city || c.contact_person) && (
                                <div className="text-[11px] text-[#6B7280] dark:text-neutral-400 truncate">
                                  {[c.city, c.state, c.contact_person].filter(Boolean).join(' • ')}
                                </div>
                              )}
                            </div>
                            {c.id === clientId && (
                              <Check className="size-4 text-[#16A34A] shrink-0 self-center" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-[#6B7280] mb-2">
                            No client code found matching "<span className="font-semibold text-[#374151]">{clientCodeQuery}</span>"
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/masters/clients/new?returnUrl=/requests/new')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0274BB] text-white rounded-[4px] hover:bg-[#025a92] cursor-pointer"
                          >
                            <Plus className="size-3.5" /> + Create New Client Master
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Client Account / Name Search/Filter Field */}
              <div ref={nameContainerRef} className="relative md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <FieldLabel htmlFor="client-account-input" className="cursor-pointer">
                    Client Legal Account / Organization Name <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <span className="text-[11px] text-[#6B7280]">
                    Select to link billing &amp; address
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Building2 className="size-4" />
                  </div>
                  <Input
                    id="client-account-input"
                    type="text"
                    placeholder="Type legal client name (e.g. Acme Precision Tech)..."
                    value={clientNameQuery}
                    onChange={handleNameChange}
                    onFocus={() => setIsNameDropdownOpen(true)}
                    className="pl-9 pr-8"
                    autoComplete="off"
                    required={!clientId}
                  />
                  {clientNameQuery && (
                    <button
                      type="button"
                      onClick={handleClearClient}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#9CA3AF] hover:text-[#374151] cursor-pointer"
                      title="Clear client selection"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown for Client Account */}
                {isNameDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-900 border border-[#D1D5DB] dark:border-neutral-700 rounded-md shadow-2xl overflow-hidden max-h-64 flex flex-col">
                    <div className="px-3 py-1.5 bg-[#F9FAFB] dark:bg-neutral-800 border-b border-[#E5E7EB] dark:border-neutral-700 flex items-center justify-between text-xs text-[#6B7280]">
                      <span>{filteredClientsByName.length} matching account{filteredClientsByName.length === 1 ? '' : 's'}</span>
                      <span className="text-[10px] text-[#9CA3AF]">Click client to select</span>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-[#F3F4F6] dark:divide-neutral-800">
                      {filteredClientsByName.length > 0 ? (
                        filteredClientsByName.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                            className={`w-full text-left px-3 py-2.5 flex items-start justify-between gap-2.5 hover:bg-[#F0F7FF] dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                              c.id === clientId ? 'bg-[#EFF6FF] dark:bg-neutral-800/80 font-medium' : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#111827] dark:text-neutral-100 truncate">
                                {c.client_name}
                              </div>
                              <div className="text-[11px] text-[#6B7280] dark:text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] bg-[#EFF6FF] text-[#0274BB] px-1.5 py-0.2 rounded border border-[#BFDBFE]">
                                  {c.client_code}
                                </span>
                                {[c.city, c.state, c.contact_person].filter(Boolean).join(' • ')}
                              </div>
                            </div>
                            {c.id === clientId && (
                              <Check className="size-4 text-[#16A34A] shrink-0 self-center" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-[#6B7280] mb-2">
                            No client found matching "<span className="font-semibold text-[#374151]">{clientNameQuery}</span>"
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('/masters/clients/new?returnUrl=/requests/new')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0274BB] text-white rounded-[4px] hover:bg-[#025a92] cursor-pointer"
                          >
                            <Plus className="size-3.5" /> + Create New Client Master
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client Master Auto-fill Summary Card */}
            {selectedClient ? (
              <div className="bg-[#F0FDF4] rounded-lg border border-[#BBF7D0] overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#DCFCE7] border-b border-[#BBF7D0]">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-[#16A34A]" />
                    <span className="font-bold text-[#166534] text-sm">{selectedClient.client_name}</span>
                    <span className="font-mono text-xs font-semibold bg-white text-[#15803D] px-2 py-0.5 rounded border border-[#86EFAC]">
                      {selectedClient.client_code}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#15803D] bg-[#BBFCD0] px-2 py-0.5 rounded-full border border-[#86EFAC]">
                      Auto-filled from Client Master
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearClient}
                    className="self-start md:self-auto text-xs text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2]"
                  >
                    Change Client
                  </Button>
                </div>
                {/* Card Body: Grid of auto-filled fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#BBF7D0] text-[11px]">
                  <div className="p-3 space-y-0.5">
                    <div className="text-[10px] font-semibold text-[#15803D] uppercase tracking-wide">Billing Address</div>
                    <div className="text-[#1F2937] font-medium leading-snug">
                      {[selectedClient.billing_address || selectedClient.address, selectedClient.city, selectedClient.state, selectedClient.pin]
                        .filter(Boolean).join(', ') || '—'}
                    </div>
                  </div>
                  <div className="p-3 space-y-0.5">
                    <div className="text-[10px] font-semibold text-[#15803D] uppercase tracking-wide">GSTIN / UIN</div>
                    <div className="text-[#1F2937] font-mono font-bold">
                      {selectedClient.gst_tax_number || 'Unregistered'}
                    </div>
                    <div className="text-[10px] text-[#6B7280]">
                      State: {selectedClient.state || '—'} {selectedClient.gst_tax_number?.slice(0, 2) ? `(Code: ${selectedClient.gst_tax_number.slice(0, 2)})` : ''}
                    </div>
                  </div>
                  <div className="p-3 space-y-0.5">
                    <div className="text-[10px] font-semibold text-[#15803D] uppercase tracking-wide">Payment Terms</div>
                    <div className="text-[#1F2937] font-bold">
                      {selectedClient.payment_term === '30_DAYS' ? '30 Days'
                        : selectedClient.payment_term === '60_DAYS' ? '60 Days'
                        : selectedClient.payment_term === 'IMMEDIATE' ? 'Immediate'
                        : selectedClient.payment_term || '—'}
                    </div>
                    <div className="text-[10px] text-[#6B7280]">Contact: {selectedClient.contact_person || '—'}</div>
                  </div>
                  <div className="p-3 space-y-0.5">
                    <div className="text-[10px] font-semibold text-[#15803D] uppercase tracking-wide">Contact Info</div>
                    <div className="text-[#1F2937] font-medium">{selectedClient.phone || selectedClient.phone_numbers?.[0] || '—'}</div>
                    <div className="text-[10px] text-[#6B7280] truncate">{selectedClient.email || selectedClient.email_addresses?.[0] || '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <input type="hidden" name="clientId" value="" required />
            )}


            {/* CV Voucher & Challan Details Row: 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
              <Field>
                <FieldLabel htmlFor="cv-voucher-no">
                  CV Voucher / Voucher No. <span className="text-[#DC2626]">*</span>
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="cv-voucher-no"
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    required
                    placeholder="e.g. 181299"
                    className="font-mono font-bold text-xs pl-8 text-[#0274BB]"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#9CA3AF]">
                    <Hash className="size-3.5 text-[#0274BB]" />
                  </div>
                </div>
                <span className="text-[10px] text-[#6B7280]">Official CV Register Voucher #</span>
              </Field>

              <Field>
                <FieldLabel htmlFor="cv-dc-number">Delivery Challan (DC No. &amp; Date)</FieldLabel>
                <Input
                  id="cv-dc-number"
                  type="text"
                  placeholder="e.g. Dc No. 106/2026-27, Dt. 19.09.2026"
                  value={dcNumber}
                  onChange={(e) => setDcNumber(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#6B7280]">Customer Inward Gatepass / DC ref</span>
              </Field>

              <Field>
                <FieldLabel htmlFor="cv-payment-terms">Mode / Terms of Payment</FieldLabel>
                <Input
                  id="cv-payment-terms"
                  type="text"
                  placeholder="e.g. 30 Days"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#6B7280]">Payment credit window</span>
              </Field>

              <Field>
                <FieldLabel htmlFor="cv-dispatched-through">Dispatched Through</FieldLabel>
                <Input
                  id="cv-dispatched-through"
                  type="text"
                  placeholder="e.g. By Hand, Courier"
                  value={dispatchedThrough}
                  onChange={(e) => setDispatchedThrough(e.target.value)}
                  className="text-xs"
                />
                <span className="text-[10px] text-[#6B7280]">Receipt / delivery transport method</span>
              </Field>
            </div>

            {/* Straight Schedule & Reference Row: 3 Balanced Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <Field>
                <FieldLabel>
                  Collection Date &amp; Time <span className="text-[#DC2626]">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  required
                />
                <span className="text-[11px] text-[#6B7280]">Date instruments physically arrived at lab</span>
              </Field>

              <Field>
                <FieldLabel>
                  Priority / Turnaround <span className="text-[#DC2626]">*</span>
                </FieldLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequestPriority)}
                >
                  <option value="NORMAL">NORMAL — Standard Turnaround (5 Days)</option>
                  <option value="URGENT">⚡ URGENT — Expedited Turnaround (24-48 Hours)</option>
                </Select>
                {priority === 'URGENT' ? (
                  <span className="text-[11px] text-[#DC2626] font-semibold flex items-center gap-1">
                    ⚡ Priority 1 placement in Lab Queue
                  </span>
                ) : (
                  <span className="text-[11px] text-[#6B7280]">FIFO standard laboratory queue scheduling</span>
                )}
              </Field>

              <Field>
                <FieldLabel>Client Reference / PO # (Optional)</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. PO-2026-9921 or Work Order #"
                  value={clientPoRef}
                  onChange={(e) => setClientPoRef(e.target.value)}
                />
                <span className="text-[11px] text-[#6B7280]">Customer Purchase Order or Challan ref</span>
              </Field>
            </div>

            {/* Quotation Requirement Radio Toggle */}
            <div className="bg-[#F8FAFC] p-4 rounded-md border border-[#E2E8F0] space-y-2 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#1E293B] block">
                    Commercial Quotation Required for this Request? <span className="text-[#DC2626]">*</span>
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    If Yes, sends notification to lab/commercial team to raise and approve quotation before calibration starts.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-all ${quotationRequired ? 'bg-[#EFF6FF] border-[#0274BB] text-[#0274BB] ring-1 ring-[#0274BB]' : 'bg-white border-[#CBD5E1] text-[#64748B] hover:border-slate-400'}`}>
                    <input
                      type="radio"
                      name="quotationRequiredRadio"
                      checked={quotationRequired}
                      onChange={() => setQuotationRequired(true)}
                      className="text-[#0274BB] focus:ring-[#0274BB]"
                    />
                    <span>Yes, Quotation Required</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-all ${!quotationRequired ? 'bg-[#F0FDF4] border-[#16A34A] text-[#16A34A] ring-1 ring-[#16A34A]' : 'bg-white border-[#CBD5E1] text-[#64748B] hover:border-slate-400'}`}>
                    <input
                      type="radio"
                      name="quotationRequiredRadio"
                      checked={!quotationRequired}
                      onChange={() => setQuotationRequired(false)}
                      className="text-[#16A34A] focus:ring-[#16A34A]"
                    />
                    <span>No (Standard Inward)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Inward Notes Row: Full Width Straight Field */}
            <Field className="pt-1">
              <FieldLabel>Inward &amp; Special Handling Instructions</FieldLabel>
              <Textarea
                placeholder="Mention fragile packaging, specific calibration standards requested, accessories handed over, or special customer remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Section 2: Equipment Line Items */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 p-5 bg-[#FAFAFA] border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-md bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center shrink-0">
                <Gauge className="size-5 text-[#0274BB]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-[#111827]">
                    2. CV Equipment Line Items &amp; Routing ({items.length})
                  </CardTitle>
                  <Badge variant="primary">{totalItemCount} Unit(s) Total</Badge>
                </div>
                <CardDescription className="text-xs text-[#6B7280]">
                  Select instruments from Item Master (by Code or Name), assign Destination (Lab vs Vendor), and specify rate
                </CardDescription>
              </div>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={onAddItem} className="shrink-0">
              <Plus className="size-4" /> Add Instrument Line
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3.5 w-36">Item Code</th>
                    <th className="px-3 py-3.5 min-w-[220px]">Instrument Master / Service</th>
                    <th className="px-3 py-3.5 min-w-[190px]">Destination (Lab / Vendor)</th>
                    <th className="px-3 py-3.5 w-20 text-center">Qty</th>
                    <th className="px-3 py-3.5 w-28 text-right">Rate (₹)</th>
                    <th className="px-3 py-3.5 w-32">Serial # / Asset ID</th>
                    <th className="px-3 py-3.5 min-w-[180px]">Condition &amp; Notes</th>
                    <th className="px-3 py-3.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {items.map((item, idx) => {
                    const matchedItem = itemMasters.find((im) => im.id === item.itemMasterId);
                    const currentRate = typeof item.unitRate === 'number' ? item.unitRate : (matchedItem?.standard_cost || 0);
                    const lineTotal = (Number(item.quantity) || 0) * currentRate;

                    return (
                      <tr key={idx} className="hover:bg-[#FAFAFA] align-top transition-colors">
                        {/* 1. Item Code Selection */}
                        <td className="px-3 py-3">
                          <Select
                            value={item.itemCode || matchedItem?.item_code || ''}
                            onChange={(e) => handleSelectItemByCode(idx, e.target.value)}
                            className="font-mono text-xs font-semibold"
                          >
                            <option value="">Select Code...</option>
                            {itemMasters.map((im) => (
                              <option key={im.id} value={im.item_code}>
                                {im.item_code}
                              </option>
                            ))}
                          </Select>
                          <span className="text-[10px] text-[#6B7280] block mt-1">
                            {itemMasters.length} items in master
                          </span>
                        </td>

                        {/* 2. Instrument Description / Service Selection */}
                        <td className="px-3 py-3">
                          <Select
                            value={item.itemMasterId}
                            onChange={(e) => handleSelectItemById(idx, e.target.value)}
                            required
                            className="text-xs"
                          >
                            <option value="">Choose Instrument from Master...</option>
                            {itemMasters.map((im) => (
                              <option key={im.id} value={im.id}>
                                {im.item_name} ({im.item_code})
                              </option>
                            ))}
                          </Select>
                          {matchedItem && (
                            <div className="mt-1.5 text-[11px] text-[#6B7280] leading-tight space-y-0.5 bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB]">
                              <div className="flex flex-wrap items-center gap-x-2">
                                <span>
                                  <strong className="text-[#111827]">Range:</strong>{' '}
                                  {matchedItem.measurement_range || `${matchedItem.range_min} - ${matchedItem.range_max} ${matchedItem.range_unit}`}
                                </span>
                                <span>•</span>
                                <span>
                                  <strong className="text-[#111827]">LC:</strong>{' '}
                                  {matchedItem.least_count} {matchedItem.least_count_unit}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 pt-0.5 text-[10px] text-[#0274BB] border-t border-[#E5E7EB]">
                                <span>HSN/SAC: 998346</span>
                                {matchedItem.item_category && (
                                  <>
                                    <span>•</span>
                                    <span>{matchedItem.item_category}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 3. Destination (Lab vs Vendor) + Vendor Selection */}
                        <td className="px-3 py-3">
                          <Select
                            value={item.destination || 'IN_HOUSE'}
                            onChange={(e) => {
                              const dest = e.target.value as 'IN_HOUSE' | 'VENDOR_OUTSOURCE';
                              onUpdateItem(idx, 'destination', dest);
                              if (dest === 'IN_HOUSE') {
                                onUpdateItem(idx, 'vendorId', '');
                                onUpdateItem(idx, 'vendorName', '');
                              }
                            }}
                            className={`font-semibold text-xs ${
                              item.destination === 'VENDOR_OUTSOURCE'
                                ? 'text-amber-800 bg-amber-50 border-amber-300'
                                : 'text-[#0274BB]'
                            }`}
                          >
                            <option value="IN_HOUSE">🔬 Lab (In-House)</option>
                            <option value="VENDOR_OUTSOURCE">🏢 Vendor (Outsource)</option>
                          </Select>

                          {item.destination === 'VENDOR_OUTSOURCE' && (
                            <div className="mt-1.5 space-y-1">
                              <Select
                                value={item.vendorId || ''}
                                onChange={(e) => {
                                  const vend = vendors.find((v) => v.id === e.target.value);
                                  onUpdateItem(idx, 'vendorId', e.target.value);
                                  onUpdateItem(idx, 'vendorName', vend?.vendor_name || '');
                                }}
                                required
                                className="text-xs border-amber-300 bg-white"
                              >
                                <option value="">Select Vendor from Master...</option>
                                {vendors.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.vendor_name} ({v.vendor_code})
                                  </option>
                                ))}
                              </Select>
                              <span className="text-[10px] text-amber-700 block">
                                {vendors.length} vendor option(s) in Vendor Master
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 4. Quantity */}
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              onUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                            }
                            required
                            className="text-center font-bold text-xs"
                          />
                        </td>

                        {/* 5. Rate (₹) */}
                        <td className="px-3 py-3">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={currentRate || ''}
                            onChange={(e) =>
                              onUpdateItem(idx, 'unitRate', parseFloat(e.target.value) || 0)
                            }
                            className="text-right font-mono text-xs"
                          />
                          <div className="text-[10px] text-right text-[#6B7280] mt-0.5 font-mono">
                            ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        {/* 6. Serial # */}
                        <td className="px-3 py-3">
                          <Input
                            placeholder="e.g. SN-8921"
                            value={item.serialNumber}
                            onChange={(e) => onUpdateItem(idx, 'serialNumber', e.target.value)}
                            className="font-mono text-xs"
                          />
                        </td>

                        {/* 7. Condition & Accessories */}
                        <td className="px-3 py-3 space-y-1.5">
                          <Select
                            value={item.itemCondition}
                            onChange={(e) =>
                              onUpdateItem(idx, 'itemCondition', e.target.value as ItemCondition)
                            }
                            className="text-xs"
                          >
                            <option value="GOOD">GOOD — Clean</option>
                            <option value="SCRATCHED">SCRATCHED — Surface</option>
                            <option value="DAMAGED">DAMAGED — Physical</option>
                            <option value="FAULTY">FAULTY — Out of Spec</option>
                          </Select>
                          <Input
                            placeholder="Accessories..."
                            value={item.accessories}
                            onChange={(e) => onUpdateItem(idx, 'accessories', e.target.value)}
                            className="text-xs"
                          />
                        </td>

                        {/* 8. Actions */}
                        <td className="px-3 py-3 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(idx)}
                              className="text-[#DC2626] hover:text-[#b91c1c] p-1.5 cursor-pointer rounded-[4px] hover:bg-[#FEF2F2] transition-colors"
                              title="Remove item line"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" type="button" onClick={onAddItem}>
              <Plus className="size-4" /> Add Another Instrument
            </Button>
            <div className="flex flex-wrap items-center gap-5 text-xs text-[#374151]">
              <div>
                Total Lines: <strong className="text-[#111827]">{items.length}</strong> (
                <strong className="text-[#0274BB]">{totalItemCount} unit(s)</strong>)
              </div>
              <div>
                Subtotal: <strong className="font-mono text-[#111827]">₹{cvSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div>
                CGST (9%): <span className="font-mono text-[#6B7280]">₹{cvCgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                SGST (9%): <span className="font-mono text-[#6B7280]">₹{cvSgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-[#EFF6FF] px-3 py-1 rounded border border-[#BFDBFE] font-bold text-[#0274BB]">
                CV Voucher Total: ₹{cvTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Section 3: Collection Proof & Document Attachments */}
        <Card>
          <CardHeader className="bg-[#FAFAFA] border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center shrink-0">
                  <Paperclip className="size-5 text-[#0274BB]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#111827]">
                    3. Collection Proof &amp; Inward Documents
                  </CardTitle>
                  <CardDescription className="text-xs text-[#6B7280]">
                    Upload customer delivery challans, PO orders, gate passes, or intake photos (.pdf, .docx, images)
                  </CardDescription>
                </div>
              </div>
              {attachments.length > 0 && (
                <span className="text-xs bg-[#E6F2FF] text-[#0274BB] font-semibold px-2.5 py-1 rounded-full font-mono">
                  {attachments.length} file(s) attached
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0274BB] bg-[#F8FAFC] hover:bg-[#F0F7FF] rounded-lg p-6 text-center cursor-pointer transition-colors"
            >
              <UploadCloud className="size-8 text-[#0274BB] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#1E293B]">
                Drag and drop inward delivery documents here, or click to browse
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Accepted formats: PDF documents, Word (.docx), Excel spreadsheets (.xlsx), and Photos (.png, .jpg)
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs hover:border-[#0274BB] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getFileIcon(att.type, att.name)}
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1E293B] truncate" title={att.name}>{att.name}</p>
                        <p className="text-[10px] text-[#64748B]">{formatBytes(att.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="text-[#94A3B8] hover:text-[#DC2626] p-1 rounded transition-colors cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Action & Submission Bar */}
        <Card className="bg-[#F8FAFC] border border-[#E5E7EB]">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[#6B7280]">
              Upon registration, unique <strong className="text-[#0274BB] font-mono">CV #{voucherNo}</strong> will be generated.
              In-house items enter the Lab Queue, and outsourced items are recorded for their assigned vendors.
            </div>
            <div className="flex items-center gap-3">
              <Link to="/requests">
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                <Check className="size-4" />
                {isSubmitting ? 'Registering & Generating CV...' : `Generate CV Voucher (#${voucherNo})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
