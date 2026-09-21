// application/src/components/masters/vendors/VendorDetailView.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Vendor } from '../../../types/domain';
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
  Truck,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

import { useAuthContext } from '../../../contexts/AuthContext';

interface VendorDetailViewProps {
  vendor: Vendor;
}

export const VendorDetailView: React.FC<VendorDetailViewProps> = ({ vendor }) => {
  const { isCollectionAgent, isLabEntryPerson, isLabApprover } = useAuthContext();
  const isViewOnlyMaster = isCollectionAgent || isLabEntryPerson || isLabApprover;
  const phoneNumbers = vendor.phone_numbers || [vendor.phone];
  const emailAddresses = vendor.email_addresses || [vendor.email];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/masters/vendors">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" /> Back to Directory
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                {vendor.vendor_name}
              </h1>
              <Badge variant={vendor.status === 'ACTIVE' ? 'success' : 'outline'}>
                {vendor.status}
              </Badge>
            </div>
            <p className="text-xs text-[#6B7280] font-mono mt-0.5">
              Code: <span className="text-[#EF7626] font-semibold">{vendor.vendor_code}</span>
            </p>
          </div>
        </div>

        {!isViewOnlyMaster && (
          <Link to={`/masters/vendors/${vendor.id}/edit`}>
            <Button variant="warning">
              <Edit2 className="size-4" /> Edit Vendor Record
            </Button>
          </Link>
        )}
      </div>

      {/* Grid: Identification & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-[#EF7626]" />
              <div>
                <CardTitle>Vendor Credentials</CardTitle>
                <CardDescription>Supplier legal registration and representative</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Legal Entity Name</span>
              <span className="font-semibold text-[#111827]">{vendor.vendor_name}</span>
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">GST / Tax ID Number</span>
              <span className="font-mono text-sm font-bold text-[#374151] px-2 py-0.5 bg-[#F3F4F6] rounded inline-block">
                {vendor.gst_tax_number}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6B7280] block">Primary Contact Person</span>
              <span className="font-medium text-[#111827]">{vendor.contact_person}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-[#EF7626]" />
              <div>
                <CardTitle>Physical Facility & Lab</CardTitle>
                <CardDescription>Dispatch pickup and equipment delivery destination</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-[#6B7280] block">Registered Address</span>
              <p className="text-sm text-[#111827] whitespace-pre-wrap mt-0.5">{vendor.address}</p>
            </div>
            <div className="pt-2 border-t border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Geographic Location</span>
              <span className="font-medium text-[#111827]">
                {vendor.city}, {vendor.state} — PIN: {vendor.pin}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Serviced Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-[#EF7626]" />
            <div>
              <CardTitle>Items & Metrology Categories Serviced</CardTitle>
              <CardDescription>Scope of technical service, test disciplines and calibration capabilities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vendor.serviced_categories && vendor.serviced_categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vendor.serviced_categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-[#FFF7ED] text-[#EF7626] border border-[#EF7626]/20 rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Wrench className="size-3" />
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9CA3AF] italic">
              No specific metrology service categories assigned.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Communication Lines (Multi Phone & Email) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#EF7626]" />
            <div>
              <CardTitle>Authorized Communication Channels</CardTitle>
              <CardDescription>Verified supplier telephonic lines and electronic contact</CardDescription>
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
                    <span className="text-[10px] bg-[#FFF7ED] text-[#EF7626] px-1.5 py-0.5 rounded font-semibold ml-auto">
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
                    <span className="text-[10px] bg-[#FFF7ED] text-[#EF7626] px-1.5 py-0.5 rounded font-semibold ml-auto">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Audit Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-[#6B7280]" />
            <div>
              <CardTitle>System Audit & Record Traceability</CardTitle>
              <CardDescription>Immutable record creation and alteration logs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Record Creation</span>
            <div className="text-[#111827]">
              Date: {new Date(vendor.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Created By: {vendor.created_by_name || vendor.created_by || 'Authorized User'}</span>
            </div>
          </div>

          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded space-y-1">
            <span className="font-semibold text-[#4B5563]">Last Modification</span>
            <div className="text-[#111827]">
              Date: {vendor.updated_at ? new Date(vendor.updated_at).toLocaleString() : new Date(vendor.created_at).toLocaleString()}
            </div>
            <div className="text-[#6B7280] flex items-center gap-1">
              <User className="size-3" />
              <span>Modified By: {vendor.updated_by_name || vendor.updated_by || vendor.created_by_name || 'Authorized User'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
