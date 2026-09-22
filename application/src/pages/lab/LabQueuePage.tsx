// application/src/pages/lab/LabQueuePage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Select,
} from '../../components/ui/UIPrimitives';
import type { RequestAttachment } from '../../types/domain';
import {
  FlaskConical,
  AlertCircle,
  Paperclip,
  Zap,
  Clock,
  Eye,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Calendar,
} from 'lucide-react';

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
    return <ImageIcon className="size-5 text-[#0274BB] shrink-0" />;
  }
  if (type.includes('pdf') || lowerName.endsWith('.pdf')) {
    return <FileText className="size-5 text-[#DC2626] shrink-0" />;
  }
  if (type.includes('sheet') || lowerName.match(/\.(xlsx|xls|csv)$/)) {
    return <FileSpreadsheet className="size-5 text-[#16A34A] shrink-0" />;
  }
  return <FileText className="size-5 text-[#4B5563] shrink-0" />;
}

export const LabQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStageTab, setActiveStageTab] = useState<string>('LAB_ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'NORMAL'>('ALL');
  const [selectedRequestAttachments, setSelectedRequestAttachments] = useState<{
    requestNumber: string;
    clientName?: string;
    attachments: RequestAttachment[];
  } | null>(null);

  const { data: allRequests = [], isLoading, error } = useCalibrationRequests();

  // 1. Filter by Lab operational stages (Step 6/7/8)
  let labRequests = allRequests.filter((r) => {
    if (activeStageTab === 'LAB_ALL')
      return [
        'CREATED',
        'VERIFIED',
        'CALIBRATING',
        'CALIBRATED',
        'FAULTY',
        'REPAIR_IN_PROGRESS',
        'OUTSOURCED',
        'OUTSOURCE_RETURNED',
        'QUOTATION',
      ].includes(r.status);
    if (activeStageTab === 'PENDING_VERIFY') return r.status === 'CREATED';
    if (activeStageTab === 'PENDING_CALIBRATE') return r.status === 'VERIFIED';
    if (activeStageTab === 'IN_REPAIR')
      return r.status === 'FAULTY' || r.status === 'REPAIR_IN_PROGRESS';
    if (activeStageTab === 'OUTSOURCED')
      return r.status === 'OUTSOURCED' || r.status === 'OUTSOURCE_RETURNED';
    if (activeStageTab === 'CALIBRATED')
      return ['CALIBRATED', 'QUOTATION', 'APPROVED', 'INVOICED'].includes(r.status);
    return true;
  });

  // 2. Filter by priority if selected
  if (priorityFilter !== 'ALL') {
    labRequests = labRequests.filter((r) => r.priority === priorityFilter);
  }

  // 3. Priority-Based Scheduling:
  // - URGENT priority orders MUST be placed first at the top of the queue
  // - Secondary order: FIFO by collection_date ascending (oldest first)
  const sortedLabQueue = [...labRequests].sort((a, b) => {
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (a.priority !== 'URGENT' && b.priority === 'URGENT') return 1;
    return new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime();
  });

  const urgentCount = allRequests.filter(
    (r) => r.priority === 'URGENT' && ['CREATED', 'VERIFIED', 'FAULTY', 'REPAIR_IN_PROGRESS'].includes(r.status)
  ).length;

  const stageTabs = [
    { id: 'LAB_ALL', label: 'All Active Lab Orders' },
    { id: 'PENDING_VERIFY', label: '1. Inward Verification' },
    { id: 'PENDING_CALIBRATE', label: '2. Calibration Bench' },
    { id: 'IN_REPAIR', label: '3. In-Lab Repair' },
    { id: 'OUTSOURCED', label: '4. Outsource Vendor PO' },
    { id: 'CALIBRATED', label: '5. Calibrated & Certified' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#111827]">Lab Queue &amp; Metrology Bench</h1>
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#FEF2F2] border border-[#DC2626]/30 text-[#DC2626] animate-pulse">
                <Zap className="size-3.5" /> {urgentCount} Urgent Work Order(s)
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Step 6 &amp; 7: Priority-Scheduled Inward Queue, Inward Inspection &amp; Calibration
          </p>
        </div>

        {/* Priority Filter Toggle */}
        <div className="flex items-center bg-[#F5F7FA] p-1 rounded-[4px] border border-[#E5E7EB] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPriorityFilter('ALL')}
            className={`px-3 py-1.5 rounded-[3px] transition-colors ${
              priorityFilter === 'ALL'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            All Priorities
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('URGENT')}
            className={`px-3 py-1.5 rounded-[3px] flex items-center gap-1 transition-colors ${
              priorityFilter === 'URGENT'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'text-[#DC2626] hover:bg-[#FEF2F2]'
            }`}
          >
            <Zap className="size-3" /> Urgent Only
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('NORMAL')}
            className={`px-3 py-1.5 rounded-[3px] transition-colors ${
              priorityFilter === 'NORMAL'
                ? 'bg-white text-[#111827] shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            Normal Only
          </button>
        </div>
      </div>

      <CategoryTabs tabs={stageTabs} activeTab={activeStageTab} onTabChange={setActiveStageTab} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lab Bench Active Work Orders ({sortedLabQueue.length})</CardTitle>
              <CardDescription>
                Work orders sorted by Urgency Priority (URGENT top priority, followed by FIFO inward date)
              </CardDescription>
            </div>
            <div className="text-xs text-[#6B7280] flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-[#DC2626]" /> Urgent (24-48H)
              <span className="inline-block size-2 rounded-full bg-[#0274BB] ml-2" /> Standard (5D)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">
              <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading lab queue...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-[#DC2626]">
              <AlertCircle className="size-6 mx-auto mb-2" />
              {(error as Error).message}
            </div>
          ) : sortedLabQueue.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] space-y-2">
              <FlaskConical className="size-8 mx-auto text-[#9CA3AF]" />
              <p className="text-base font-semibold text-[#374151]">No work orders matching this view</p>
              <p className="text-xs text-[#6B7280]">
                All received customer equipment in this filter has completed calibration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3">Priority / SLA</th>
                    <th className="px-5 py-3">Request #</th>
                    <th className="px-5 py-3">Client Account</th>
                    <th className="px-4 py-3">Inward Instruments</th>
                    <th className="px-4 py-3">Proof &amp; Docs</th>
                    <th className="px-4 py-3">Current Stage</th>
                    <th className="px-5 py-3 text-right">Lab Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {sortedLabQueue.map((req) => {
                    const isUrgent = req.priority === 'URGENT';
                    const hasAttachments = req.attachments && req.attachments.length > 0;

                    return (
                      <tr
                        key={req.id}
                        className={`transition-colors ${
                          isUrgent
                            ? 'bg-[#FFF9F5] hover:bg-[#FFF3EC] border-l-4 border-l-[#EF7626]'
                            : 'hover:bg-[#FAFAFA] border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Priority / SLA */}
                        <td className="px-5 py-4">
                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold bg-[#DC2626] text-white">
                              <Zap className="size-3" /> URGENT (24H)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#E5E7EB] text-[#374151]">
                              <Clock className="size-3 text-[#6B7280]" /> NORMAL (5D)
                            </span>
                          )}
                          <div className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-1">
                            <Calendar className="size-3" />
                            {new Date(req.collection_date).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Request # */}
                        <td className="px-5 py-4 font-mono font-semibold text-[#0274BB]">
                          <Link to={`/requests/${req.id}`} className="hover:underline">
                            {req.request_number}
                          </Link>
                          {req.client_po_ref && (
                            <span className="block text-[11px] text-[#6B7280] font-sans">
                              PO: {req.client_po_ref}
                            </span>
                          )}
                        </td>

                        {/* Client Account */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-[#111827] block">
                            {req.clients?.client_name || '—'}
                          </span>
                          <span className="text-[11px] text-[#6B7280] font-mono">
                            {req.clients?.client_code || ''}
                          </span>
                        </td>

                        {/* Inward Instruments */}
                        <td className="px-4 py-4 text-[#374151]">
                          <div className="font-semibold">
                            {req.request_items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} unit(s)
                          </div>
                          <div className="text-[11px] text-[#6B7280] truncate max-w-[200px]">
                            {req.request_items?.map((it) => it.item_masters?.item_name || 'Gauge').join(', ')}
                          </div>
                        </td>

                        {/* Proof & Attachments */}
                        <td className="px-4 py-4">
                          {hasAttachments ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRequestAttachments({
                                  requestNumber: req.request_number,
                                  clientName: req.clients?.client_name,
                                  attachments: req.attachments!,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-semibold bg-[#E6F2FF] hover:bg-[#D0E7FF] text-[#0274BB] transition-colors cursor-pointer border border-[#0274BB]/20"
                            >
                              <Paperclip className="size-3.5" />
                              <span>{req.attachments!.length} Proof(s)</span>
                              <Eye className="size-3 text-[#0274BB]" />
                            </button>
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">No proof attached</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <Badge
                            variant={
                              req.status === 'CREATED'
                                ? 'primary'
                                : req.status === 'VERIFIED'
                                ? 'info'
                                : req.status === 'FAULTY' || req.status === 'REPAIR_IN_PROGRESS'
                                ? 'warning'
                                : req.status === 'OUTSOURCED'
                                ? 'info'
                                : 'success'
                            }
                          >
                            {req.status}
                          </Badge>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            <Select
                              defaultValue=""
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                if (val === 'IN_HOUSE') {
                                  navigate(`/lab/calibration/${req.id}?tab=IN_HOUSE`);
                                } else if (val === 'IN_LAB_REPAIR') {
                                  navigate(`/lab/calibration/${req.id}?tab=IN_LAB_REPAIR`);
                                } else if (val === 'OUTSOURCE_PO') {
                                  navigate(`/lab/calibration/${req.id}?tab=OUTSOURCE_PO`);
                                } else if (val === 'VERIFY') {
                                  navigate(`/lab/verification/${req.id}`);
                                } else if (val === 'REQUEST') {
                                  navigate(`/requests/${req.id}`);
                                }
                              }}
                              className="text-xs font-semibold py-1 px-2.5 h-8.5 bg-white dark:bg-neutral-800 border-slate-300 w-52 shadow-2xs cursor-pointer"
                            >
                              <option value="" disabled>Choose Lab Action...</option>
                              <option value="IN_HOUSE">🔬 In-Lab Calibration</option>
                              <option value="IN_LAB_REPAIR">🔧 In-Lab Service &amp; Repair (Faulty)</option>
                              <option value="OUTSOURCE_PO">🚚 Outsource</option>
                              {req.status === 'CREATED' ? (
                                <option value="VERIFY">📋 Inspect &amp; Inward Verify</option>
                              ) : (
                                <option value="VERIFY">📋 View Inward Verification</option>
                              )}
                              <option value="REQUEST">📄 Request &amp; Billing Details</option>
                            </Select>
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

      {/* Attachment Proof Viewer Modal */}
      {selectedRequestAttachments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[4px] shadow-xl max-w-lg w-full overflow-hidden border border-[#E5E7EB]">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <div>
                <h3 className="font-bold text-[#111827] text-base flex items-center gap-2">
                  <Paperclip className="size-4 text-[#0274BB]" /> Attached Proof Documents
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Request: <span className="font-mono font-semibold text-[#0274BB]">{selectedRequestAttachments.requestNumber}</span>
                  {selectedRequestAttachments.clientName && (
                    <span> • {selectedRequestAttachments.clientName}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestAttachments(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-[4px] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedRequestAttachments.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[4px] text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(att.type, att.name)}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1E293B] truncate">{att.name}</p>
                      <p className="text-xs text-[#64748B]">
                        {formatBytes(att.size)} • {new Date(att.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {att.base64Data ? (
                    <a
                      href={att.base64Data}
                      download={att.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0274BB] hover:text-[#01579B] bg-white border border-[#CBD5E1] px-2.5 py-1.5 rounded-[4px] hover:bg-[#F1F5F9] transition-colors shrink-0"
                    >
                      <Download className="size-3.5" /> View / Download
                    </a>
                  ) : (
                    <span className="text-xs text-[#94A3B8]">Saved</span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-[#E5E7EB] bg-[#F8FAFC] flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedRequestAttachments(null)}
              >
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabQueuePage;
