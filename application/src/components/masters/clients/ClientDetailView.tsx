// application/src/components/masters/clients/ClientDetailView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Client, Invoice } from '../../../types/domain';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '../../ui/UIPrimitives';
import {
  ArrowLeft,
  Edit2,
  Building2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Clock,
  User,
  ShieldCheck,
  Wrench,
  Receipt,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import { useAuthContext } from '../../../contexts/AuthContext';

interface PastServicedItem {
  description: string;
  range?: string;
  unitPrice: number;
}

interface ClientDetailViewProps {
  client: Client;
  clientInvoices: Invoice[];
  isLoadingInvoices: boolean;
  pastServicedItems: PastServicedItem[];
  isLoadingItems: boolean;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  clientInvoices,
  isLoadingInvoices,
  pastServicedItems,
  isLoadingItems,
}) => {
  const { canPerform, isSuperAdmin } = useAuthContext();
  const canEditMaster = isSuperAdmin || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE_EDIT') || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE');
  const isViewOnlyMaster = !canEditMaster;
  const phoneNumbers = client.phone_numbers || [client.phone];
  const emailAddresses = client.email_addresses || [client.email];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/masters/clients">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                {client.client_name}
              </h1>
              <Badge variant={client.status === 'ACTIVE' ? 'success' : 'outline'}>
                {client.status}
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Code: <span className="text-[#0274BB] font-semibold">{client.client_code}</span>
            </p>
          </div>
        </div>

        {!isViewOnlyMaster && (
          <Link to={`/masters/clients/${client.id}/edit`}>
            <Button variant="primary">
              <Edit2 className="size-4" /> Edit Client Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Grid: Primary Info & Commercial Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-[#0274BB]" />
              <div>
                <CardTitle>Corporate Identification</CardTitle>
                <CardDescription>Tax registration and contact officer</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Legal Name</span>
              <span className="font-semibold text-[#111827]">{client.client_name}</span>
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">GSTIN / Tax ID</span>
              <span className="font-mono text-sm font-bold text-[#374151] px-2 py-0.5 bg-[#F3F4F6] rounded inline-block">
                {client.gst_tax_number}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Primary Contact Person</span>
              <span className="font-medium text-[#111827]">{client.contact_person}</span>
            </div>
          </CardContent>
        </Card>

        {/* Commercial & Terms Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-[#0274BB]" />
              <div>
                <CardTitle>Commercial Terms</CardTitle>
                <CardDescription>Payment agreements and credit cycle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Payment Term</span>
              <span className="font-semibold text-[#16A34A] px-2.5 py-1 bg-[#F0FDF4] border border-[#16A34A]/20 rounded-[4px] inline-block mt-1">
                {client.payment_term === 'IMMEDIATE'
                  ? 'Immediate Payment'
                  : client.payment_term === '30_DAYS'
                  ? '30 Days Net Credit'
                  : '60 Days Net Credit'}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Account Status</span>
              <span className="font-semibold text-[#111827]">{client.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility & Billing Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Physical & Financial Addresses</CardTitle>
              <CardDescription>Dispatch pickup and billing destinations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-[#F9FAFB] rounded-[4px] border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">
              Registered Facility Address
            </span>
            <p className="text-sm text-[#111827] whitespace-pre-wrap">{client.address}</p>
            <p className="text-xs text-[#6B7280] pt-1">
              {client.city}, {client.state} — PIN: {client.pin}
            </p>
          </div>

          <div className="p-4 bg-[#F9FAFB] rounded-[4px] border border-[#E5E7EB] space-y-1.5">
            <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wide">
              Billing Address
            </span>
            <p className="text-sm text-[#111827] whitespace-pre-wrap">
              {client.billing_address || client.address}
            </p>
            <p className="text-xs text-[#6B7280] pt-1">
              {client.city}, {client.state} — PIN: {client.pin}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Communication Lines (Multi Phone & Email) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Authorized Communication Channels</CardTitle>
              <CardDescription>Verified telephonic and electronic contact records</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wide block">
              Registered Phone Lines ({phoneNumbers.length})
            </span>
            <div className="space-y-1.5">
              {phoneNumbers.map((phone, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-sm text-[#111827]"
                >
                  <Phone className="size-3.5 text-[#9CA3AF]" />
                  <span>{phone}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-[#EFF6FF] text-[#0274BB] px-1.5 py-0.5 rounded font-semibold ml-auto">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wide block">
              Registered Email Addresses ({emailAddresses.length})
            </span>
            <div className="space-y-1.5">
              {emailAddresses.map((email, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-sm text-[#111827]"
                >
                  <Mail className="size-3.5 text-[#9CA3AF]" />
                  <span>{email}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-[#EFF6FF] text-[#0274BB] px-1.5 py-0.5 rounded font-semibold ml-auto">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibrated Instruments (CV History) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Calibrated Instruments — CV History</CardTitle>
              <CardDescription>All instrument types previously calibrated for this client</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingItems ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
              <div className="size-4 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
              Loading instrument history...
            </div>
          ) : pastServicedItems.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-2">No calibration history found for this client.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-left w-[45%]">Instrument Description</th>
                    <th className="py-2.5 px-3 text-left w-[35%]">Range / Model</th>
                    <th className="py-2.5 px-3 text-right w-[20%]">Standard Rate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {pastServicedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[#111827]">{item.description}</td>
                      <td className="py-2.5 px-3 text-[#6B7280] font-mono text-[11px]">
                        {item.range || <span className="italic text-[#9CA3AF]">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0274BB]">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-[#0274BB]" />
            <div>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>All tax invoices raised for this client — click to view</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="flex items-center gap-2 text-sm text-[#6B7280] py-4">
              <div className="size-4 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
              Loading invoices...
            </div>
          ) : clientInvoices.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-2">No invoices found for this client.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] rounded border border-[#E2E8F0] overflow-hidden">
              {clientInvoices.map((inv) => {
                const effectiveStatus = inv.approval_status || inv.invoice_status;
                const statusColor =
                  effectiveStatus === 'APPROVED' || effectiveStatus === 'PAID'
                    ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
                    : effectiveStatus === 'PENDING_APPROVAL' || effectiveStatus === 'ISSUED'
                    ? 'bg-[#FFF7ED] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]';
                return (
                  <Link
                    key={inv.id}
                    to={`/commercial/invoices/${inv.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#EFF6FF] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ExternalLink className="size-3.5 text-[#9CA3AF] group-hover:text-[#0274BB] shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[#0274BB] text-xs block truncate">
                          {inv.invoice_number}
                        </span>
                        {inv.invoice_date && (
                          <span className="text-[11px] text-[#6B7280]">
                            {new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-[#111827] text-xs">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor}`}>
                        {effectiveStatus}
                      </span>
                      <ChevronRight className="size-3.5 text-[#9CA3AF] group-hover:text-[#0274BB]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Audit Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-[#6B7280]" />
            <div>
              <CardTitle>System Audit & Integrity History</CardTitle>
              <CardDescription>Immutable record creation and alteration logs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Record Creation</span>
            <div className="text-[#111827]">
              Date: {new Date(client.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Created By: {client.created_by_name || client.created_by || 'Authorized User'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Last Modification</span>
            <div className="text-[#111827]">
              Date: {client.updated_at ? new Date(client.updated_at).toLocaleString() : new Date(client.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Modified By: {client.updated_by_name || client.updated_by || client.created_by_name || 'Authorized User'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
