import React, { useRef, useState } from 'react';
import type { OutsourcePO, Vendor, CalibrationRequest, LabIssuerProfile } from '../../types/domain';
import { Button } from '../ui/UIPrimitives';
import { Download, ArrowLeft, Truck, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { numberToIndianWords, formatInvoiceDate } from './OfficialTaxInvoiceView';
import { useLabProfile } from '../../hooks/useLabProfile';
import { EditLabProfileModal } from './EditLabProfileModal';

export interface OfficialVendorPOViewProps {
  outsourcePO: OutsourcePO;
  vendor?: Vendor;
  request?: CalibrationRequest;
  issuerProfile?: LabIssuerProfile;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const OfficialVendorPOView: React.FC<OfficialVendorPOViewProps> = ({
  outsourcePO,
  vendor,
  request,
  issuerProfile: customIssuer,
  onClose,
  isFullPage = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const { labProfile, updateLabProfile, resetToDefault } = useLabProfile();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Dynamic Issuer / Invoice To Details
  const issuer = customIssuer || labProfile;

  // Vendor / Supplier Details
  const supplierName = vendor?.vendor_name || outsourcePO.vendor_name || '';
  const addressParts = [
    vendor?.address,
    vendor?.city,
  ].filter(Boolean);
  const supplierAddress = addressParts.length > 0 ? addressParts.join('\n') : '';

  const supplierGstin = vendor?.gst_tax_number || '';
  const supplierStateCode =
    supplierGstin && supplierGstin.length >= 2 && !isNaN(Number(supplierGstin.slice(0, 2)))
      ? supplierGstin.slice(0, 2)
      : '';
  const supplierStateName = vendor?.state || '';
  const supplierState = supplierStateName ? `${supplierStateName}${supplierStateCode ? `, Code : ${supplierStateCode}` : ''}` : '';

  // PO Metadata
  const voucherNo =
    outsourcePO.voucher_no ||
    outsourcePO.vendor_po_number.replace(/^VPO-\d{4}-/, '') ||
    outsourcePO.vendor_po_number ||
    '';
  const poDate = formatInvoiceDate(outsourcePO.sent_date || outsourcePO.created_at);
  const paymentTerms = outsourcePO.payment_terms || '30 Days';
  const refNo = voucherNo ? `${voucherNo}` : '';
  const otherRef = outsourcePO.remarks || '';
  const dispatchedThrough = outsourcePO.dispatched_through || 'By Hand';
  const destination = outsourcePO.destination || vendor?.city || '';
  const termsOfDelivery = outsourcePO.terms_of_delivery || '';

  // Line items
  const matchedRequestItem = request?.request_items?.find(
    (it: any) => it.id === outsourcePO.request_item_id
  );

  const items =
    outsourcePO.items && outsourcePO.items.length > 0
      ? outsourcePO.items
      : matchedRequestItem
      ? [
          {
            id: matchedRequestItem.id,
            description: matchedRequestItem.item_masters?.item_name || 'Specialized Calibration Instrument',
            due_on: formatInvoiceDate(outsourcePO.expected_return_date || outsourcePO.sent_date),
            quantity: matchedRequestItem.received_quantity || matchedRequestItem.quantity || 1,
            unit_rate: outsourcePO.vendor_cost || 0,
            per: 'NOS',
            total_price:
              (matchedRequestItem.received_quantity || matchedRequestItem.quantity || 1) *
              (outsourcePO.vendor_cost || 0),
          },
        ]
      : [];

  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  const subtotal = items.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0);

  // Tax calculation (Intrastate TN: 9% SGST + 9% CGST; Interstate: 18% IGST)
  const isIntraState = supplierStateCode === issuer.state_code;
  const sgstAmount = isIntraState ? Math.round(subtotal * 0.09 * 100) / 100 : 0;
  const cgstAmount = isIntraState ? Math.round(subtotal * 0.09 * 100) / 100 : 0;
  const igstAmount = !isIntraState ? Math.round(subtotal * 0.18 * 100) / 100 : 0;
  const totalTax = isIntraState ? sgstAmount + cgstAmount : igstAmount;
  const grandTotal = Math.round(subtotal + totalTax);

  const amountInWords = numberToIndianWords(grandTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-700 rounded-[4px] shadow-sm">
        <div className="flex items-center gap-2">
          {isFullPage && (
            <Link to="/masters/vendors">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-4" /> Back to Vendors
              </Button>
            </Link>
          )}
          <span className="font-bold text-sm text-[#111827] dark:text-neutral-100 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
              <Truck className="size-3.5" /> VENDOR PURCHASE ORDER
            </span>
            <span className="font-mono text-[#0274BB]">{outsourcePO.vendor_po_number}</span>
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

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Download className="size-4" /> Export as PDF / Print
          </Button>
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* Printable Vendor Purchase Order Voucher (1:1 with Physical Scan)    */}
      {/* ==================================================================== */}
      <div className="flex justify-center bg-[#525659] p-2 sm:p-6 overflow-x-auto">
        <div
          ref={printableRef}
          id="official-vendor-po-printable"
          className="bg-white text-black font-sans leading-tight shadow-2xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '8mm',
            boxSizing: 'border-box',
            fontSize: '11px',
          }}
        >
          {/* Main Outer Box */}
          <div className="border border-black">
            {/* Document Title Header */}
            <div className="text-center font-bold text-sm tracking-wider uppercase border-b border-black py-1.5">
              PURCHASE ORDER
            </div>

            {/* Top Section: Issuer Details (Left) + PO Metadata Grid (Right) */}
            <div className="grid grid-cols-2 border-b border-black">
              {/* Left Box: Invoice To (Tespa Issuer) */}
              <div className="p-2 border-r border-black flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-gray-600 font-semibold mb-1">Invoice To</div>
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      {issuer.logo_url ? (
                        <div className="flex items-center">
                          <img
                            src={issuer.logo_url}
                            alt={issuer.name || 'Lab Logo'}
                            className="max-h-12 max-w-[140px] object-contain select-none mr-2"
                          />
                        </div>
                      ) : (
                        <span className="text-2xl font-black tracking-tight font-serif italic text-black">
                          {issuer.logo_text || issuer.name || ''}
                        </span>
                      )}
                      <div>
                        {issuer.name && (
                          <div className="font-bold text-xs leading-none text-black">
                            {issuer.name}
                          </div>
                        )}
                        {issuer.division && (
                          <div className="text-[10px] text-gray-700 italic">
                            {issuer.division}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-1 text-[10px] text-gray-900 leading-snug">
                      {issuer.address1 && <div>{issuer.address1}</div>}
                      {issuer.address2 && <div>{issuer.address2}</div>}
                      {(issuer.city || issuer.pin) && <div>{[issuer.city, issuer.pin].filter(Boolean).join(' - ')}</div>}
                      {issuer.udyam && <div><strong>UDYAM :</strong> {issuer.udyam}</div>}
                      {issuer.gstin && <div><strong>GSTIN/UIN:</strong> {issuer.gstin}</div>}
                      {(issuer.state || issuer.state_code) && (
                        <div><strong>State Name :</strong> {issuer.state}{issuer.state_code ? `, Code : ${issuer.state_code}` : ''}</div>
                      )}
                      {issuer.email && <div><strong>E-Mail :</strong> {issuer.email}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Box: Metadata Grid */}
              <div className="text-[10px]">
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1.5 border-r border-black">
                    <div className="text-gray-600 text-[9px]">Voucher No.</div>
                    <div className="font-bold text-xs font-mono">{voucherNo}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Dated</div>
                    <div className="font-bold text-xs">{poDate}</div>
                  </div>
                </div>

                <div className="border-b border-black p-1.5">
                  <div className="text-gray-600 text-[9px]">Mode/Terms of Payment</div>
                  <div className="font-bold text-[10px]">{paymentTerms}</div>
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
                    <div className="text-gray-600 text-[9px]">Dispatched through</div>
                    <div className="font-medium text-[10px]">{dispatchedThrough}</div>
                  </div>
                  <div className="p-1.5">
                    <div className="text-gray-600 text-[9px]">Destination</div>
                    <div className="font-medium text-[10px]">{destination}</div>
                  </div>
                </div>

                <div className="p-1.5">
                  <div className="text-gray-600 text-[9px]">Terms of Delivery</div>
                  <div className="text-gray-700 italic text-[9px]">
                    {termsOfDelivery || 'NABL accredited calibration service with master standard traceability.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier (Bill from) Section */}
            <div className="p-2 border-b border-black text-[10px] leading-snug">
              <div className="text-gray-600 text-[9px] font-semibold mb-0.5">
                Supplier (Bill from)
              </div>
              {supplierName && <div className="font-bold text-xs uppercase text-black">{supplierName}</div>}
              {supplierAddress && <div className="text-gray-800 whitespace-pre-line">{supplierAddress}</div>}
              {supplierGstin && (
                <div className="mt-1">
                  <strong>GSTIN/UIN :</strong> {supplierGstin}
                </div>
              )}
              {supplierState && (
                <div>
                  <strong>State Name :</strong> {supplierState}
                </div>
              )}
            </div>

            {/* ================================================================ */}
            {/* Main Itemized Services Table                                     */}
            {/* ================================================================ */}
            <table className="w-full border-collapse border-b border-black text-[10px]">
              <thead>
                <tr className="border-b border-black text-center font-bold bg-[#F9FAFB]">
                  <th className="border-r border-black p-1 w-[6%]">Sl No.</th>
                  <th className="border-r border-black p-1 w-[46%] text-left">Description of Services</th>
                  <th className="border-r border-black p-1 w-[12%]">Due on</th>
                  <th className="border-r border-black p-1 w-[10%]">Quantity</th>
                  <th className="border-r border-black p-1 w-[10%] text-right">Rate</th>
                  <th className="border-r border-black p-1 w-[6%]">per</th>
                  <th className="p-1 w-[10%] text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                      No purchase order line items recorded.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                  <tr key={it.id || idx} className="align-top leading-tight">
                    <td className="border-r border-black p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border-r border-black p-1.5 text-left">
                      <div className="font-bold text-black">Calibration Charges</div>
                      <div className="italic text-gray-800 pl-2">
                        {it.description.replace(/^Calibration Charges\s*[-–]?\s*/i, '')}
                      </div>
                    </td>
                    <td className="border-r border-black p-1.5 text-center font-mono">
                      {it.due_on || poDate}
                    </td>
                    <td className="border-r border-black p-1.5 text-center font-bold font-mono">
                      {it.quantity} NOS
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono">
                      {Number(it.unit_rate).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-r border-black p-1.5 text-center">{it.per || 'NOS'}</td>
                    <td className="p-1.5 text-right font-mono font-bold">
                      {Number(it.total_price).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}

                {/* Blank rows to give authentic paper height */}
                {items.length < 6 && (
                  <tr style={{ height: `${(6 - items.length) * 26}px` }}>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}

                {/* Subtotal Row */}
                <tr className="border-t border-black">
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black p-1.5 text-right font-semibold text-gray-600"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="p-1.5 text-right font-mono font-semibold">
                    {subtotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>

                {/* Tax Breakdown Rows (matching physical document layout) */}
                {isIntraState ? (
                  <>
                    <tr>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-1 text-right font-bold pr-3">SGST</td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="p-1 text-right font-mono">
                        {sgstAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black p-1 text-right font-bold pr-3">CGST</td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="p-1 text-right font-mono">
                        {cgstAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black p-1 text-right font-bold pr-3">IGST</td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="p-1 text-right font-mono">
                      {igstAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                )}

                {/* Total Row */}
                <tr className="border-t border-black font-bold bg-[#F9FAFB]">
                  <td className="border-r border-black p-1 text-right" colSpan={3}>
                    Total
                  </td>
                  <td className="border-r border-black p-1 text-center font-mono font-bold">
                    {totalQuantity} NOS
                  </td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="p-1 text-right font-mono font-bold text-xs">
                    ₹ {grandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bottom Section: Amount Chargeable in words + Disclaimers */}
            <div className="flex justify-between items-start p-2 border-b border-black text-[10px]">
              <div>
                <div className="text-gray-600 text-[9px]">Amount Chargeable (in words)</div>
                <div className="font-bold text-[10px] text-black pt-0.5">{amountInWords}</div>
              </div>
              <div className="font-mono text-[9px] text-gray-600">E. &amp; O.E</div>
            </div>

            {/* Signatory Section */}
            <div className="flex justify-end p-2 pb-3">
              <div className="text-right text-[10px] space-y-9 pr-2">
                <div className="font-bold text-black">for {issuer.name || ''}</div>
                <div className="font-bold text-gray-800 pt-3">Authorised Signatory</div>
              </div>
            </div>
          </div>

          {/* Computer Generated Notice */}
          <div className="text-center text-[9px] text-gray-600 pt-2">
            This is a Computer Generated Document
          </div>
        </div>
      </div>

      <EditLabProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={issuer}
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

export default OfficialVendorPOView;
