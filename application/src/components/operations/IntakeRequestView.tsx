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
} from '../ui/UIPrimitives';
import type { Client, ItemMaster, RequestPriority, ItemCondition, RequestAttachment } from '../../types/domain';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface IntakeItemFormState {
  itemMasterId: string;
  quantity: number;
  serialNumber: string;
  accessories: string;
  itemCondition: ItemCondition;
  remarks: string;
}

export interface IntakeRequestViewProps {
  clients: Client[];
  itemMasters: ItemMaster[];
  clientId: string;
  setClientId: (id: string) => void;
  collectionDate: string;
  setCollectionDate: (date: string) => void;
  priority: RequestPriority;
  setPriority: (p: RequestPriority) => void;
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
  clientId,
  setClientId,
  collectionDate,
  setCollectionDate,
  priority,
  setPriority,
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
              <ArrowLeft className="size-4" /> Back to Requests
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">New Equipment Inward Request</h1>
            <p className="text-sm text-[#6B7280]">
              Lifecycle Step 4 &amp; 5: Equipment Collection &amp; Inward Registration into Lab Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F5F7FA] border border-[#E5E7EB] px-3 py-1.5 rounded-[4px] text-xs font-semibold text-[#374151]">
          <Gauge className="size-4 text-[#0274BB]" />
          <span>Total Inward Units: </span>
          <span className="text-[#0274BB] font-mono font-bold">{totalItemCount}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info & Attachments */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pickup &amp; Account Details</CardTitle>
                    <CardDescription>Step 4: Collection Visit metadata</CardDescription>
                  </div>
                  <Link
                    to="/masters/clients/new?returnUrl=/requests/new"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0274BB] hover:underline bg-[#F0F7FF] px-2.5 py-1 rounded-[4px] border border-[#BFDBFE]"
                    title="Register a new client in Client Master"
                  >
                    <Plus className="size-3.5" /> + New Client
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Code Search/Filter Field */}
                <div ref={codeContainerRef} className="relative">
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
                      placeholder="Type Client Code (e.g. CLI-2026-00165)..."
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
                      <div className="px-3 py-2 bg-[#F9FAFB] dark:bg-neutral-800 border-t border-[#E5E7EB] dark:border-neutral-700 flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">Can't find code?</span>
                        <Link
                          to="/masters/clients/new?returnUrl=/requests/new"
                          className="text-xs font-semibold text-[#0274BB] hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" /> + Create New Client
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Client Account / Name Search/Filter Field */}
                <div ref={nameContainerRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <FieldLabel htmlFor="client-account-input" className="cursor-pointer">
                      Client Account / Name <span className="text-[#DC2626]">*</span>
                    </FieldLabel>
                    <Link
                      to="/masters/clients/new?returnUrl=/requests/new"
                      className="text-xs font-medium text-[#0274BB] hover:underline inline-flex items-center gap-1"
                      title="Register new client in Client Master"
                    >
                      <Plus className="size-3" /> New Client
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
                      <Building2 className="size-4" />
                    </div>
                    <Input
                      id="client-account-input"
                      type="text"
                      placeholder="Type Client Account Name (e.g. SPIRAX SARCO)..."
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
                      <div className="px-3 py-2 bg-[#F9FAFB] dark:bg-neutral-800 border-t border-[#E5E7EB] dark:border-neutral-700 flex items-center justify-between text-xs">
                        <span className="text-[#6B7280]">Can't find client?</span>
                        <Link
                          to="/masters/clients/new?returnUrl=/requests/new"
                          className="text-xs font-semibold text-[#0274BB] hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="size-3.5" /> + Create New Client
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Client Information Badge */}
                {selectedClient ? (
                  <div className="text-xs text-[#374151] bg-[#F0FDF4] p-3 rounded-[4px] border border-[#BBF7D0] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#166534] flex items-center gap-1 truncate">
                        <Check className="size-3.5 text-[#16A34A] shrink-0" />
                        <span className="truncate">{selectedClient.client_name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearClient}
                        className="text-[11px] text-[#DC2626] hover:underline cursor-pointer font-medium shrink-0 ml-2"
                      >
                        Change
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-[#4B5563] pt-1">
                      <div><span className="font-semibold">Code:</span> <span className="font-mono text-[#0274BB] font-medium">{selectedClient.client_code}</span></div>
                      <div><span className="font-semibold">GSTIN:</span> {selectedClient.gst_tax_number || 'Unregistered'}</div>
                      <div><span className="font-semibold">Contact:</span> {selectedClient.contact_person || 'N/A'}</div>
                      <div><span className="font-semibold">City:</span> {selectedClient.city || 'N/A'}</div>
                    </div>
                    {selectedClient.address && (
                      <div className="truncate text-[11px] text-[#6B7280] pt-1 border-t border-[#DCFCE7]">
                        <span className="font-semibold">Address:</span> {selectedClient.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="hidden" name="clientId" value="" required />
                )}

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
                  {priority === 'URGENT' && (
                    <p className="mt-1 text-xs text-[#DC2626] font-medium flex items-center gap-1">
                      <span>⚡ This work order will be placed at the TOP of the Lab Queue.</span>
                    </p>
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
                </Field>

                <Field>
                  <FieldLabel>Inward &amp; Transport Notes</FieldLabel>
                  <Textarea
                    placeholder="Special handling requirements, fragile packaging, or collection instructions..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Proof & Document Attachments Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="size-4 text-[#0274BB]" /> Collection Proof &amp; Attachments
                    </CardTitle>
                    <CardDescription>
                      Upload delivery challans, PO docs, or photos (.pdf, .docx, images)
                    </CardDescription>
                  </div>
                  {attachments.length > 0 && (
                    <span className="text-xs bg-[#E6F2FF] text-[#0274BB] font-semibold px-2 py-0.5 rounded-full font-mono">
                      {attachments.length} file(s)
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0274BB] bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-[4px] p-4 text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className="size-7 text-[#64748B] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-[#1E293B]">
                    Click to browse or drag &amp; drop files
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Supports PDF, Word (.docx), Excel (.xlsx), and Images (.png, .jpg)
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-2 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(att.type, att.name)}
                          <div className="min-w-0">
                            <p className="font-medium text-[#1E293B] truncate">{att.name}</p>
                            <p className="text-[10px] text-[#64748B]">{formatBytes(att.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveAttachment(att.id)}
                          className="text-[#94A3B8] hover:text-[#DC2626] p-1 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Equipment Line Items ({items.length})</CardTitle>
                  <CardDescription>Instruments collected from client for calibration</CardDescription>
                </div>
                <Button variant="secondary" size="sm" type="button" onClick={onAddItem}>
                  <Plus className="size-4" /> Add Item Line
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 min-w-[220px]">Instrument / Equipment</th>
                        <th className="px-3 py-3 w-20">Qty</th>
                        <th className="px-3 py-3 min-w-[140px]">Serial # / Asset ID</th>
                        <th className="px-3 py-3 w-32">Condition</th>
                        <th className="px-3 py-3 min-w-[160px]">Accessories / Notes</th>
                        <th className="px-3 py-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {items.map((item, idx) => {
                        const matchedItem = itemMasters.find((im) => im.id === item.itemMasterId);
                        return (
                          <tr key={idx} className="hover:bg-[#FAFAFA] align-top">
                            <td className="px-4 py-3">
                              <Select
                                value={item.itemMasterId}
                                onChange={(e) => onUpdateItem(idx, 'itemMasterId', e.target.value)}
                                required
                              >
                                <option value="">Select Instrument</option>
                                {itemMasters.map((im) => (
                                  <option key={im.id} value={im.id}>
                                    {im.item_name} ({im.item_code})
                                  </option>
                                ))}
                              </Select>
                              {matchedItem && (
                                <div className="mt-1.5 text-[11px] text-[#6B7280] leading-tight space-y-0.5">
                                  <div>
                                    <span className="font-semibold text-[#111827]">Range:</span>{' '}
                                    {matchedItem.measurement_range || `${matchedItem.range_min} - ${matchedItem.range_max} ${matchedItem.range_unit}`}
                                    {' '}• <span className="font-semibold text-[#111827]">LC:</span>{' '}
                                    {matchedItem.least_count} {matchedItem.least_count_unit}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-[#111827]">Std Rate:</span>{' '}
                                    ₹{matchedItem.standard_cost?.toLocaleString()}
                                    {matchedItem.item_category && (
                                      <> • <span className="text-[#0274BB]">{matchedItem.item_category}</span></>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  onUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                                }
                                required
                              />
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                placeholder="e.g. SN-8921"
                                value={item.serialNumber}
                                onChange={(e) => onUpdateItem(idx, 'serialNumber', e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <Select
                                value={item.itemCondition}
                                onChange={(e) =>
                                  onUpdateItem(idx, 'itemCondition', e.target.value as ItemCondition)
                                }
                              >
                                <option value="GOOD">GOOD</option>
                                <option value="SCRATCHED">SCRATCHED</option>
                                <option value="DAMAGED">DAMAGED</option>
                                <option value="FAULTY">FAULTY</option>
                              </Select>
                            </td>
                            <td className="px-3 py-3">
                              <Input
                                placeholder="Probes, case, cord..."
                                value={item.accessories}
                                onChange={(e) => onUpdateItem(idx, 'accessories', e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-3 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveItem(idx)}
                                  className="text-[#DC2626] hover:text-[#b91c1c] p-1.5 cursor-pointer rounded-[4px] hover:bg-[#FEF2F2] transition-colors"
                                  title="Remove Item Line"
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
              <CardFooter className="flex items-center justify-between p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                <span className="text-xs text-[#6B7280]">
                  Upon registration, items are queued for physical inspection in Step 6 (Lab Queue).
                </span>
                <div className="flex gap-3">
                  <Link to="/requests">
                    <Button variant="secondary" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering Inward...' : 'Submit Equipment Inward'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
