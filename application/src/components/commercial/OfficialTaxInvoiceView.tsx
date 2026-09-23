import React, { useRef, useState } from 'react';
import type { Invoice, Client, CalibrationRequest, LabIssuerProfile } from '../../types/domain';
import { Button } from '../ui/UIPrimitives';
import { Download, ArrowLeft, ArrowRight, CheckCircle2, Split, Edit, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLabProfile } from '../../hooks/useLabProfile';
import { EditLabProfileModal } from './EditLabProfileModal';

export interface OfficialTaxInvoiceViewProps {
  invoice: Invoice;
  client?: Client;
  request?: CalibrationRequest;
  issuerProfile?: LabIssuerProfile;
  onClose?: () => void;
  onEdit?: () => void;
  isFullPage?: boolean;
}

// Convert numbers into standard Indian Currency Words format (e.g. INR Nine Thousand Eight Hundred Twenty Six Only)
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'INR Zero Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const parts = Math.abs(num).toFixed(2).split('.');
  const whole = parseInt(parts[0], 10);
  const fraction = parseInt(parts[1], 10);

  let result = 'INR ' + inWords(whole).trim();
  if (fraction > 0) {
    result += ' and ' + inWords(fraction).trim() + 'paise';
  }
  return result + ' Only';
}

export function formatInvoiceDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

