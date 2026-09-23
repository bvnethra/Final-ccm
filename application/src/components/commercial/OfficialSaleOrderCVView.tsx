import React, { useRef, useState } from 'react';
import type { CalibrationRequest, Client, LabIssuerProfile } from '../../types/domain';
import { Button } from '../ui/UIPrimitives';
import { ArrowLeft, Settings2, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { numberToIndianWords, formatInvoiceDate } from './OfficialTaxInvoiceView';
import { useLabProfile } from '../../hooks/useLabProfile';
import { EditLabProfileModal } from './EditLabProfileModal';

export interface OfficialSaleOrderCVViewProps {
  request: CalibrationRequest;
  client?: Client;
  issuerProfile?: LabIssuerProfile;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const OfficialSaleOrderCVView: React.FC<OfficialSaleOrderCVViewProps> = ({
  request,
  client: customClient,
  issuerProfile: customIssuer,
  onClose,
  isFullPage = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const { labProfile, updateLabProfile, resetToDefault } = useLabProfile();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Dynamic Issuer / Lab Profile Details (zero hardcoding)
  const issuer = customIssuer || labProfile;

  // Client / Buyer Details
  const client = customClient || request.clients;
  const buyerName = client?.client_name || '';
  const buyerAddress = client?.address
    ? [client.address, client.city, client.state, client.pin].filter(Boolean).join(', ')
    : '';
  const buyerGstin = client?.gst_tax_number || '';
  const buyerStateCode =
    buyerGstin && buyerGstin.length >= 2 && !isNaN(Number(buyerGstin.slice(0, 2)))
      ? buyerGstin.slice(0, 2)
      : '';
  const buyerStateName = client?.state || '';
  const buyerState = [buyerStateName, buyerStateCode ? `Code : ${buyerStateCode}` : ''].filter(Boolean).join(', ');

  // Items and Calculation
  const items = request.request_items || [];
  const totalQuantity = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const subtotal = items.reduce((sum, it) => {
    const rate = typeof it.unit_rate === 'number' ? it.unit_rate : (it.item_masters?.standard_cost || 0);
    return sum + (Number(it.quantity) || 0) * rate;
  }, 0);

  const cgstAmount = Math.round(subtotal * 0.09 * 100) / 100;
  const sgstAmount = Math.round(subtotal * 0.09 * 100) / 100;
  const rawTotal = subtotal + cgstAmount + sgstAmount;
  const totalAmount = Math.round(rawTotal);
  const roundedOff = Math.round((totalAmount - rawTotal) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${isFullPage ? '' : 'max-h-[90vh] overflow-y-auto'}`}>
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-[#E5E7EB] rounded-md shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          {onClose ? (
            <Button variant="secondary" size="sm" onClick={onClose}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <Link to="/requests">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-4" /> Back
              </Button>
            </Link>
          )}
          <span className="text-xs font-bold text-[#111827] uppercase tracking-wide">
            Sale Order / CV (Voucher No: {request.voucher_no || request.request_number})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            className="text-xs"
          >
            <Settings2 className="size-3.5 text-[#4B5563]" /> Lab Issuer Profile
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="text-xs">
            <Printer className="size-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* 1:1 Physical Document Container matching scanned SALE ORDER / CV */}
      <div
        ref={printableRef}
        id="official-cv-voucher"
        className="bg-white text-black font-sans text-[11px] leading-tight border border-black shadow-lg mx-auto print:shadow-none print:border-black print:m-0 print:w-full"
        style={{ width: '100%', maxWidth: '850px' }}
      >
        {/* Document Header Title */}
        <div className="border-b border-black py-1.5 px-4 text-center font-bold text-sm tracking-wider flex items-center justify-between">
          <span className="text-[10px] uppercase font-normal text-gray-700">CV Form / Inward Challan</span>
          <span className="text-base font-extrabold tracking-wide">SALE ORDER / CV</span>
          <span className="font-mono text-xs border border-black px-2 py-0.5 rounded font-bold">
            CV Register
          </span>
        </div>

        {/* Header Block: Two Columns (Bill From Supplier / Voucher Meta) */}
        <div className="grid grid-cols-12 border-b border-black">
          {/* Supplier (Left 7 Cols) */}
          <div className="col-span-7 p-3 border-r border-black space-y-1">
            <div className="text-base font-black tracking-tight text-black uppercase">
              {issuer.name}
            </div>
            {issuer.logo_tagline && (
              <div className="text-[11px] font-semibold text-gray-800">
                ({issuer.logo_tagline})
              </div>
            )}
            <div className="text-[11px] leading-snug">
              {issuer.address1 && <div>{issuer.address1}</div>}
              {issuer.address2 && <div>{issuer.address2}</div>}
              {(issuer.city || issuer.state || issuer.pin) && (
                <div>
                  {[issuer.city, [issuer.state, issuer.pin].filter(Boolean).join(' - ')].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            <div className="pt-1 text-[11px] space-y-0.5">
              {issuer.gstin && (
                <div>
                  <strong>GSTIN/UIN:</strong> {issuer.gstin}
                </div>
              )}
              {(issuer.state || issuer.state_code) && (
                <div>
                  <strong>State Name:</strong> {issuer.state}{issuer.state_code ? `, Code: ${issuer.state_code}` : ''}
                </div>
              )}
              {issuer.email && (
                <div>
                  <strong>E-Mail:</strong> {issuer.email}
                </div>
              )}
            </div>
          </div>

          {/* Voucher Metadata Grid (Right 5 Cols) */}
          <div className="col-span-5 divide-y divide-black text-[10.5px]">
            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-gray-600 block">Voucher No.</span>
                <span className="font-mono font-bold text-xs">{request.voucher_no || request.request_number}</span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-gray-600 block">Dated</span>
                <span className="font-semibold">{formatInvoiceDate(request.collection_date || request.created_at)}</span>
              </div>
            </div>

            <div className="p-1.5">
              <span className="text-[9px] text-gray-600 block">Mode/Terms of Payment</span>
              <span className="font-semibold">{request.payment_terms || '—'}</span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-gray-600 block">Buyer's Ref./Order No.</span>
                <span className="font-mono font-semibold truncate block">
                  {request.client_po_ref || request.voucher_no || request.request_number}
                </span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-gray-600 block">Other References</span>
                <span className="text-[10px] font-medium truncate block">{request.dc_number || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-black p-1.5">
              <div>
                <span className="text-[9px] text-gray-600 block">Dispatched through</span>
                <span className="font-semibold">{request.dispatched_through || '—'}</span>
              </div>
              <div className="pl-1.5">
                <span className="text-[9px] text-gray-600 block">Destination</span>
                <span className="font-semibold truncate block">{client?.city || client?.state || '—'}</span>
              </div>
            </div>

            <div className="p-1.5">
              <span className="text-[9px] text-gray-600 block">Terms of Delivery</span>
              <span className="text-[10px]">Ex-Laboratory / Customer Premise Inward</span>
            </div>
          </div>
        </div>

        {/* Buyer (Bill to) Details */}
        <div className="p-3 border-b border-black">
          <div className="text-[10px] font-bold text-gray-700 uppercase mb-1">
            Buyer (Bill to)
          </div>
          <div className="text-sm font-bold uppercase">{buyerName}</div>
          <div className="text-[11px] leading-snug whitespace-pre-line max-w-xl">
            {buyerAddress}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-6 gap-y-0.5 text-[11px]">
            <div>
              <strong>GSTIN/UIN:</strong> {buyerGstin}
            </div>
            <div>
              <strong>State Name:</strong> {buyerState}
            </div>
          </div>
        </div>

        {/* Services & Equipment Line Items Table */}
        <div className="border-b border-black">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-black bg-gray-50 text-[10px] uppercase font-bold text-center">
                <th className="py-2 px-2 border-r border-black w-10">Sl No.</th>
                <th className="py-2 px-3 border-r border-black text-left">Description of Services</th>
                <th className="py-2 px-2 border-r border-black w-20">HSN/SAC</th>
                <th className="py-2 px-2 border-r border-black w-20">Quantity</th>
                <th className="py-2 px-2 border-r border-black w-20 text-right">Rate</th>
                <th className="py-2 px-2 border-r border-black w-14">per</th>
                <th className="py-2 px-3 w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => {
                const itemMaster = item.item_masters;
                const unitRate = typeof item.unit_rate === 'number' ? item.unit_rate : (itemMaster?.standard_cost || 0);
                const lineTotal = (Number(item.quantity) || 0) * unitRate;

                return (
                  <tr key={item.id || idx} className="align-top">
                    <td className="py-2.5 px-2 text-center border-r border-black font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-black space-y-0.5">
                      <div className="font-bold text-[11px]">
                        Calibration Charges
                      </div>
                      <div className="italic text-gray-800 font-medium">
                        {itemMaster?.item_name || 'Instrument'}
                        {itemMaster?.measurement_range && ` (${itemMaster.measurement_range})`}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-600">
                        {item.item_code && <span><strong>Code:</strong> {item.item_code}</span>}
                        {item.serial_number && <span>• <strong>SN:</strong> {item.serial_number}</span>}
                        <span>• <strong>Condition:</strong> {item.item_condition || 'GOOD'}</span>
                      </div>
                      {/* Destination Routing Indicator */}
                      <div className="pt-0.5 text-[9.5px]">
                        {item.destination === 'VENDOR_OUTSOURCE' ? (
                          <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold">
                            🏢 Vendor Outsource: {item.vendor_name || 'External Lab'}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.2 bg-blue-50 text-blue-900 border border-blue-200 rounded font-semibold">
                            🔬 Lab In-House Bench
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-black font-mono">
                      998346
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-black font-bold">
                      {item.quantity} NOS
                    </td>
                    <td className="py-2.5 px-2 text-right border-r border-black font-mono">
                      {unitRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-black">
                      NOS
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Subtotal & GST rows */}
              <tr className="border-t border-black font-semibold">
                <td colSpan={6} className="py-1 px-3 text-right border-r border-black">
                  Subtotal
                </td>
                <td className="py-1 px-3 text-right font-mono font-bold">
                  {subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="py-1 px-3 text-right border-r border-black font-semibold">
                  CGST (9%)
                </td>
                <td className="py-1 px-3 text-right font-mono">
                  {cgstAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="py-1 px-3 text-right border-r border-black font-semibold">
                  SGST (9%)
                </td>
                <td className="py-1 px-3 text-right font-mono">
                  {sgstAmount.toFixed(2)}
                </td>
              </tr>
              {roundedOff !== 0 && (
                <tr>
                  <td colSpan={6} className="py-1 px-3 text-right border-r border-black italic text-gray-600">
                    Rounded Off
                  </td>
                  <td className="py-1 px-3 text-right font-mono">
                    {roundedOff > 0 ? `+${roundedOff.toFixed(2)}` : roundedOff.toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold bg-gray-50">
                <td colSpan={3} className="py-2 px-3 text-right border-r border-black uppercase">
                  Total
                </td>
                <td className="py-2 px-2 text-center border-r border-black font-extrabold">
                  {totalQuantity} NOS
                </td>
                <td colSpan={2} className="border-r border-black"></td>
                <td className="py-2 px-3 text-right font-mono text-xs font-black">
                  ₹ {totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in words & E. & O.E */}
        <div className="p-3 border-b border-black flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-gray-600 block">Amount Chargeable (in words)</span>
            <span className="font-bold text-xs">{numberToIndianWords(totalAmount)}</span>
          </div>
          <div className="text-right text-[11px] font-bold text-gray-700">
            E. &amp; O.E
          </div>
        </div>

        {/* Bank Details & Authorised Signatory */}
        <div className="grid grid-cols-12 min-h-[110px]">
          {/* Company Bank Details (Left 7 Cols) */}
          <div className="col-span-7 p-3 border-r border-black space-y-1">
            <div className="text-[10px] font-bold text-gray-700 uppercase">
              Company's Bank Details
            </div>
            <div className="text-[10.5px] space-y-0.5">
              {issuer.bank_name && (
                <div>
                  <strong>Bank Name:</strong> {issuer.bank_name}
                </div>
              )}
              {issuer.account_no && (
                <div>
                  <strong>A/c No.:</strong> {issuer.account_no}
                </div>
              )}
              {issuer.branch_ifsc && (
                <div>
                  <strong>Branch &amp; IFS Code:</strong> {issuer.branch_ifsc}
                </div>
              )}
            </div>
          </div>

          {/* Authorised Signatory (Right 5 Cols) */}
          <div className="col-span-5 p-3 flex flex-col justify-between text-right">
            <div className="text-[10.5px] font-bold">
              for {issuer.name}
            </div>
            <div className="text-[10.5px] font-bold pt-10 border-t border-dotted border-gray-400">
              Authorised Signatory
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="border-t border-black py-1 text-center text-[9px] text-gray-600 font-medium">
          This is a Computer Generated Document
        </div>
      </div>

      {/* Profile Editor Modal */}
      {isEditProfileOpen && (
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
      )}
    </div>
  );
};

export default OfficialSaleOrderCVView;
