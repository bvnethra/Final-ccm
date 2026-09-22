// application/src/pages/commercial/TaxInvoiceDetailPage.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvoices, useCalibrationRequests, useUpdateInvoice } from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import { useAuthContext } from '../../contexts/AuthContext';
import { OfficialTaxInvoiceView } from '../../components/commercial/OfficialTaxInvoiceView';
import { Button, Input, Field, FieldLabel } from '../../components/ui/UIPrimitives';
import { ArrowLeft, AlertCircle, Edit, X, Check, Plus, Trash2 } from 'lucide-react';
import type { EditableInvoiceItem } from './InvoiceListPage';

export const TaxInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tenantId } = useAuthContext();
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoices();
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: requests = [] } = useCalibrationRequests();
  const updateInvoiceMutation = useUpdateInvoice();

  // Price Variation editing state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editItems, setEditItems] = useState<EditableInvoiceItem[]>([]);
  const [editDiscountType, setEditDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0);
  const [editClientPo, setEditClientPo] = useState<string>('');
  const [editErrorMessage, setEditErrorMessage] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | undefined>();

  if (isLoadingInvoices || isLoadingClients) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Official Tax Invoice...</span>
        </div>
      </div>
    );
  }

  const invoice = invoices.find((inv) => inv.id === id || inv.invoice_number === id);

  if (!invoice) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4 text-center">
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center justify-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>Tax Invoice "{id}" could not be found or has been deleted.</span>
        </div>
        <Link to="/commercial/invoices">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Back to Invoices List
          </Button>
        </Link>
      </div>
    );
  }

  const client = clients.find((c) => c.id === invoice.client_id) || invoice.clients;
  const request = requests.find((r) => r.id === invoice.request_id);

  const handleOpenEdit = () => {
    setEditErrorMessage(undefined);
    setEditClientPo(invoice.client_po_ref || '');
    const items = (invoice.items && invoice.items.length > 0 ? invoice.items : []).map((it, idx) => ({
      id: it.id || `inv-item-${idx}`,
      sourceId: it.quotation_item_id,
      description: it.description,
      quantity: it.quantity || 1,
      unitPrice: it.unit_price ?? it.unit_rate ?? 0,
      hsnSacCode: it.hsn_sac_code || '998346',
      selected: true,
      isCustom: !it.quotation_item_id,
    }));
    setEditItems(items);

    if (invoice.discount_amount && invoice.discount_amount > 0) {
      setEditDiscountType('FLAT');
      setEditDiscountValue(invoice.discount_amount);
    } else {
      setEditDiscountType('PERCENT');
      setEditDiscountValue(0);
    }
    setShowEditModal(true);
  };

  const handleAddCustomLine = () => {
    setEditItems((prev) => [
      ...prev,
      {
        id: `custom-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: 'Special Service / Price Variation Fee',
        quantity: 1,
        unitPrice: 0,
        hsnSacCode: '998346',
        selected: true,
        isCustom: true,
      },
    ]);
  };

  const handleRemoveLine = (itemId: string) => {
    setEditItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof EditableInvoiceItem, value: any) => {
    setEditItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, [field]: value } : it))
    );
  };

  const handleSaveEdit = async () => {
    if (!tenantId) return;
    setEditErrorMessage(undefined);

    const chosen = editItems.filter((it) => it.selected);
    if (chosen.length === 0) {
      setEditErrorMessage('Invoice must contain at least one line item.');
      return;
    }

    const subtotalCalc = chosen.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const discountCalc =
      editDiscountType === 'PERCENT'
        ? (subtotalCalc * Math.min(100, Math.max(0, editDiscountValue))) / 100
        : Math.min(subtotalCalc, Math.max(0, editDiscountValue));
    const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
    const taxCalc = (taxableCalc * 18) / 100;
    const grandTotal = taxableCalc + taxCalc;

    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoice.id,
        tenantId,
        clientPoRef: editClientPo.trim() || undefined,
        subtotal: subtotalCalc,
        discountAmount: discountCalc,
        taxAmount: taxCalc,
        totalAmount: grandTotal,
        items: chosen.map((it) => ({
          id: it.id,
          invoice_id: invoice.id,
          quotation_item_id: it.sourceId,
          description: it.description,
          hsn_sac_code: it.hsnSacCode,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          unit_rate: it.unitPrice,
          total_price: it.quantity * it.unitPrice,
        })),
      });

      setShowEditModal(false);
      setToastMessage('Invoice updated successfully with price variations!');
    } catch (err: any) {
      setEditErrorMessage(err.message || 'Failed to update invoice.');
    }
  };

  // Calculations for edit modal
  const chosenItems = editItems.filter((it) => it.selected);
  const subtotalCalc = chosenItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const discountCalc =
    editDiscountType === 'PERCENT'
      ? (subtotalCalc * Math.min(100, Math.max(0, editDiscountValue))) / 100
      : Math.min(subtotalCalc, Math.max(0, editDiscountValue));
  const taxableCalc = Math.max(0, subtotalCalc - discountCalc);
  const taxCalc = (taxableCalc * 18) / 100;
  const grandTotalCalc = taxableCalc + taxCalc;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {toastMessage && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[4px] flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-emerald-600" />
            <span className="font-semibold text-xs">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(undefined)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <OfficialTaxInvoiceView
        invoice={invoice}
        client={client}
        request={request}
        onEdit={handleOpenEdit}
        isFullPage={true}
      />

      {/* Price Variation Edit Modal */}
      {showEditModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-[4px] shadow-2xl max-w-3xl w-full overflow-hidden border border-[#E5E7EB]">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Edit className="size-5 text-[#0274BB]" />
                <div>
                  <h3 className="font-bold text-[#111827] text-base">
                    Edit Rates &amp; Price Variations — {invoice.invoice_number}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Modify line item prices, quantities, descriptions, or add variation surcharges in INR (₹)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded hover:bg-[#E2E8F0] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {editErrorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {editErrorMessage}
                </div>
              )}

              <Field>
                <FieldLabel>Client Purchase Order Reference</FieldLabel>
                <Input
                  placeholder="E.g. PO-CLIENT-2026-9921"
                  value={editClientPo}
                  onChange={(e) => setEditClientPo(e.target.value)}
                />
              </Field>

              {/* Line Items Table */}
              <div className="border border-[#E5E7EB] rounded-[4px] overflow-hidden">
                <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#111827]">
                    Invoice Line Items ({editItems.length})
                  </span>
                  <Button
                    type="button"
                    variant="outlineInk"
                    size="sm"
                    onClick={handleAddCustomLine}
                    className="flex items-center gap-1 text-xs py-1 h-7"
                  >
                    <Plus className="size-3" /> Add Price Variation Line
                  </Button>
                </div>

                <div className="divide-y divide-[#E5E7EB] max-h-64 overflow-y-auto">
                  {editItems.map((it) => {
                    const lineTotal = it.quantity * it.unitPrice;

                    return (
                      <div
                        key={it.id}
                        className={`p-3 text-xs transition-colors space-y-2 ${
                          it.selected ? 'bg-[#F0FDF4]/50' : 'bg-white opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={it.selected}
                            onChange={(e) =>
                              handleUpdateItem(it.id, 'selected', e.target.checked)
                            }
                            className="size-4 text-[#0274BB] rounded border-[#CBD5E1] cursor-pointer mt-1"
                          />

                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-6">
                              <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                Description of Services
                              </label>
                              <input
                                type="text"
                                value={it.description}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, 'description', e.target.value)
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0274BB] bg-white font-medium"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                HSN/SAC
                              </label>
                              <input
                                type="text"
                                value={it.hsnSacCode}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, 'hsnSacCode', e.target.value)
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-center bg-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                Qty (NOS)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'quantity',
                                    Math.max(1, parseInt(e.target.value, 10) || 1)
                                  )
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                                Rate (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={it.unitPrice}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    it.id,
                                    'unitPrice',
                                    Math.max(0, parseFloat(e.target.value) || 0)
                                  )
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right bg-white font-bold text-[#0274BB]"
                              />
                            </div>
                          </div>

                          <div className="text-right shrink-0 min-w-[70px] pt-4">
                            <span className="font-mono font-bold text-[#111827] block text-xs">
                              ₹{lineTotal.toFixed(2)}
                            </span>
                            {it.isCustom && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(it.id)}
                                className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer mt-1"
                                title="Remove Line"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount Controls in INR */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Commercial Discount</span>
                  <span className="text-[11px] text-slate-500">Apply discount (% or ₹ Flat)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setEditDiscountType('PERCENT')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                        editDiscountType === 'PERCENT'
                          ? 'bg-[#0274BB] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDiscountType('FLAT')}
                      className={`px-2 py-0.5 text-xs font-semibold rounded cursor-pointer ${
                        editDiscountType === 'FLAT'
                          ? 'bg-[#0274BB] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ₹ Flat
                    </button>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max={editDiscountType === 'PERCENT' ? 100 : subtotalCalc}
                      step={editDiscountType === 'PERCENT' ? '1' : '50'}
                      value={editDiscountValue}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setEditDiscountValue(editDiscountType === 'PERCENT' ? Math.min(100, val) : val);
                      }}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono font-bold text-xs bg-white"
                    />
                    <span className="ml-1 text-xs font-bold text-slate-600">
                      {editDiscountType === 'PERCENT' ? '%' : '₹'}
                    </span>
                  </div>
                  {discountCalc > 0 && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200 shrink-0">
                      -₹{discountCalc.toFixed(2)} off
                    </span>
                  )}
                </div>
              </div>

              {/* Calculation Summary in INR */}
              <div className="p-4 bg-[#F8FAFC] rounded-[4px] border border-[#E5E7EB] flex flex-col items-end gap-1.5 text-xs">
                <div className="flex justify-between w-72 text-[#64748B]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono text-[#1E293B] font-semibold">
                    ₹{subtotalCalc.toFixed(2)}
                  </span>
                </div>
                {discountCalc > 0 && (
                  <div className="flex justify-between w-72 text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-₹{discountCalc.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-72 text-[#64748B]">
                  <span>Net Taxable Subtotal:</span>
                  <span className="font-mono text-[#1E293B] font-semibold">
                    ₹{taxableCalc.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-72 text-[#64748B]">
                  <span>GST (18%):</span>
                  <span className="font-mono text-[#1E293B] font-semibold">
                    ₹{taxCalc.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between w-72 text-sm font-bold text-[#111827] border-t border-[#CBD5E1] pt-1.5 mt-1">
                  <span>Updated Grand Total (₹):</span>
                  <span className="font-mono text-[#0274BB]">
                    ₹{grandTotalCalc.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-between items-center">
              <Button variant="secondary" size="sm" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={chosenItems.length === 0 || grandTotalCalc <= 0 || updateInvoiceMutation.isPending}
              >
                <Check className="size-3.5" />
                {updateInvoiceMutation.isPending
                  ? 'Saving Variations...'
                  : `Save Price Variations (₹${grandTotalCalc.toFixed(2)})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxInvoiceDetailPage;
