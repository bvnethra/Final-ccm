// application/src/components/operations/IntakeRequestView.tsx
import React, { useRef } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedClient = clients.find((c) => c.id === clientId);
  const totalItemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

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
                <CardTitle>Pickup &amp; Account Details</CardTitle>
                <CardDescription>Step 4: Collection Visit metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel>
                    Client Account <span className="text-[#DC2626]">*</span>
                  </FieldLabel>
                  <Select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                  >
                    <option value="">Select a Client Account</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.client_name} ({c.client_code})
                      </option>
                    ))}
                  </Select>
                  {selectedClient && (
                    <div className="mt-1 text-xs text-[#6B7280] bg-[#F5F7FA] p-2 rounded-[4px] border border-[#E5E7EB] space-y-0.5">
                      <div><span className="font-semibold">GSTIN:</span> {selectedClient.gst_tax_number || 'Unregistered'}</div>
                      <div><span className="font-semibold">Contact:</span> {selectedClient.contact_person || 'N/A'}</div>
                      {selectedClient.address && (
                        <div className="truncate"><span className="font-semibold">Address:</span> {selectedClient.address}</div>
                      )}
                    </div>
                  )}
                </Field>

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
