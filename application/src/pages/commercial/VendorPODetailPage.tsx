// application/src/pages/commercial/VendorPODetailPage.tsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOutsourcePOs, useCalibrationRequests } from '../../hooks/useOperations';
import { useVendors } from '../../hooks/useVendorMaster';
import { OfficialVendorPOView } from '../../components/commercial/OfficialVendorPOView';
import { Button } from '../../components/ui/UIPrimitives';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const VendorPODetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: outsourcePOs = [], isLoading: isLoadingPOs } = useOutsourcePOs();
  const { data: vendors = [], isLoading: isLoadingVendors } = useVendors();
  const { data: requests = [] } = useCalibrationRequests();

  if (isLoadingPOs || isLoadingVendors) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#6B7280]">
          <div className="size-8 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading Vendor Purchase Order...</span>
        </div>
      </div>
    );
  }

  const po =
    outsourcePOs.find((p) => p.id === id || p.vendor_po_number === id || p.voucher_no === id) ||
    (id === 'sample' || id === 'latest' || id === 'demo' ? outsourcePOs[0] : undefined);

  if (!po) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4 text-center">
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px] text-sm flex items-center justify-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>Vendor Purchase Order "{id}" could not be found or has been deleted.</span>
        </div>
        <Link to="/masters/vendors">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="size-4" /> Back to Vendors List
          </Button>
        </Link>
      </div>
    );
  }

  const vendor = vendors.find((v) => v.id === po.vendor_id);
  const request = requests.find((r) => r.id === po.request_id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <OfficialVendorPOView
        outsourcePO={po}
        vendor={vendor}
        request={request}
        isFullPage={true}
      />
    </div>
  );
};

export default VendorPODetailPage;
