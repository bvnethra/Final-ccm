// application/src/pages/audit/AuditLogsPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import {
  useInvoices,
  useCalibrationRequests,
  useClientPastServicedItems,
} from '../../hooks/useOperations';
import { useClients } from '../../hooks/useClientMaster';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
} from '../../components/ui/UIPrimitives';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  User,
  ShieldCheck,
  Eye,
  X,
  ExternalLink,
  Receipt,
  Wrench,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
} from 'lucide-react';
import type { AuditLogEntry } from '../../services/auditLogService';
import type { Invoice, Client, CalibrationRequest } from '../../types/domain';

interface AuditLogInspectorProps {
  log: AuditLogEntry;
  invoices: Invoice[];
  clients: Client[];
  requests: CalibrationRequest[];
  onClose: () => void;
}

const AuditLogInspector: React.FC<AuditLogInspectorProps> = ({
  log,
  invoices,
  clients,
  requests,
  onClose,
}) => {
  const [showRawPayload, setShowRawPayload] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Match domain entities based on log entity, entity_id, or new_data payload
  const matchedInvoice = invoices.find(
    (i) =>
      i.id === log.entity_id ||
      i.invoice_number === log.new_data?.invoice_number ||
      (log.entity === 'INVOICE' && i.id === log.entity_id)
  );

  const matchedRequest = requests.find(
    (r) =>
      r.id === log.entity_id ||
      r.id === log.new_data?.request_id ||
      r.id === matchedInvoice?.request_id
  );

  const targetClientId =
    (log.entity === 'CLIENT' ? log.entity_id : undefined) ||
    log.new_data?.client_id ||
    matchedInvoice?.client_id ||
    matchedRequest?.client_id;

  const matchedClient = clients.find((c) => c.id === targetClientId);

  // Query CV (Calibrated Instruments / past serviced items) for client if client is identified
  const { data: pastServicedItems = [], isLoading: isLoadingCV } =
    useClientPastServicedItems(matchedClient?.id || (log.entity === 'CLIENT' ? log.entity_id : undefined));

  // Determine invoices belonging to this client
  const clientInvoices = matchedClient
    ? invoices.filter((inv) => inv.client_id === matchedClient.id)
    : [];

  // Active invoice being inspected (either the log's invoice or an invoice clicked from client list)
  const activeInvoice = selectedInvoiceId
    ? invoices.find((inv) => inv.id === selectedInvoiceId)
    : matchedInvoice;

  const isInvoiceLog = log.entity === 'INVOICE' || Boolean(matchedInvoice);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#CBD5E1] max-w-4xl w-full my-8 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E0F2FE] rounded-lg">
              <ShieldCheck className="size-5 text-[#0274BB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#0F172A] text-base">
                  Audit Event Details &amp; Entity Inspection
                </h3>
                <Badge variant="secondary" className="font-mono text-xs">
                  {log.action}
                </Badge>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Logged on {new Date(log.created_at).toLocaleString('en-GB')} by {log.actor_name || 'System'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#334155]">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F1F5F9] p-3.5 rounded-lg border border-[#E2E8F0] text-xs">
            <div>
              <span className="text-gray-500 font-medium block">Action</span>
              <span className="font-bold text-[#0F172A]">{log.action}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium block">Entity Type</span>
              <span className="font-bold text-[#0F172A]">{log.entity.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium block">Actor</span>
              <span className="font-medium text-[#0F172A]">{log.actor_name}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium block">Entity Ref</span>
              <span className="font-mono font-medium text-[#0274BB] truncate block">
                {log.entity_id || '—'}
              </span>
            </div>
          </div>

          {log.remarks && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <FileText className="size-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-blue-950">Audit Remarks:</span>
                <span>{log.remarks}</span>
              </div>
            </div>
          )}

          {/* VIEW: INVOICE DETAILS & INVOICE ITEMS */}
          {(isInvoiceLog || activeInvoice) && (
            <div className="space-y-4 border border-[#CBD5E1] rounded-lg p-4 bg-white shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="size-5 text-[#0274BB]" />
                  <h4 className="font-bold text-gray-900 text-sm">
                    Tax Invoice Details — {activeInvoice?.invoice_number || log.new_data?.invoice_number || 'Invoice Ref'}
                  </h4>
                  {activeInvoice?.invoice_status && (
                    <Badge variant={activeInvoice.invoice_status === 'PAID' ? 'success' : 'secondary'}>
                      {activeInvoice.invoice_status}
                    </Badge>
                  )}
                  {activeInvoice?.approval_status && (
                    <Badge variant={activeInvoice.approval_status === 'APPROVED' ? 'success' : 'warning'}>
                      {activeInvoice.approval_status}
                    </Badge>
                  )}
                </div>

                {activeInvoice && (
                  <Link
                    to={`/commercial/invoices/${activeInvoice.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0274BB] hover:underline"
                  >
                    <span>Open Full Invoice Document</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                )}
              </div>

              {/* Invoice Key Financials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3 rounded-md border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-gray-500 block">Client</span>
                  <span className="font-semibold text-gray-900">
                    {matchedClient?.client_name || activeInvoice?.clients?.client_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Invoice Date</span>
                  <span className="font-medium text-gray-900">
                    {activeInvoice?.invoice_date ? new Date(activeInvoice.invoice_date).toLocaleDateString('en-GB') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">PO Reference</span>
                  <span className="font-medium text-gray-900">
                    {activeInvoice?.client_po_ref || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Amount</span>
                  <span className="font-bold text-[#0F172A] text-sm text-[#0274BB]">
                    ₹{(activeInvoice?.total_amount || log.new_data?.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Invoice Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="size-3.5 text-gray-500" />
                    Invoice Line Items ({activeInvoice?.items?.length || 0})
                  </h5>
                  {selectedInvoiceId && (
                    <button
                      onClick={() => setSelectedInvoiceId(null)}
                      className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                    >
                      ← Back to Client View
                    </button>
                  )}
                </div>

                {activeInvoice?.items && activeInvoice.items.length > 0 ? (
                  <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3">HSN/SAC</th>
                          <th className="py-2.5 px-3 text-right">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {activeInvoice.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-900">{item.description}</td>
                            <td className="py-2 px-3 font-mono text-gray-500 text-[11px]">{item.hsn_sac_code || '998719'}</td>
                            <td className="py-2 px-3 text-right text-gray-800">{item.quantity}</td>
                            <td className="py-2 px-3 text-right text-gray-800 font-mono">
                              ₹{(item.unit_price || item.unit_rate || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900 font-mono">
                              ₹{(item.total_price || (item.quantity * (item.unit_price || item.unit_rate || 0))).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs font-semibold">
                        <tr>
                          <td colSpan={5} className="py-2 px-3 text-right text-gray-600">Subtotal:</td>
                          <td className="py-2 px-3 text-right font-mono">
                            ₹{(activeInvoice.subtotal || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                        {Boolean(activeInvoice.discount_amount) && (
                          <tr>
                            <td colSpan={5} className="py-1.5 px-3 text-right text-green-700">Discount:</td>
                            <td className="py-1.5 px-3 text-right text-green-700 font-mono">
                              -₹{(activeInvoice.discount_amount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )}
                        {Boolean(activeInvoice.tax_amount) && (
                          <tr>
                            <td colSpan={5} className="py-1.5 px-3 text-right text-gray-600">GST / Tax:</td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              ₹{(activeInvoice.tax_amount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        )}
                        <tr className="border-t border-[#CBD5E1] bg-[#EFF6FF] text-[#1E3A8A]">
                          <td colSpan={5} className="py-2 px-3 text-right font-bold">Total Invoiced:</td>
                          <td className="py-2 px-3 text-right font-bold font-mono">
                            ₹{(activeInvoice.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md text-center text-xs text-gray-500">
                    No specific line items recorded in memory for this invoice record.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: CLIENT DETAILS & CALIBRATED ITEMS (CV) & INVOICES */}
          {matchedClient && (
            <div className="space-y-4 border border-[#CBD5E1] rounded-lg p-4 bg-white shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-[#0274BB]" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {matchedClient.client_name}
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">
                      Code: {matchedClient.client_code} | GST: {matchedClient.gst_tax_number || 'N/A'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/masters/clients/${matchedClient.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0274BB] hover:underline"
                >
                  <span>Open Client Profile</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>

              {/* 1. Calibrated Instruments (CV History) for this Client */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="size-3.5 text-[#0274BB]" />
                    Calibrated Instruments — CV History ({pastServicedItems.length})
                  </h5>
                  <span className="text-[11px] text-gray-400">All instruments calibrated for this client</span>
                </div>

                {isLoadingCV ? (
                  <div className="p-4 text-center text-xs text-gray-400 animate-pulse">
                    Loading client calibration history (CV items)...
                  </div>
                ) : pastServicedItems.length > 0 ? (
                  <div className="border border-[#E2E8F0] rounded-md overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Instrument / Description</th>
                          <th className="py-2 px-3">Range / Model</th>
                          <th className="py-2 px-3 text-right">Standard Rate (₹)</th>
                          <th className="py-2 px-3 text-right">Last Serviced</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {pastServicedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#F8FAFC]">
                            <td className="py-2 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-900">{item.description}</td>
                            <td className="py-2 px-3 text-gray-600 font-mono text-[11px]">{item.range || 'Standard'}</td>
                            <td className="py-2 px-3 text-right font-mono text-gray-800">
                              ₹{(item.unitPrice || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-500 text-[11px]">
                              {item.lastServicedDate ? new Date(item.lastServicedDate).toLocaleDateString('en-GB') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-md text-center text-xs text-gray-500">
                    No past calibration history found for this client.
                  </div>
                )}
              </div>

              {/* 2. Client Invoices List with clickable view */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="size-3.5 text-[#0274BB]" />
                    Invoices for {matchedClient.client_name} ({clientInvoices.length})
                  </h5>
                  <span className="text-[11px] text-gray-400">Click any invoice to view line items</span>
                </div>

                {clientInvoices.length > 0 ? (
                  <div className="border border-[#E2E8F0] rounded-md overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Invoice Number</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Total Amount (₹)</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {clientInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className={`hover:bg-[#F0F9FF] transition-colors cursor-pointer ${
                              selectedInvoiceId === inv.id ? 'bg-[#E0F2FE]' : ''
                            }`}
                            onClick={() => setSelectedInvoiceId(inv.id)}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-[#0274BB]">
                              {inv.invoice_number}
                            </td>
                            <td className="py-2 px-3 text-gray-600">
                              {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="py-2 px-3">
                              <Badge
                                variant={inv.invoice_status === 'PAID' ? 'success' : 'secondary'}
                                className="text-[10px] py-0"
                              >
                                {inv.invoice_status}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-gray-900">
                              ₹{(inv.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedInvoiceId(inv.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-[#0274BB] font-semibold hover:underline cursor-pointer"
                              >
                                <Eye className="size-3" /> View Items
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-md text-center text-xs text-gray-500">
                    No invoices recorded for this client yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: CALIBRATION REQUEST ITEMS */}
          {matchedRequest && (
            <div className="space-y-3 border border-[#CBD5E1] rounded-lg p-4 bg-white shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="size-5 text-[#0274BB]" />
                  <h4 className="font-bold text-gray-900 text-sm">
                    Inward Request — {matchedRequest.request_number}
                  </h4>
                </div>
                <Link
                  to={`/requests/${matchedRequest.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0274BB] hover:underline"
                >
                  <span>Open Request</span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>

              {matchedRequest.request_items && matchedRequest.request_items.length > 0 ? (
                <div className="border border-[#E2E8F0] rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Instrument / Description</th>
                        <th className="py-2 px-3">Range / Model</th>
                        <th className="py-2 px-3">Status / Routing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {matchedRequest.request_items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-2 px-3 text-gray-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">
                            {it.item_masters?.item_name || it.remarks || 'Calibrated Instrument'}
                          </td>
                          <td className="py-2 px-3 text-gray-600 font-mono text-[11px]">
                            {it.item_masters?.range_min !== undefined && it.item_masters?.range_max !== undefined
                              ? `${it.item_masters.range_min}-${it.item_masters.range_max} ${it.item_masters.range_unit || ''}`
                              : 'Standard'}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {it.remarks || 'Standard In-House'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          )}

          {/* Raw Payload Section (Collapsible) */}
          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="w-full flex items-center justify-between p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-semibold text-gray-700 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-gray-500" />
                <span>Raw Audit Event Payload (JSON)</span>
              </div>
              {showRawPayload ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showRawPayload && (
              <div className="p-3 bg-slate-900 text-slate-100 overflow-x-auto max-h-56 font-mono text-[11px]">
                <pre>{JSON.stringify(log.new_data || log, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="text-xs text-gray-500">
            Immutable Audit Event ID: <span className="font-mono text-gray-700">{log.id}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs({
    limit: 200,
    entity: selectedEntity === 'ALL' ? undefined : selectedEntity,
  });

  const { data: invoices = [] } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: requests = [] } = useCalibrationRequests();

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(term)) ||
      (log.actor_name && log.actor_name.toLowerCase().includes(term)) ||
      (log.remarks && log.remarks.toLowerCase().includes(term)) ||
      (log.new_data?.invoice_number && log.new_data.invoice_number.toLowerCase().includes(term)) ||
      (log.new_data?.client_name && log.new_data.client_name.toLowerCase().includes(term)) ||
      (log.new_data?.quotation_number && log.new_data.quotation_number.toLowerCase().includes(term))
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('INWARD') || action.includes('ROUTING')) {
      return <Badge variant="info">{action}</Badge>;
    }
    if (action.includes('APPROV') || action.includes('CERTIFICATE') || action.includes('COMPLETE')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('REJECT') || action.includes('CANCEL') || action.includes('FAIL')) {
      return <Badge variant="error">{action}</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  // Helper to render human-readable entity link/identifier in table
  const renderEntityRef = (log: AuditLogEntry) => {
    if (log.entity === 'INVOICE') {
      const inv = invoices.find((i) => i.id === log.entity_id || i.invoice_number === log.new_data?.invoice_number);
      const invoiceNum = log.new_data?.invoice_number || inv?.invoice_number || log.entity_id?.slice(0, 14);
      return (
        <Link
          to={`/commercial/invoices/${inv?.id || log.entity_id}`}
          className="font-mono text-[#0274BB] hover:underline flex items-center gap-1 font-semibold"
          title="Open invoice details"
        >
          <Receipt className="size-3 text-[#0274BB] shrink-0" />
          <span>{invoiceNum}</span>
          <ExternalLink className="size-2.5 opacity-60" />
        </Link>
      );
    }

    if (log.entity === 'CLIENT') {
      const client = clients.find((c) => c.id === log.entity_id || c.id === log.new_data?.client_id);
      const name = client?.client_name || log.new_data?.client_name || log.entity_id?.slice(0, 14);
      return (
        <Link
          to={`/masters/clients/${client?.id || log.entity_id}`}
          className="font-medium text-[#0274BB] hover:underline flex items-center gap-1"
          title="Open client details"
        >
          <Building2 className="size-3 text-[#0274BB] shrink-0" />
          <span className="truncate max-w-[140px]">{name}</span>
          <ExternalLink className="size-2.5 opacity-60" />
        </Link>
      );
    }

    if (log.entity === 'CALIBRATION_REQUEST') {
      const req = requests.find((r) => r.id === log.entity_id);
      const reqNum = req?.request_number || log.entity_id?.slice(0, 14);
      return (
        <Link
          to={`/requests/${req?.id || log.entity_id}`}
          className="font-mono text-[#0274BB] hover:underline flex items-center gap-1 font-semibold"
          title="Open request details"
        >
          <Wrench className="size-3 text-[#0274BB] shrink-0" />
          <span>{reqNum}</span>
          <ExternalLink className="size-2.5 opacity-60" />
        </Link>
      );
    }

    if (log.entity === 'QUOTATION') {
      const qNum = log.new_data?.quotation_number || log.entity_id?.slice(0, 14);
      return (
        <span className="font-mono text-purple-700 font-semibold flex items-center gap-1">
          <FileText className="size-3 text-purple-600 shrink-0" />
          <span>{qNum}</span>
        </span>
      );
    }

    return (
      <span className="font-mono text-gray-500">
        {log.entity_id ? log.entity_id.slice(0, 14) : '—'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
            <ShieldCheck className="size-4 text-[#0274BB]" />
            Compliance &amp; Governance
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Audit Trail &amp; Activity Logs</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Immutable system logs tracking client modifications, operational intake, calibrations, invoices, and line items.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Trail
        </Button>
      </div>

      {/* Filter & Search Controls */}
      <Card className="border border-[#E5E7EB] bg-white shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by action, invoice #, client name, entity ID, actor, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gray-400 shrink-0" />
              <Select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
              >
                <option value="ALL">All Modules / Entities</option>
                <option value="CLIENT">Client Master</option>
                <option value="INVOICE">Tax Invoices</option>
                <option value="CALIBRATION_REQUEST">Inward Requests</option>
                <option value="CALIBRATION">Calibrations &amp; Verifications</option>
                <option value="QUOTATION">Quotations &amp; Approvals</option>
                <option value="ROUTING">Item Routing (In-house/Vendor)</option>
                <option value="DISPATCH">Logistics &amp; Delivery Challans</option>
                <option value="VENDOR">Vendor Master</option>
                <option value="ITEM_MASTER">Item / Equipment Master</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity Ref / Document</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Remarks / Summary</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <History className="size-8 text-gray-300 mx-auto mb-2" />
                    No audit records matching your current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[#64748B] font-mono">
                      {new Date(log.created_at).toLocaleDateString('en-GB')}{' '}
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1E293B]">
                      {log.entity.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      {renderEntityRef(log)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#334155] font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-gray-400" />
                        <span>{log.actor_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#475569] max-w-xs truncate" title={log.remarks}>
                      {log.remarks || 'Standard operational transition recorded.'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-2.5 text-[#0274BB] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] cursor-pointer"
                      >
                        <Eye className="size-3.5 mr-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Comprehensive Audit Event Inspector Modal */}
      {selectedLog && (
        <AuditLogInspector
          log={selectedLog}
          invoices={invoices}
          clients={clients}
          requests={requests}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
