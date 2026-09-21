// application/src/components/masters/vendors/VendorListView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Vendor } from '../../../types/domain';
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
  Truck,
  Phone,
  Mail,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  Wrench,
} from 'lucide-react';
import { METROLOGY_SERVICE_CATEGORIES } from '../../../services/vendorMasterService';
import { useAuthContext } from '../../../contexts/AuthContext';

interface VendorListViewProps {
  vendors: Vendor[];
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

export const VendorListView: React.FC<VendorListViewProps> = ({
  vendors,
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
  const { isCollectionAgent, isLabEntryPerson } = useAuthContext();
  const isViewOnlyMaster = isCollectionAgent || isLabEntryPerson;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-[4px] bg-[#EF7626] flex items-center justify-center text-white">
              <Truck className="size-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Vendor Master Directory
            </h1>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Authorized Calibration Laboratories, Tool Suppliers & Outsource Vendors {isViewOnlyMaster && '(View Only)'}
          </p>
        </div>

        {!isViewOnlyMaster && (
          <Link to="/masters/vendors/new">
            <Button variant="warning">
              <Plus className="size-4" /> Add New Vendor
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
              placeholder="Search by vendor code, name, city, discipline..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] focus:border-[#EF7626] focus:outline-none"
            >
              <option value="ALL">All Disciplines / Categories</option>
              {METROLOGY_SERVICE_CATEGORIES.map((cat) => (
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
                      ? 'bg-[#EF7626] text-white'
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

      {/* Vendor Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Vendor Info</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">GST / Tax ID</th>
                <th className="px-5 py-3.5">Categories Serviced</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">System Audit</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 border-2 border-[#EF7626] border-t-transparent rounded-full animate-spin" />
                      <span>Loading vendor master records...</span>
                    </div>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#6B7280]">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#9CA3AF]">
                        <Truck className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-[#111827]">No Vendors Found</h3>
                      <p className="text-xs text-[#6B7280]">
                        {searchQuery
                          ? 'No matching vendors found for this search criteria.'
                          : 'No external vendors registered yet. Register your first vendor using the full-page creation form.'}
                      </p>
                      <Link to="/masters/vendors/new">
                        <Button variant="secondary" size="sm">
                          <Plus className="size-3.5" /> Register Vendor
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const phoneCount = vendor.phone_numbers?.length || 1;
                  const emailCount = vendor.email_addresses?.length || 1;
                  const isToggling = isTogglingId === vendor.id;

                  return (
                    <tr key={vendor.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">
                          {vendor.vendor_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs px-1.5 py-0.5 bg-[#FFF7ED] text-[#EF7626] border border-[#EF7626]/20 rounded-[3px] font-semibold">
                            {vendor.vendor_code}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-[#111827]">
                          {vendor.contact_person}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-[#9CA3AF]" />
                            {vendor.phone}
                            {phoneCount > 1 && (
                              <span className="text-[10px] px-1 bg-[#F3F4F6] rounded text-[#4B5563]">
                                +{phoneCount - 1}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-[#9CA3AF]" />
                            {vendor.email}
                            {emailCount > 1 && (
                              <span className="text-[10px] px-1 bg-[#F3F4F6] rounded text-[#4B5563]">
                                +{emailCount - 1}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-[#111827] font-medium">
                          {vendor.city}, {vendor.state}
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono">
                          PIN: {vendor.pin}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#374151] px-2 py-0.5 bg-[#F3F4F6] rounded">
                          {vendor.gst_tax_number}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {vendor.serviced_categories && vendor.serviced_categories.length > 0 ? (
                            vendor.serviced_categories.slice(0, 2).map((cat, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 bg-[#F3F4F6] text-[#374151] rounded border border-[#E5E7EB] flex items-center gap-1"
                              >
                                <Wrench className="size-2.5 text-[#9CA3AF]" />
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">General Services</span>
                          )}
                          {vendor.serviced_categories && vendor.serviced_categories.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#EFF6FF] text-[#0274BB] rounded font-semibold">
                              +{vendor.serviced_categories.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {isViewOnlyMaster ? (
                          <Badge variant={vendor.status === 'ACTIVE' ? 'success' : 'outline'}>
                            {vendor.status}
                          </Badge>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(vendor.id)}
                            disabled={isToggling}
                            className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                            title="Click to toggle status"
                          >
                            {vendor.status === 'ACTIVE' ? (
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
                            <span>Created: {new Date(vendor.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                            <User className="size-3" />
                            <span>By: {vendor.created_by_name || 'System'}</span>
                          </div>
                          {vendor.updated_at && vendor.updated_at !== vendor.created_at && (
                            <div className="text-[10px] text-[#9CA3AF] border-t border-[#E5E7EB] pt-0.5 mt-0.5">
                              Mod: {new Date(vendor.updated_at).toLocaleDateString()} by {vendor.updated_by_name || 'System'}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/masters/vendors/${vendor.id}`}>
                            <button
                              className="p-1.5 text-[#4B5563] hover:text-[#0274BB] hover:bg-[#EFF6FF] rounded transition-colors"
                              title="View Vendor Profile & History"
                            >
                              <Eye className="size-4" />
                            </button>
                          </Link>
                          {!isViewOnlyMaster && (
                            <Link to={`/masters/vendors/${vendor.id}/edit`}>
                              <button
                                className="p-1.5 text-[#4B5563] hover:text-[#EF7626] hover:bg-[#FFF7ED] rounded transition-colors"
                                title="Edit Vendor Record"
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
