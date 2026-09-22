import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCalibrationRequests, useCreateQuotation } from '../../hooks/useOperations';
import { useAuthContext } from '../../contexts/AuthContext';
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
  Field,
  FieldLabel,
} from '../../components/ui/UIPrimitives';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface QuotationLineState {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const QuotationBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRequestId = searchParams.get('requestId') || '';

  const { tenantId, organizationId } = useAuthContext();
  const { data: requests = [] } = useCalibrationRequests();
  const createQuotationMutation = useCreateQuotation();

  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(18); // 18% standard GST
  const [items, setItems] = useState<QuotationLineState[]>([
    {
      description: 'Precision Metrology Calibration Service & Certificate',
      quantity: 1,
      unitPrice: 150.0,
      totalPrice: 150.0,
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    if (selectedRequestId && requests.length > 0) {
      const found = requests.find((r) => r.id === selectedRequestId);
      if (found && found.request_items && found.request_items.length > 0) {
        const mapped = found.request_items.map((it) => {
          const name = it.item_masters?.item_name || 'Precision Gauge';
          const cost = it.item_masters?.standard_cost || 120;
          return {
            description: `ISO/IEC 17025 Calibration Service & Certificate — ${name} (S/N: ${it.serial_number || 'Standard'})`,
            quantity: it.quantity || 1,
            unitPrice: cost,
            totalPrice: (it.quantity || 1) * cost,
          };
        });
        setItems(mapped);
      }
    }
  }, [selectedRequestId, requests]);

  const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
  const taxAmount = ((subtotal - discount) * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof QuotationLineState, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        copy[index].totalPrice = copy[index].quantity * copy[index].unitPrice;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(undefined);

    if (!tenantId || !organizationId || !selectedRequestId) {
      setErrorMessage('Please select a calibration request for billing.');
      return;
    }

    try {
      await createQuotationMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId: selectedRequestId,
        subtotal,
        discount,
        taxAmount,
        totalAmount: grandTotal,
        items,
      });

      navigate('/commercial/quotations');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create quotation.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/commercial/quotations">
          <Button variant="outlineInk" size="sm">
            <ArrowLeft className="size-4" /> Back to Quotations
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">New Commercial Quotation</h1>
          <p className="text-sm text-[#6B7280]">
            Step 4: Build quotation line items, tax computations, and commercial billing terms
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quotation Metadata</CardTitle>
            <CardDescription>Select the calibration request to bill</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Target Calibration Request</FieldLabel>
              <Select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                required
              >
                <option value="">Select Calibration Request</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_number} — {r.clients?.client_name || 'Client'} ({r.status})
                  </option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quotation Line Items</CardTitle>
              <CardDescription>Calibrated services and consumables</CardDescription>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={handleAddItem}>
              <Plus className="size-4" /> Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 w-24">Qty</th>
                    <th className="px-4 py-3 w-32">Unit Price ($)</th>
                    <th className="px-4 py-3 w-32 text-right">Total ($)</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="p-3">
                        <Input
                          placeholder="Service description..."
                          value={it.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          required
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          required
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={it.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          required
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-[#111827]">
                        ₹{it.totalPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#DC2626] hover:text-[#b91c1c] p-1 cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Box */}
            <div className="p-6 bg-[#F5F7FA] border-t border-[#E5E7EB] flex flex-col items-end gap-2 text-sm">
              <div className="flex justify-between w-64 text-[#6B7280]">
                <span>Subtotal:</span>
                <span className="font-mono text-[#111827]">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 items-center">
                <span className="text-[#6B7280]">Discount (₹):</span>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right h-8"
                />
              </div>
              <div className="flex justify-between w-64 items-center">
                <span className="text-[#6B7280]">GST Rate (%):</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right h-8"
                />
              </div>
              <div className="flex justify-between w-64 text-[#6B7280]">
                <span>Tax Amount:</span>
                <span className="font-mono text-[#111827]">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 border-t border-[#E5E7EB] pt-2 text-base font-bold text-[#111827]">
                <span>Grand Total:</span>
                <span className="font-mono text-[#0274BB]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 p-4">
            <Link to="/commercial/quotations">
              <Button variant="outlineInk" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              type="submit"
              disabled={createQuotationMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              {createQuotationMutation.isPending ? 'Generating Quotation...' : 'Issue Quotation'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default QuotationBuilderPage;
