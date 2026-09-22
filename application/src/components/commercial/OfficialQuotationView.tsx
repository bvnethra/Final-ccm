import React, { useRef, useState } from 'react';
import type { Quotation, Client, CalibrationRequest, LabIssuerProfile } from '../../types/domain';
import { Button } from '../ui/UIPrimitives';
import { Download, ArrowLeft, Receipt, CheckCircle2, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLabProfile } from '../../hooks/useLabProfile';
import { EditLabProfileModal } from './EditLabProfileModal';

export interface OfficialQuotationViewProps {
  quotation: Quotation;
  client?: Client;
  request?: CalibrationRequest;
  issuerProfile?: LabIssuerProfile;
  onClose?: () => void;
  onGenerateInvoice?: () => void;
  isFullPage?: boolean;
}

// Convert numbers into standard Indian Currency Words format
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

export function formatQuotationDate(dateStr?: string): string {
  if (!dateStr) return '09.03.2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

export const OfficialQuotationView: React.FC<OfficialQuotationViewProps> = ({
  quotation,
  client,
  request,
  issuerProfile: customIssuer,
  onClose,
  onGenerateInvoice,
  isFullPage = false,
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const { labProfile, updateLabProfile, resetToDefault } = useLabProfile();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Dynamic Issuer / Lab Details
  const issuer = customIssuer || labProfile;

  // Client Details resolution
  const clientName =
    client?.client_name ||
    request?.clients?.client_name ||
    quotation.calibration_requests?.clients?.client_name ||
    'M/s . SPIRAX SARCO INDIA PVT LTD';
  const clientAddress =
    client?.address ||
    request?.clients?.address ||
    quotation.calibration_requests?.clients?.address ||
    'MAHINDRA WORLD CITY, CHENGALPATTU';
  const kindAttn =
    quotation.kind_attn || client?.contact_person || request?.clients?.contact_person || 'Mr. TAMILANTHI';
  const phoneNo = quotation.phone_no || client?.phone || request?.clients?.phone || '6379891153';

  // Quotation Meta
  const refNo = quotation.reference_no || quotation.quotation_number || 'REF: TCC/CQ/26-27/1557';
  const formattedRef = refNo.startsWith('REF:') ? refNo : `REF: ${refNo}`;
  const quoteDate = quotation.quotation_date || formatQuotationDate(quotation.created_at);
  const subject = quotation.subject || 'Quotation for Calibration Charges for Instruments and Gauges - Reg.';
  const enquiryRef = quotation.enquiry_ref || 'verbal 31.08.2026';

  // Items fallback to scanned document defaults if empty
  const items =
    quotation.items && quotation.items.length > 0
      ? quotation.items
      : [
          {
            id: '1',
            quotation_id: quotation.id,
            description: 'Pressure Gauge',
            range: '0-16bar',
            quantity: 45,
            unit_price: 200.0,
            total_price: 9000.0,
          },
          {
            id: '2',
            quotation_id: quotation.id,
            description: 'Pressure Gauge',
            range: '16-200bar',
            quantity: 55,
            unit_price: 250.0,
            total_price: 13750.0,
          },
          {
            id: '3',
            quotation_id: quotation.id,
            description: 'Pressure Gauge',
            range: 'Above 200bar',
            quantity: 30,
            unit_price: 300.0,
            total_price: 9000.0,
          },
          {
            id: '4',
            quotation_id: quotation.id,
            description: 'Pressure Transducer',
            range: 'Upto 16bar',
            quantity: 10,
            unit_price: 200.0,
            total_price: 2000.0,
          },
          {
            id: '5',
            quotation_id: quotation.id,
            description: 'Pressure Transducer',
            range: '16-200bar',
            quantity: 20,
            unit_price: 250.0,
            total_price: 5000.0,
          },
          {
            id: '6',
            quotation_id: quotation.id,
            description: 'Pressure Transducer',
            range: '200bar',
            quantity: 15,
            unit_price: 300.0,
            total_price: 4500.0,
          },
          {
            id: '7',
            quotation_id: quotation.id,
            description: 'Onsite calibration charges / Day for 2 persons',
            range: '',
            quantity: 10,
            unit_price: 1000.0,
            total_price: 10000.0,
          },
        ];

  const grandTotalExcludingGst = items.reduce(
    (sum, it) => sum + (Number(it.total_price) || Number(it.quantity) * Number(it.unit_price) || 0),
    0
  );

  const gstAmount = Math.round(grandTotalExcludingGst * 0.18 * 100) / 100;
  const grandTotalWithGst = Math.round(grandTotalExcludingGst + gstAmount);
  const wordsRepresentation = numberToIndianWords(grandTotalWithGst);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-[#E5E7EB] dark:border-neutral-700 rounded-[4px] shadow-sm">
        <div className="flex items-center gap-2">
          {isFullPage && (
            <Link to="/commercial/quotations">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="size-4" /> Back to Quotations
              </Button>
            </Link>
          )}
          <span className="font-bold text-sm text-[#111827] dark:text-neutral-100 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <CheckCircle2 className="size-3.5" /> OFFICIAL QUOTATION
            </span>
            <span className="font-mono text-[#0274BB]">{quotation.quotation_number}</span>
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

          {onGenerateInvoice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateInvoice}
              className="flex items-center gap-1.5 text-xs"
            >
              <Receipt className="size-4 text-[#0274BB]" /> Generate Tax Invoice
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

          {onClose && (
            <Button variant="outlineInk" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Printable Sheet reproducing the physical scanned PDF */}
      <div className="bg-white dark:bg-neutral-800 p-2 sm:p-6 rounded-[4px] shadow-md border border-neutral-300 dark:border-neutral-700 overflow-x-auto">
        <div
          ref={printableRef}
          id="official-quotation-printable"
          className="mx-auto bg-white text-black font-sans leading-tight border border-black max-w-[800px] p-6 text-[11px]"
          style={{ minHeight: '1100px', boxSizing: 'border-box' }}
        >
          {/* ================================================================ */}
          {/* Top Header Box                                                   */}
          {/* ================================================================ */}
          <div className="border border-black flex mb-3">
            {/* Logo on Left */}
            <div className="w-[28%] border-r border-black flex flex-col items-center justify-center p-3 text-center bg-white">
              {issuer.logo_url ? (
                <div className="flex flex-col items-center justify-center max-h-16">
                  <img
                    src={issuer.logo_url}
                    alt={issuer.name}
                    className="max-h-14 max-w-full object-contain"
                  />
                </div>
              ) : (
                <>
                  <div className="text-4xl font-serif font-black tracking-tight italic text-black lowercase select-none">
                    {issuer.logo_text || 'tespa'}
                  </div>
                  <div className="text-[8px] font-sans uppercase tracking-widest text-gray-500 mt-1">
                    {issuer.logo_tagline || 'Precision & Quality'}
                  </div>
                </>
              )}
            </div>

            {/* Centre Details on Right */}
            <div className="w-[72%] p-2 text-center flex flex-col justify-center leading-tight">
              <h1 className="font-bold text-base tracking-wide text-black uppercase">
                {issuer.name}
              </h1>
              {issuer.division && (
                <div className="font-semibold text-[10px] text-gray-800">
                  {issuer.division}
                </div>
              )}
              <div className="text-[9.5px] text-gray-700 mt-0.5">
                {issuer.address1} {issuer.address2 ? `, ${issuer.address2}` : ''}
                {issuer.city ? `, ${issuer.city}` : ''}
                {issuer.pin ? ` – ${issuer.pin}` : ''}
              </div>
              <div className="text-[9px] text-gray-700">
                Ph: {issuer.phones}
              </div>
              <div className="text-[9px] font-medium text-gray-800">
                GSTIN/UIN : {issuer.gstin}
              </div>
              <div className="text-[9px] text-gray-700">
                {issuer.mobile ? `Mobile No. ${issuer.mobile} / ` : ''}Email : {issuer.email}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Reference No. & Date Bar                                         */}
          {/* ================================================================ */}
          <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-400 mb-3 text-[10.5px]">
            <div className="font-bold uppercase font-mono tracking-tight text-black">
              {formattedRef}
            </div>
            <div className="font-bold uppercase font-mono tracking-tight text-black">
              DATE: {quoteDate}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Client Addressee Box                                             */}
          {/* ================================================================ */}
          <div className="mb-3 text-[10.5px] leading-relaxed">
            <div className="font-bold uppercase text-black">
              {clientName.startsWith('M/s') ? clientName : `M/s . ${clientName}`}
            </div>
            <div className="text-gray-800 uppercase font-medium">
              {clientAddress}
            </div>
            <div className="mt-2 font-bold uppercase">
              KIND ATTN: {kindAttn}
            </div>
            <div className="font-bold uppercase">
              PHONE NO : {phoneNo}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Salutation & Subject                                             */}
          {/* ================================================================ */}
          <div className="mb-3 text-[10.5px] leading-snug">
            <div className="mb-1">Dear Sir,</div>
            <div className="font-bold underline mb-1">
              Sub: {subject}
            </div>
            <div className="text-justify text-gray-800">
              We thank you very much for your enquiry received through{' '}
              <span className="font-medium text-black">{enquiryRef}</span> against
              which we are pleased to submit our offer for your kind consideration:
            </div>
          </div>

          {/* ================================================================ */}
          {/* Itemized Services Table Matching Scan                            */}
          {/* ================================================================ */}
          <table className="w-full border-collapse border border-black text-[10px] mb-3">
            <thead>
              <tr className="border-b border-black text-center font-bold bg-[#F9FAFB]">
                <th className="border-r border-black p-1.5 w-[6%]">Sl. No.</th>
                <th className="border-r border-black p-1.5 w-[28%] text-left">Description</th>
                <th className="border-r border-black p-1.5 w-[16%]">Range</th>
                <th className="border-r border-black p-1.5 w-[8%]">Qty</th>
                <th className="border-r border-black p-1.5 w-[16%] text-right">
                  Rate per Unit<br />
                  <span className="text-[8.5px] font-normal">(Excluding GST)</span>
                </th>
                <th className="border-r border-black p-1.5 w-[18%] text-right">
                  Total Amount<br />
                  <span className="text-[8.5px] font-normal">(Excluding GST)</span>
                </th>
                <th className="p-1.5 w-[8%] text-center">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const rowQty = Number(it.quantity) || 1;
                const rowRate = Number(it.unit_price) || 0;
                const rowTotal = Number(it.total_price) || rowQty * rowRate;

                return (
                  <tr key={it.id || idx} className="border-b border-black/40 align-middle">
                    <td className="border-r border-black p-1.5 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border-r border-black p-1.5 text-left font-medium text-black">
                      {it.description}
                    </td>
                    <td className="border-r border-black p-1.5 text-center text-gray-800">
                      {it.range || '-'}
                    </td>
                    <td className="border-r border-black p-1.5 text-center font-mono font-bold">
                      {rowQty}
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono">
                      {rowRate.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-r border-black p-1.5 text-right font-mono font-bold text-black">
                      {rowTotal.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-1.5 text-center text-gray-600 text-[9px]">
                      {it.remarks || '-'}
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row (Excluding GST) */}
              <tr className="border-t-2 border-black font-bold bg-[#F9FAFB]">
                <td
                  colSpan={5}
                  className="border-r border-black p-2 text-right uppercase tracking-wider text-[10.5px]"
                >
                  Grand total (Excluding GST)
                </td>
                <td className="border-r border-black p-2 text-right font-mono text-xs text-black">
                  ₹{grandTotalExcludingGst.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="p-2"></td>
              </tr>
            </tbody>
          </table>

          {/* GST Summary & Amount in Words */}
          <div className="border border-gray-400 p-2 mb-3 bg-[#FAFAFA] text-[9.5px] flex flex-wrap justify-between items-center gap-2">
            <div>
              <span className="font-semibold text-gray-700">Indicative with GST @ 18%: </span>
              <strong className="text-black font-mono">
                ₹{grandTotalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-gray-500 text-[8.5px] ml-1">
                (Tax: ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
              </span>
            </div>
            <div className="italic text-gray-700 text-[9px]">
              {wordsRepresentation}
            </div>
          </div>

          {/* ================================================================ */}
          {/* Terms and Conditions Matching Scan                              */}
          {/* ================================================================ */}
          <div className="mt-4 pt-2 border-t border-black/30">
            <h2 className="font-bold text-center uppercase tracking-wider text-[11px] mb-2">
              TERMS AND CONDITIONS
            </h2>

            <div className="space-y-2 text-[9.5px] leading-normal text-gray-800 text-justify">
              <div>
                <strong className="text-black">Scope of Calibration:</strong><br />
                Our calibration services cover equipment and instruments within the defined scope of our
                accreditation as per NABL standards. NABL Accreditation under ISO/IEC 17025:2017
                (Certificate No. CC-3767).
              </div>

              <div>
                <strong className="text-black">Acceptance Criteria:</strong><br />
                Calibration will be performed based on recognized standards and methods, ensuring accuracy
                and reliability.
              </div>

              <div>
                <strong className="text-black">Taxes:</strong> GST @ 18% extra as applicable at the time of invoicing.
              </div>

              <div>
                <strong className="text-black">Payment Terms:</strong> 30 days from the date of invoice.
              </div>

              <div>
                <strong className="text-black">Quotation Validity:</strong> This quotation is valid for 30 days from the date of issue.
              </div>

              <div>
                <strong className="text-black">Turnaround Time:</strong> Standard turnaround time is 3 to 5 working days from receipt of instruments at our lab.
              </div>

              <div>
                <strong className="text-black">Onsite Calibration Terms:</strong> Customer to provide uninterrupted power supply, clean environment, and handling assistance for onsite calibrations.
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Closing & Signatory Box                                          */}
          {/* ================================================================ */}
          <div className="mt-6 pt-2 flex justify-between items-end text-[10px]">
            <div className="leading-snug">
              <div>Thanking you and assuring you of our best services at all times.</div>
              <div className="mt-3">Yours faithfully,</div>
              <div className="font-bold text-black mt-1">For {issuer.name.toUpperCase()}</div>
            </div>

            <div className="text-right">
              <div className="h-10"></div>
              <div className="border-t border-black pt-1 font-bold text-black uppercase">
                Authorised Signatory
              </div>
            </div>
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

export default OfficialQuotationView;
