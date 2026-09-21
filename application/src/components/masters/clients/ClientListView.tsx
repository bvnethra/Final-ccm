import React from 'react';
import { Link } from 'react-router-dom';
import type { Client } from '../../../types/domain';
import { useAuthContext } from '../../../contexts/AuthContext';
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
  Building2,
  Phone,
  Mail,
  Eye,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
} from 'lucide-react';

interface ClientListViewProps {
  clients: Client[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onToggleStatus: (id: string) => void;
  isTogglingId?: string;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  clients,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
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
              <Building2 className="size-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Client Master Directory
            </h1>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Enterprise Client Registry & Commercial Billing Profiles {isCollectionAgent && '(View Only)'}
          </p>
        </div>

        {!isCollectionAgent && (
          <Link to="/masters/clients/new">
            <Button variant="primary">
              <Plus className="size-4" /> Add New Client
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
              placeholder="Search by client code, name, city, contact person..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563] text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Client Info</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Tax / GSTIN</th>
                <th className="px-5 py-3.5">Payment Term</th>
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
                      <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
                      <span>Loading client master records...</span>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#6B7280]">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#9CA3AF]">
                        <Building2 className="size-6" />
                      </div>
                      <h3 className="font-semibold text-base text-[#111827]">No Clients Found</h3>
                      <p className="text-xs text-[#6B7280]">
                        {searchQuery
                          ? 'No matching clients found. Try adjusting your search query.'
                          : 'No clients registered yet. Register your first client using the full-page creation form.'}
                      </p>
                      <Link to="/masters/clients/new">
                        <Button variant="secondary" size="sm">
                          <Plus className="size-3.5" /> Register Client
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const phoneCount = client.phone_numbers?.length || 1;
                  const emailCount = client.email_addresses?.length || 1;
                  const isToggling = isTogglingId === client.id;

                  return (
                    <tr key={client.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#111827]">
                          {client.client_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs px-1.5 py-0.5 bg-[#EFF6FF] text-[#0274BB] border border-[#0274BB]/20 rounded-[3px] font-semibold">
                            {client.client_code}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-[#111827]">
                          {client.contact_person}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Phone className="size-3 text-[#9CA3AF]" />
                            {client.phone}
                            {phoneCount > 1 && (
                              <span className="text-[10px] px-1 bg-[#F3F4F6] rounded text-[#4B5563]">
                                +{phoneCount - 1}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="size-3 text-[#9CA3AF]" />
                            {client.email}
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
                          {client.city}, {client.state}
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono">
                          PIN: {client.pin}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-semibold text-[#374151] px-2 py-0.5 bg-[#F3F4F6] rounded">
                          {client.gst_tax_number}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-medium px-2 py-1 bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/20 rounded-[3px]">
                          {client.payment_term === 'IMMEDIATE'
                            ? 'Immediate'
                            : client.payment_term === '30_DAYS'
                            ? '30 Days Net'
                            : '60 Days Net'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {isCollectionAgent ? (
                          <Badge variant={client.status === 'ACTIVE' ? 'success' : 'outline'}>
                            {client.status}
                          </Badge>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(client.id)}
                            disabled={isToggling}
                            className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                            title="Click to toggle status"
                          >
                            {client.status === 'ACTIVE' ? (
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
                            <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                            <User className="size-3" />
                            <span>By: {client.created_by_name || 'System'}</span>
                          </div>
                          {client.updated_at && client.updated_at !== client.created_at && (
                            <div className="text-[10px] text-[#9CA3AF] border-t border-[#E5E7EB] pt-0.5 mt-0.5">
                              Mod: {new Date(client.updated_at).toLocaleDateString()} by {client.updated_by_name || 'System'}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/masters/clients/${client.id}`}>
                            <button
                              className="p-1.5 text-[#4B5563] hover:text-[#0274BB] hover:bg-[#EFF6FF] rounded transition-colors"
                              title="View Client Details & History"
                            >
                              <Eye className="size-4" />
                            </button>
                          </Link>
                          {!isCollectionAgent && (
                            <Link to={`/masters/clients/${client.id}/edit`}>
                              <button
                                className="p-1.5 text-[#4B5563] hover:text-[#EF7626] hover:bg-[#FFF7ED] rounded transition-colors"
                                title="Edit Client Master"
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
