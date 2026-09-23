// application/src/pages/requests/RequestListPage.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationRequests } from '../../hooks/useOperations';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  CategoryTabs,
} from '../../components/ui/UIPrimitives';
import {
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  FileCheck,
  Truck,
  FileText,
  Gauge,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import type { CalibrationRequest } from '../../types/domain';
import { OfficialSaleOrderCVView } from '../../components/commercial/OfficialSaleOrderCVView';

export const RequestListPage: React.FC = () => {
  const { canPerform, isSuperAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [logViewMode, setLogViewMode] = useState<'ALL_CV' | 'LAB_LOG' | 'VENDOR_LOG'>('ALL_CV');
  const [viewingCVRequest, setViewingCVRequest] = useState<CalibrationRequest | null>(null);

  const { data: requests = [], isLoading, error } = useCalibrationRequests(activeTab);

  // Tab definitions for CV Register status filter
  const tabs = [
    { value: 'ALL', label: 'All Requests' },
    { value: 'CREATED', label: 'Pending Verify' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'CALIBRATED', label: 'Calibrated' },
    { value: 'QUOTATION', label: 'Quotation' },
    { value: 'INVOICED', label: 'Invoiced' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0274BB] border border-blue-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#0274BB]" /> INWARD CREATED
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-cyan-600" /> VERIFIED
          </span>
        );
      case 'CALIBRATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> CALIBRATED
          </span>
        );
      case 'QUOTATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-amber-500" /> QUOTATION
          </span>
        );
      case 'PARTIALLY_INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-amber-500" /> PARTIAL INVOICE
          </span>
        );
      case 'INVOICED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> INVOICED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F0] text-[#16A34A] border border-[#D1F2E0] whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-[#16A34A]" /> COMPLETED
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-purple-600" /> DISPATCHED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            <span className="size-1.5 rounded-full bg-slate-400" /> {status}
          </span>
        );
    }
  };

  // Segregate in-house lab items
  const labItemsLog = useMemo(() => {
    const list: Array<{
      requestId: string;
      requestNumber: string;
      voucherNo: string;
      collectionDate: string;
      clientName: string;
      priority: string;
      item: any;
      status: string;
    }> = [];
    requests.forEach((req) => {
      (req.request_items || []).forEach((it) => {
        if (it.destination !== 'VENDOR_OUTSOURCE' && !it.vendor_id) {
          list.push({
            requestId: req.id,
            requestNumber: req.request_number,
            voucherNo: req.voucher_no || req.request_number,
            collectionDate: req.collection_date,
            clientName: req.clients?.client_name || 'Client',
            priority: req.priority,
            item: it,
            status: it.status || req.status,
          });
        }
      });
    });
    return list;
  }, [requests]);

  // Segregate external outsource vendor items
  const vendorItemsLog = useMemo(() => {
    const list: Array<{
      requestId: string;
      requestNumber: string;
      voucherNo: string;
      collectionDate: string;
      clientName: string;
      priority: string;
      item: any;
      vendorName: string;
      vendorId?: string;
      status: string;
    }> = [];
    requests.forEach((req) => {
      (req.request_items || []).forEach((it) => {
        if (it.destination === 'VENDOR_OUTSOURCE' || it.vendor_id) {
          list.push({
            requestId: req.id,
            requestNumber: req.request_number,
            voucherNo: req.voucher_no || req.request_number,
            collectionDate: req.collection_date,
            clientName: req.clients?.client_name || 'Client',
            priority: req.priority,
            item: it,
            vendorName: it.vendor_name || 'External Calibration Lab',
            vendorId: it.vendor_id,
            status: it.status || req.status,
          });
        }
      });
    });
    return list;
  }, [requests]);

  // Full-page printable SALE ORDER / CV view
  if (viewingCVRequest) {
    return (
      <div className="space-y-4">
        <OfficialSaleOrderCVView
          request={viewingCVRequest}
          client={viewingCVRequest.clients}
          onClose={() => setViewingCVRequest(null)}
          isFullPage={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#111827]">Equipment Inward Requests &amp; CV Register</h1>
            <Badge variant="primary" className="font-mono text-xs">SALE ORDER / CV</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            Lifecycle Process 1: Equipment Inward Collection, CV Generation, and Lab / Vendor Log Segregation
          </p>
        </div>

        {(isSuperAdmin || canPerform('CREATE_REQUEST', 'CREATE')) && (
          <Link to="/requests/new">
            <Button variant="primary">
              <Plus className="size-4" /> Generate New CV Voucher
            </Button>
          </Link>
        )}
      </div>

      {/* Primary Log Segregation Selector */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-lg border border-[#CBD5E1]">
        <button
          type="button"
          onClick={() => setLogViewMode('ALL_CV')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            logViewMode === 'ALL_CV'
              ? 'bg-white text-[#0274BB] shadow-sm ring-1 ring-[#CBD5E1]'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <FileText className="size-4" />
          <span>CV Register (All Inward Requests)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#EFF6FF] text-[#0274BB]">
            {requests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLogViewMode('LAB_LOG')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            logViewMode === 'LAB_LOG'
              ? 'bg-white text-[#0274BB] shadow-sm ring-1 ring-[#CBD5E1]'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Gauge className="size-4 text-[#0274BB]" />
          <span>Lab Items Log (In-House Bench)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#EFF6FF] text-[#0274BB]">
            {labItemsLog.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLogViewMode('VENDOR_LOG')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
            logViewMode === 'VENDOR_LOG'
              ? 'bg-white text-amber-800 shadow-sm ring-1 ring-amber-200'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <Truck className="size-4 text-amber-600" />
          <span>Vendor Items Log (Outsource POs)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900">
            {vendorItemsLog.length}
          </span>
        </button>
      </div>

      {logViewMode === 'ALL_CV' && (
        <CategoryTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Main Content Area based on Log View */}
      {logViewMode === 'ALL_CV' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle>Registered Calibration Requests (CV Vouchers)</CardTitle>
                <CardDescription>
                  Inward vouchers scoped to your facility, tracking both in-house lab and outsource equipment
                </CardDescription>
              </div>
              <span className="text-xs text-[#6B7280]">
                Showing {requests.length} inward record(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">
                <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading calibration requests...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-[#DC2626]">
                <AlertCircle className="size-6 mx-auto mb-2" />
                {(error as Error).message}
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280] space-y-3">
                <Clock className="size-8 mx-auto text-[#9CA3AF]" />
                <p className="text-base font-semibold text-[#374151]">No calibration requests found</p>
                <p className="text-xs text-[#6B7280]">
                  Get started by generating the first CV Voucher for incoming customer instruments.
                </p>
                <Link to="/requests/new">
                  <Button variant="secondary" size="sm" className="mt-2">
                    <Plus className="size-4" /> Generate First CV Voucher
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">CV Voucher #</th>
                      <th className="px-5 py-3">Request Number</th>
                      <th className="px-5 py-3">Client Account</th>
                      <th className="px-5 py-3">Inward Date</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Routing Scope</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {requests.map((req) => {
                      const inHouseCount = (req.request_items || []).filter(
                        (i) => i.destination !== 'VENDOR_OUTSOURCE' && !i.vendor_id
                      ).length;
                      const vendorCount = (req.request_items || []).filter(
                        (i) => i.destination === 'VENDOR_OUTSOURCE' || i.vendor_id
                      ).length;

                      return (
                        <tr key={req.id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-xs text-[#0274BB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                              {req.voucher_no || '—'}
                            </span>
                            {req.dc_number && (
                              <span className="block text-[10px] text-[#6B7280] mt-0.5 truncate max-w-[140px]" title={req.dc_number}>
                                {req.dc_number}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs font-medium text-[#374151]">
                            <Link to={`/requests/${req.id}`} className="hover:underline text-[#0274BB]">
                              {req.request_number}
                            </Link>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-xs text-[#111827]">
                              {req.clients?.client_name || '—'}
                            </div>
                            {req.clients?.client_code && (
                              <span className="text-[10px] text-[#6B7280] font-mono">
                                {req.clients.client_code}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-[#6B7280]">
                            {new Date(req.collection_date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={req.priority === 'URGENT' ? 'warning' : 'secondary'}>
                              {req.priority}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              {inHouseCount > 0 && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                  🔬 {inHouseCount} Lab
                                </span>
                              )}
                              {vendorCount > 0 && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  🏢 {vendorCount} Vendor
                                </span>
                              )}
                              {inHouseCount === 0 && vendorCount === 0 && (
                                <span className="text-gray-400 text-[11px]">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">{getStatusBadge(req.status)}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingCVRequest(req)}
                                title="View &amp; Print SALE ORDER / CV"
                                className="text-xs"
                              >
                                <FileCheck className="size-3.5 text-[#0274BB]" /> CV
                              </Button>

                              {req.status === 'CREATED' ? (
                                <Link to={`/lab/verification/${req.id}`}>
                                  <Button variant="secondary" size="sm" className="text-xs">
                                    Verify <ArrowRight className="size-3.5" />
                                  </Button>
                                </Link>
                              ) : req.status === 'VERIFIED' ? (
                                <Link to={`/lab/calibration/${req.id}`}>
                                  <Button variant="primary" size="sm" className="text-xs">
                                    Calibrate <ArrowRight className="size-3.5" />
                                  </Button>
                                </Link>
                              ) : (
                                <Link to={`/requests/${req.id}`}>
                                  <Button variant="outlineInk" size="sm" className="text-xs">
                                    Details
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lab Items Log: Segregated view of In-House bench instruments */}
      {logViewMode === 'LAB_LOG' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#111827]">
                  🔬 In-House Lab Items Log ({labItemsLog.length})
                </CardTitle>
                <CardDescription>
                  Dedicated queue of equipment assigned for calibration inside your internal laboratory
                </CardDescription>
              </div>
              <Link to="/lab/queue">
                <Button variant="outline" size="sm">
                  Go to Lab Calibration Queue &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {labItemsLog.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                No equipment currently assigned to In-House Lab bench.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">CV Voucher #</th>
                      <th className="px-5 py-3">Inward Date</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Item Code &amp; Instrument</th>
                      <th className="px-5 py-3">Serial #</th>
                      <th className="px-5 py-3 w-16 text-center">Qty</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {labItemsLog.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#0274BB]">
                          {entry.voucherNo}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#6B7280]">
                          {new Date(entry.collectionDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-xs text-[#111827]">
                          {entry.clientName}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-xs text-[#111827]">
                            {entry.item.item_masters?.item_name || 'Instrument'}
                          </div>
                          <div className="text-[10px] text-[#6B7280] font-mono">
                            Code: {entry.item.item_code || entry.item.item_masters?.item_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-[#4B5563]">
                          {entry.item.serial_number || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-xs">
                          {entry.item.quantity}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={entry.priority === 'URGENT' ? 'warning' : 'secondary'}>
                            {entry.priority}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">{getStatusBadge(entry.status)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/requests/${entry.requestId}`}>
                            <Button variant="outlineInk" size="sm" className="text-xs">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vendor Items Log: Segregated view of Outsource Vendor instruments */}
      {logViewMode === 'VENDOR_LOG' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-amber-900">
                  🏢 Outsource Vendor Items Log ({vendorItemsLog.length})
                </CardTitle>
                <CardDescription>
                  Dedicated queue of equipment routed to external calibration laboratories &amp; vendors from Vendor Master
                </CardDescription>
              </div>
              <Link to="/masters/vendors">
                <Button variant="outline" size="sm">
                  View Vendor Master &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {vendorItemsLog.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">
                No equipment currently assigned to External Vendors.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3">CV Voucher #</th>
                      <th className="px-5 py-3">Inward Date</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Item Code &amp; Instrument</th>
                      <th className="px-5 py-3">Assigned External Vendor</th>
                      <th className="px-5 py-3 w-16 text-center">Qty</th>
                      <th className="px-5 py-3 text-right">Unit Rate (₹)</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {vendorItemsLog.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFAFA]">
                        <td className="px-5 py-3.5 font-mono font-bold text-xs text-[#0274BB]">
                          {entry.voucherNo}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#6B7280]">
                          {new Date(entry.collectionDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-xs text-[#111827]">
                          {entry.clientName}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-xs text-[#111827]">
                            {entry.item.item_masters?.item_name || 'Instrument'}
                          </div>
                          <div className="text-[10px] text-[#6B7280] font-mono">
                            Code: {entry.item.item_code || entry.item.item_masters?.item_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                            {entry.vendorName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-xs">
                          {entry.item.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs">
                          ₹{((entry.item.unit_rate || entry.item.item_masters?.standard_cost || 0)).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">{getStatusBadge(entry.status)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/requests/${entry.requestId}`}>
                            <Button variant="outlineInk" size="sm" className="text-xs">
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RequestListPage;
