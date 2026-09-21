// application/src/components/masters/items/ItemMasterListView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { ItemMaster } from '../../../types/domain';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
} from '../../ui/UIPrimitives';
import {
  Search,
  Plus,
  Compass,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  Layers,
  Ruler,
  IndianRupee,
} from 'lucide-react';
import { ITEM_METROLOGY_CATEGORIES } from '../../../services/itemMasterService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface ItemMasterListViewProps {
  items: ItemMaster[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
}

export const ItemMasterListView: React.FC<ItemMasterListViewProps> = ({
  items,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onToggleStatus,
  isTogglingId,
}) => {
  const { isCollectionAgent } = useAuthContext();

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-[4px] bg-[#0274BB] flex items-center justify-center text-white">
              <Compass className="size-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Item Master Catalog
            </h1>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Metrology Instruments & Measurement Equipment Catalog for Inward, Testing & Commercial Billing {isCollectionAgent && '(View Only)'}
          </p>
        </div>

        {!isCollectionAgent && (
          <Link to="/masters/items/new">
            <Button variant="primary">
              <Plus className="size-4" /> Add New Item
            </Button>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search by item code, name, category, manufacturer..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] focus:border-[#0274BB] focus:outline-none"
            >
              <option value="ALL">All Metrology Disciplines</option>
              {ITEM_METROLOGY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusFilterChange(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors ${
                    statusFilter === st
                      ? 'bg-[#0274BB] text-white'
                      : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Item & Model</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Measurement Range</th>
                <th className="px-5 py-3.5">Least Count</th>
                <th className="px-5 py-3.5">Standard Cost</th>
                <th className="px-5 py-3.5">Calibration Cycle</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">System Audit</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span>Loading item master catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#6B7280]">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#9CA3AF]">
                        <Compass className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-[#111827]">No Items Found</h3>
                      <p className="text-xs text-[#6B7280]">
                        {searchQuery
                          ? 'No matching instruments found for this search filter.'
                          : 'No instruments registered in the catalog yet. Register your first instrument type.'}
                      </p>
                      <Link to="/masters/items/new">
                        <Button variant="secondary" size="sm">
                          <Plus className="size-3.5" /> Register Item
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isToggling = isTogglingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">
                          {item.item_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs px-1.5 py-0.5 bg-[#EFF6FF] text-[#0274BB] border border-[#0274BB]/20 rounded-[3px] font-semibold">
                            {item.item_code}
                          </span>
                          {(item.manufacturer || item.model) && (
                            <span className="text-xs text-[#6B7280]">
                              {[item.manufacturer, item.model].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2 py-0.5 bg-[#F3F4F6] text-[#374151] rounded border border-[#E5E7EB] inline-flex items-center gap-1">
                          <Layers className="size-3 text-[#9CA3AF]" />
                          {item.item_category || item.item_type || 'General Instrument'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#111827]">
                          <Ruler className="size-3 text-[#9CA3AF]" />
                          {item.measurement_range || `${item.range_min} - ${item.range_max} ${item.range_unit}`}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-[#374151] bg-[#F9FAFB] px-2 py-0.5 border border-[#E5E7EB] rounded">
                          {item.least_count} {item.least_count_unit}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827] flex items-center text-xs">
                          <IndianRupee className="size-3.5 text-[#16A34A]" />
                          <span>{item.standard_cost.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-[#6B7280] italic block">
                          Quotation base (overridable)
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-[#4B5563]">
                          {item.calibration_frequency || 12} Months
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {isCollectionAgent ? (
                          <Badge variant={item.status === 'ACTIVE' ? 'success' : 'outline'}>
                            {item.status}
                          </Badge>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(item.id)}
                            disabled={isToggling}
                            className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                            title="Click to toggle status"
                          >
                            {item.status === 'ACTIVE' ? (
                              <>
                                <ToggleRight className="size-5 text-[#16A34A]" />
                                <Badge variant="success">ACTIVE</Badge>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="size-5 text-[#9CA3AF]" />
                                <Badge variant="outline">INACTIVE</Badge>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#6B7280]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-[#9CA3AF]" />
                            <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                            <User className="size-3" />
                            <span>By: {item.created_by_name || 'System'}</span>
                          </div>
                          {item.updated_at && item.updated_at !== item.created_at && (
                            <div className="text-[10px] text-[#9CA3AF] border-t border-[#E5E7EB] pt-0.5 mt-0.5">
                              Mod: {new Date(item.updated_at).toLocaleDateString()} by {item.updated_by_name || 'System'}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/masters/items/${item.id}`}>
                            <button
                              className="p-1.5 text-[#4B5563] hover:text-[#0274BB] hover:bg-[#EFF6FF] rounded transition-colors"
                              title="View Instrument Specifications"
                            >
                              <Eye className="size-4" />
                            </button>
                          </Link>
                          {!isCollectionAgent && (
                            <Link to={`/masters/items/${item.id}/edit`}>
                              <button
                                className="p-1.5 text-[#4B5563] hover:text-[#EF7626] hover:bg-[#FFF7ED] rounded transition-colors"
                                title="Edit Instrument Master"
                              >
                                <Edit2 className="size-4" />
                              </button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