export const OfficialTaxInvoiceView: React.FC<OfficialTaxInvoiceViewProps> = ({
  invoice,
  client,
  request,
  issuerProfile: customIssuer,
  onClose,
  onEdit,
  isFullPage = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const { labProfile, updateLabProfile, resetToDefault } = useLabProfile();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Dynamic Supplier Details
  const supplier = customIssuer || labProfile;

  // Buyer Details - dynamically mapped from fetched client and invoice
  const buyerName = client?.client_name || invoice.clients?.client_name || '';
  const addressParts = [
    client?.address || invoice.clients?.address,
    [client?.city || invoice.clients?.city, client?.pin || invoice.clients?.pin].filter(Boolean).join(' - '),
  ].filter(Boolean);
  const buyerAddress = addressParts.length > 0 ? addressParts.join('\n') : '';

  const buyerGstin = client?.gst_tax_number || invoice.clients?.gst_tax_number || '';
  const buyerStateCode =
    buyerGstin && buyerGstin.length >= 2 && !isNaN(Number(buyerGstin.slice(0, 2)))
      ? buyerGstin.slice(0, 2)
      : '';
  const buyerStateName = client?.state || invoice.clients?.state || '';
  const buyerState = buyerStateName ? `${buyerStateName}${buyerStateCode ? `, Code : ${buyerStateCode}` : ''}` : '';

  // Invoice Metadata - dynamically mapped
  const invoiceNumber = invoice.invoice_number || '';
  const invoiceDate = formatInvoiceDate(invoice.invoice_date);
  const paymentTerms = client?.payment_term
    ? client.payment_term === '60_DAYS'
      ? '60 Days'
      : client.payment_term === '30_DAYS'
      ? '30 Days'
      : 'Immediate'
    : '';
  const buyersOrderNo = invoice.client_po_ref || request?.client_po_ref || '';
  const orderDate = formatInvoiceDate(request?.created_at || invoice.invoice_date);
  const refNo = request?.request_number ? `${request.request_number}${orderDate ? ` dt. ${orderDate}` : ''}` : '';
  const otherRef = request?.request_number
    ? `Dc No. ${request.request_number.replace(/\D/g, '').slice(-3) || request.request_number}${orderDate ? `, Dt. ${orderDate}` : ''}`
    : '';
  const dispatchedThrough = invoice.dispatched_through || 'By Hand';
  const destination = client?.city || invoice.clients?.city || '';

  // Items formatting - dynamically mapped from invoice items or request items
  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : request?.request_items && request.request_items.length > 0
      ? request.request_items.map((it: any, i: number) => ({
          id: it.id || String(i + 1),
          description: it.item_masters?.item_name || 'Calibration Service',
          hsn_sac_code: '998346',
          quantity: it.received_quantity || it.quantity || 1,
          unit_price: it.item_masters?.standard_cost || 0,
          total_price: (it.received_quantity || it.quantity || 1) * (it.item_masters?.standard_cost || 0),
        }))
      : [];

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0);

  // Tax calculation (Intrastate: 9% CGST + 9% SGST; Interstate: 18% IGST)
  // Ensure amount paid is strictly honored and no discount is visible on invoice
  const isIntraState = buyerStateCode === supplier.state_code;
  const rawTotal = invoice.total_amount > 0 ? Number(invoice.total_amount) : itemsSubtotal * 1.18;
  const roundedTotal = Math.round(rawTotal);
  const taxableSubtotal =
    invoice.total_amount > 0
      ? Math.round((rawTotal / 1.18) * 100) / 100
      : itemsSubtotal;

  const cgstAmount = isIntraState ? Math.round(taxableSubtotal * 0.09 * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round(taxableSubtotal * 0.09 * 100) / 100 : 0;
  const igstAmount = !isIntraState ? Math.round(taxableSubtotal * 0.18 * 100) / 100 : 0;
  const totalTax = isIntraState ? cgstAmount + sgstAmount : igstAmount;
  const roundOff = Math.round((roundedTotal - (taxableSubtotal + totalTax)) * 100) / 100;

  const amountInWords = numberToIndianWords(roundedTotal);
  const taxInWords = numberToIndianWords(totalTax);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-700 rounded-[4px] shadow-sm">
        <div className="flex items-center gap-2">
          {isFullPage && (
            <Link to="/commercial/invoices">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-4" /> Back
              </Button>
            </Link>
          )}
          <span className="font-bold text-sm text-[#111827] dark:text-neutral-100 flex items-center gap-1.5">
            {invoice.invoice_type === 'PARTIAL' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                <Split className="size-3.5" /> PARTIAL TAX INVOICE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="size-3.5" /> ACTUAL TAX INVOICE
              </span>
            )}
            <span className="font-mono text-[#0274BB]">{invoiceNumber}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 text-xs text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white"
            title="Customize Lab Logo, Name, Address &amp; GSTIN"
          >
            <Settings2 className="size-3.5 text-[#0274BB]" /> Lab Header &amp; Logo
          </Button>

          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-1.5 text-[#0274BB]"
            >
              <Edit className="size-4" /> Price Variation
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Download className="size-4" /> Export as PDF / Print
          </Button>
          <Link to="/logistics/dispatches">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              Proceed to Dispatch <ArrowRight className="size-4" />
            </Button>
          </Link>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* Physical Tax Invoice Layout - 1:1 Mirror of Indian Calibration Format */}
      {/* ==================================================================== */}
      <div className="flex justify-center overflow-x-auto bg-[#525659] p-4 sm:p-6 rounded-md">
        <div
          id="official-tax-invoice-printable"
          ref={printableRef}
          className="bg-white text-black font-sans text-[11px] leading-tight w-[210mm] min-h-[297mm] p-6 shadow-2xl border-2 border-black flex flex-col justify-between"
          style={{ boxSizing: 'border-box' }}
        >
          <div>
            {/* Header Document Title */}
            <div className="text-center font-bold text-sm tracking-wider uppercase border-b border-black pb-1 mb-0">
              Tax Invoice
            </div>

            {/* Top Grid: Supplier (Left) & Invoice Metadata (Right) */}
            <div className="grid grid-cols-2 border-b border-black">
              {/* Left Box: Supplier Profile */}
              <div className="p-2 border-r border-black flex flex-col justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    {supplier.logo_url ? (
                      <div className="flex items-center">
                        <img
                          src={supplier.logo_url}
                          alt={supplier.name || 'Supplier Logo'}
                          className="max-h-12 max-w-[140px] object-contain select-none mr-2"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl font-black tracking-tight font-serif italic text-black">
                        {supplier.logo_text || supplier.name || ''}
                      </span>
                    )}
                    <div>
                      {supplier.name && (
                        <div className="font-bold text-xs leading-none text-black">
                          {supplier.name}
                        </div>
                      )}
                      {supplier.division && (
                        <div className="text-[10px] text-gray-700 italic">
                          {supplier.division}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-1 text-[10px] text-gray-900 leading-snug">
                    {supplier.address1 && <div>{supplier.address1}</div>}
                    {supplier.address2 && <div>{supplier.address2}</div>}
                    {(supplier.city || supplier.pin) && <div>{[supplier.city, supplier.pin].filter(Boolean).join(' - ')}</div>}
                    {supplier.udyam && <div><strong>UDYAM :</strong> {supplier.udyam}</div>}
                    {supplier.gstin && <div><strong>GSTIN/UIN:</strong> {supplier.gstin}</div>}
                    {(supplier.state || supplier.state_code) && (
                      <div><strong>State Name :</strong> {supplier.state}{supplier.state_code ? `, Code : ${supplier.state_code}` : ''}</div>
                    )}
                    {supplier.email && <div><strong>E-Mail :</strong> {supplier.email}</div>}
                  </div>
                </div>
              </div>

              {/* Right Box: Invoice Reference Metadata Grid */}
              <div className="text-[10px]">
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Invoice No.</div>
                    <div className="font-bold text-xs font-mono">{invoiceNumber}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Dated</div>
                    <div className="font-bold text-xs">{invoiceDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Delivery Note</div>
                    <div className="font-medium text-[10px]">{otherRef.split(',')[0]}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Mode/Terms of Payment</div>
                    <div className="font-bold text-[10px]">{paymentTerms}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Reference No. &amp; Date.</div>
                    <div className="font-medium text-[10px]">{refNo}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Other References</div>
                    <div className="font-medium text-[10px]">{otherRef}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Buyer's Order No.</div>
                    <div className="font-bold text-[10px]">{buyersOrderNo}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Dated</div>
                    <div className="font-bold text-[10px]">{orderDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Dispatch Doc No.</div>
                    <div className="font-medium text-[10px]">-</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Delivery Note Date</div>
                    <div className="font-medium text-[10px]">-</div>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Dispatched through</div>
                    <div className="font-bold text-[10px]">{dispatchedThrough}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Destination</div>
                    <div className="font-bold text-[10px]">{destination}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer (Bill To) & Terms of Delivery Section */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-2 border-r border-black text-[10px] leading-tight">
                <div className="text-gray-600 text-[9px] font-semibold mb-0.5">Buyer (Bill to)</div>
                {buyerName && <div className="font-bold text-xs uppercase text-black">{buyerName}</div>}
                {buyerAddress && <div className="text-gray-800 whitespace-pre-line">{buyerAddress}</div>}
                {buyerGstin && (
                  <div className="mt-1">
                    <strong>GSTIN/UIN :</strong> {buyerGstin}
                  </div>
                )}
                {buyerState && (
                  <div>
                    <strong>State Name :</strong> {buyerState}
                  </div>
                )}
              </div>
              <div className="p-2 text-[10px]">
                <div className="text-gray-600 text-[9px] font-semibold mb-0.5">Terms of Delivery</div>
                <div className="text-gray-700 italic">
                  Calibrated instruments delivered in accordance with NABL ISO/IEC 17025 accredited calibration lab terms. Safe handling certified.
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* Main Itemized Services Table */}
            {/* ================================================================ */}
            <table className="w-full border-collapse border-b border-black text-[10px]">
              <thead>
                <tr className="border-b border-black text-center font-bold bg-[#F9FAFB]">
                  <th className="border-r border-black p-1 w-[6%]">Sl No.</th>
                  <th className="border-r border-black p-1 w-[46%] text-left">Description of Services</th>
                  <th className="border-r border-black p-1 w-[10%]">HSN/SAC</th>
                  <th className="border-r border-black p-1 w-[10%]">Quantity</th>
                  <th className="border-r border-black p-1 w-[10%] text-right">Rate</th>
                  <th className="border-r border-black p-1 w-[6%]">per</th>
                  <th className="p-1 w-[12%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                      No invoice line items recorded.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                  return (
                    <tr key={it.id || idx} className="align-top leading-tight">
                      <td className="border-r border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border-r border-black p-1.5 text-left">
                        {it.description.toLowerCase().includes('charge') ||
                        it.description.toLowerCase().includes('fee') ||
                        it.description.toLowerCase().includes('surcharge') ? (
                          <div className="font-bold text-black">{it.description}</div>
                        ) : (
                          <>
                            <div className="font-bold text-black">Calibration Charges</div>
                            <div className="italic text-gray-800 pl-2">
                              {it.description.replace(/^Calibration Charges\s*[-–]?\s*/i, '') || it.description}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="border-r border-black p-1.5 text-center font-mono">
                        {it.hsn_sac_code || '998346'}
                      </td>
                      <td className="border-r border-black p-1.5 text-center font-bold font-mono">
                        {it.quantity} NOS
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-mono">
                        {Number(it.unit_price).toFixed(2)}
                      </td>
                      <td className="border-r border-black p-1.5 text-center">NOS</td>
                      <td className="p-1.5 text-right font-mono font-bold">
                        {Number(it.total_price).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}

                {/* Blank rows to give authentic paper invoice height */}
                {items.length < 7 && (
                  <tr style={{ height: `${(7 - items.length) * 22}px` }}>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}

                {/* Subtotals & Taxes inside table box */}
                <tr className="border-t border-black">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black p-1 text-right font-bold" colSpan={5}>
                    {isIntraState ? (
                      <div className="space-y-1">
                        <div>Subtotal Taxable Value</div>
                        <div>CGST (9%)</div>
                        <div>SGST (9%)</div>
                        {roundOff !== 0 && <div>Less : Rounded Off</div>}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div>Subtotal Taxable Value</div>
                        <div>IGST (18%)</div>
                        {roundOff !== 0 && <div>Less : Rounded Off</div>}
                      </div>
                    )}
                  </td>
                  <td className="p-1 text-right font-mono font-bold">
                    <div className="space-y-1">
                      <div>{taxableSubtotal.toFixed(2)}</div>
                      {isIntraState ? (
                        <>
                          <div>{cgstAmount.toFixed(2)}</div>
                          <div>{sgstAmount.toFixed(2)}</div>
                        </>
                      ) : (
                        <div>{igstAmount.toFixed(2)}</div>
                      )}
                      {roundOff !== 0 && <div>({roundOff < 0 ? '-' : ''}{Math.abs(roundOff).toFixed(2)})</div>}
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-b-2 border-black font-bold bg-[#F9FAFB]">
                  <td className="border-r border-black p-1.5 text-right uppercase tracking-wider font-bold" colSpan={3}>
                    Amount Paid
                  </td>
                  <td className="border-r border-black p-1.5 text-center font-mono font-bold">
                    {totalQuantity} NOS
                  </td>
                  <td className="border-r border-black p-1.5" colSpan={2}></td>
                  <td className="p-1.5 text-right font-mono font-black text-xs">
                    ₹ {roundedTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount Paid (in words) */}
            <div className="p-2 border-b border-black text-[10px]">
              <div className="text-gray-600 text-[9px] font-semibold">Amount Paid (in words)</div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-black">{amountInWords}</span>
                <span className="font-mono text-[9px] text-gray-500">E. &amp; O.E</span>
              </div>
            </div>

            {/* ================================================================ */}
            {/* HSN / SAC Tax Summary Grid */}
            {/* ================================================================ */}
            <div className="border-b border-black text-[9px]">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="border-b border-black font-bold bg-[#F9FAFB]">
                    <th className="border-r border-black p-1" rowSpan={2}>HSN/SAC</th>
                    <th className="border-r border-black p-1" rowSpan={2}>Taxable Value</th>
                    {isIntraState ? (
                      <>
                        <th className="border-r border-black p-1" colSpan={2}>CGST</th>
                        <th className="border-r border-black p-1" colSpan={2}>SGST/UTGST</th>
                      </>
                    ) : (
                      <th className="border-r border-black p-1" colSpan={2}>IGST</th>
                    )}
                    <th className="p-1" rowSpan={2}>Total Tax Amount</th>
                  </tr>
                  <tr className="border-b border-black font-bold bg-[#F9FAFB]">
                    {isIntraState ? (
                      <>
                        <th className="border-r border-black p-0.5">Rate</th>
                        <th className="border-r border-black p-0.5">Amount</th>
                        <th className="border-r border-black p-0.5">Rate</th>
                        <th className="border-r border-black p-0.5">Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="border-r border-black p-0.5">Rate</th>
                        <th className="border-r border-black p-0.5">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-mono">
                    <td className="border-r border-black p-1">998346</td>
                    <td className="border-r border-black p-1">{taxableSubtotal.toFixed(2)}</td>
                    {isIntraState ? (
                      <>
                        <td className="border-r border-black p-1">9%</td>
                        <td className="border-r border-black p-1">{cgstAmount.toFixed(2)}</td>
                        <td className="border-r border-black p-1">9%</td>
                        <td className="border-r border-black p-1">{sgstAmount.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-black p-1">18%</td>
                        <td className="border-r border-black p-1">{igstAmount.toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-1 font-bold">{totalTax.toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-black font-bold font-mono bg-[#F9FAFB]">
                    <td className="border-r border-black p-1">Total</td>
                    <td className="border-r border-black p-1">{taxableSubtotal.toFixed(2)}</td>
                    {isIntraState ? (
                      <>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1">{cgstAmount.toFixed(2)}</td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1">{sgstAmount.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1">{igstAmount.toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-1">{totalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Amount in Words */}
            <div className="p-2 border-b border-black text-[10px]">
              <span className="text-gray-700">Tax Amount (in words) : </span>
              <strong className="text-black">{taxInWords}</strong>
            </div>

            {/* Declaration & Bank Details & Signatures */}
            <div className="grid grid-cols-2 border-b border-black text-[10px]">
              {/* Left: Declaration */}
              <div className="p-2 border-r border-black flex flex-col justify-between">
                <div>
                  <div className="font-bold underline text-[9px] mb-1">Declaration</div>
                  <p className="text-gray-800 leading-snug">
                    We declare that this invoice shows the actual price of the goods and services described and that all particulars are true and correct.
                  </p>
                </div>
                <div className="pt-8 text-center text-gray-700 font-semibold border-t border-dashed border-gray-300">
                  Customer's Seal and Signature
                </div>
              </div>

              {/* Right: Company's Bank Details & Signatory */}
              <div className="p-2 flex flex-col justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold underline text-[9px] mb-1">Company's Bank Details</div>
                  {supplier.bank_name && <div><strong>Bank Name :</strong> {supplier.bank_name}</div>}
                  {supplier.account_no && <div><strong>A/c No. :</strong> {supplier.account_no}</div>}
                  {supplier.branch_ifsc && <div><strong>Branch &amp; IFS Code :</strong> {supplier.branch_ifsc}</div>}
                </div>

                <div className="pt-8 text-right">
                  <div className="font-bold text-[10px]">for {supplier.name || ''}</div>
                  <div className="h-6"></div>
                  <div className="font-semibold text-gray-800">Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Computer Generated Note */}
          <div className="text-center text-[9px] text-gray-500 pt-2 italic">
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>

      <EditLabProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={supplier}
        onSave={async (updated) => {
          await updateLabProfile(updated);
        }}
        onReset={async () => {
          await resetToDefault();
        }}
      />
    </div>
  );
};
