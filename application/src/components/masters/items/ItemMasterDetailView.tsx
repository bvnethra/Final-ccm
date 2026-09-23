// application/src/components/masters/items/ItemMasterDetailView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { ItemMaster } from '../../../types/domain';
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
  Ruler,
  IndianRupee,
  Calendar,
  Clock,
  User,
  Layers,
  Info,
} from 'lucide-react';

import { useAuthContext } from '../../../contexts/AuthContext';

interface ItemMasterDetailViewProps {
  item: ItemMaster;
}

export const ItemMasterDetailView: React.FC<ItemMasterDetailViewProps> = ({ item }) => {
  const { canPerform, isSuperAdmin } = useAuthContext();
  const canEditMaster = isSuperAdmin || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE_EDIT') || canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE');
  const isViewOnlyMaster = !canEditMaster;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/masters/items">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                {item.item_name}
              </h1>
              <Badge variant={item.status === 'ACTIVE' ? 'success' : 'outline'}>
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Code: <span className="text-[#0274BB] font-semibold">{item.item_code}</span>
            </p>
          </div>
        </div>

        {!isViewOnlyMaster && (
          <Link to={`/masters/items/${item.id}/edit`}>
            <Button variant="primary">
              <Edit2 className="size-4" /> Edit Instrument Master
            </Button>
          </Link>
        )}
      </div>

      {/* Grid: Specifications & Commercial Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metrology Specifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ruler className="size-5 text-[#0274BB]" />
              <div>
                <CardTitle>Measurement Specifications</CardTitle>
                <CardDescription>Calibrated range tolerances and resolution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Measurement Range</span>
              <span className="font-mono text-base font-bold text-[#111827] block mt-0.5">
                {item.measurement_range || `${item.range_min} - ${item.range_max} ${item.range_unit}`}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Min: {item.range_min} {item.range_unit} • Max: {item.range_max} {item.range_unit}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Instrument Least Count</span>
              <span className="font-mono text-sm font-semibold text-[#111827] block mt-0.5">
                {item.least_count} {item.least_count_unit}
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Category / Discipline</span>
              <span className="text-xs font-medium px-2.5 py-1 bg-[#F3F4F6] text-[#374151] rounded border border-[#E5E7EB] inline-flex items-center gap-1.5 mt-1">
                <Layers className="size-3 text-[#9CA3AF]" />
                {item.item_category || item.item_type || 'General Metrology'}
              </span>
            </div>

            {(item.manufacturer || item.model) && (
              <div className="pt-2 border-t border-[#E5E7EB]">
                <span className="text-xs text-[#6B7280] block">Make & Model</span>
                <span className="text-sm font-medium text-[#111827]">
                  {[item.manufacturer, item.model].filter(Boolean).join(' — Model: ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commercial Pricing & Frequency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IndianRupee className="size-5 text-[#0274BB]" />
              <div>
                <CardTitle>Commercial Pricing & Recall Cycle</CardTitle>
                <CardDescription>Billing baseline and periodic maintenance interval</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Standard Calibration Fee</span>
              <span className="text-2xl font-bold text-[#16A34A] flex items-center mt-0.5">
                <IndianRupee className="size-5 text-[#16A34A]" />
                {item.standard_cost.toFixed(2)}
              </span>
              <div className="flex items-start gap-1.5 p-2 bg-[#F0FDF4] border border-[#16A34A]/20 rounded text-xs text-[#15803d] mt-2">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Cost Override Rule:</strong> Auto-populated into commercial quotations as the baseline rate; can be overridden per item line during quotation builder.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Default Calibration Interval</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="size-4 text-[#0274BB]" />
                <span className="text-sm font-semibold text-[#111827]">
                  {item.calibration_frequency || 12} Months
                </span>
              </div>
              <span className="text-[11px] text-[#6B7280] block mt-0.5">
                Can be adjusted per instance upon physical lab calibration test completion.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Audit Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-[#6B7280]" />
            <div>
              <CardTitle>System Audit & Technical Integrity</CardTitle>
              <CardDescription>Immutable instrument record creation and modification logs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Record Creation</span>
            <div className="text-[#111827]">
              Date: {new Date(item.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Created By: {item.created_by_name || item.created_by || 'Authorized User'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Last Modification</span>
            <div className="text-[#111827]">
              Date: {item.updated_at ? new Date(item.updated_at).toLocaleString() : new Date(item.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Modified By: {item.updated_by_name || item.updated_by || item.created_by_name || 'Authorized User'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
