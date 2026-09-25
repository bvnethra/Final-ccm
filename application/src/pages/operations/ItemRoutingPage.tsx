// application/src/pages/operations/ItemRoutingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Building,
  Truck,
  Layers,
  Save,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCalibrationRequest, useRouteRequestItems } from '../../hooks/useOperations';
import { useVendors } from '../../hooks/useVendorMaster';
import type { ItemRouteAssignment } from '../../services/operationsService';
import { DetailViewSkeleton } from '../../components/ui/UIPrimitives';

export const ItemRoutingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId, organizationId, user } = useAuthContext();

  const { data: request, isLoading: isLoadingReq } = useCalibrationRequest(id);
  const { data: vendors = [], isLoading: isLoadingVendors } = useVendors();
  const routeMutation = useRouteRequestItems();

  const [assignments, setAssignments] = useState<Record<string, ItemRouteAssignment>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (request?.request_items) {
      const initial: Record<string, ItemRouteAssignment> = {};
      request.request_items.forEach((item) => {
        initial[item.id] = {
          itemId: item.id,
          destination: item.destination || 'IN_HOUSE',
          vendorId: item.vendor_id || '',
          vendorName: item.vendor_name || '',
          expectedReturnDate: item.expected_return_date || '',
          estimatedCost: item.estimated_cost || 0,
          remarks: item.remarks || '',
        };
      });
      setAssignments(initial);
    }
  }, [request]);

  const handleDestinationChange = (itemId: string, destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE') => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        destination,
      },
    }));
  };

  const handleVendorChange = (itemId: string, vendorId: string) => {
    const selectedVendor = vendors.find((v) => v.id === vendorId);
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        vendorId,
        vendorName: selectedVendor?.vendor_name || '',
      },
    }));
  };

  const handleFieldChange = (
    itemId: string,
    field: 'expectedReturnDate' | 'estimatedCost' | 'remarks',
    value: any
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSetAll = (destination: 'IN_HOUSE' | 'VENDOR_OUTSOURCE') => {
    if (!request?.request_items) return;
    setAssignments((prev) => {
      const next = { ...prev };
      request.request_items?.forEach((it) => {
        next[it.id] = {
          ...next[it.id],
          destination,
        };
      });
      return next;
    });
  };

  const handleSave = async (redirectPath?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!tenantId || !id) {
      setErrorMessage('Tenant context or Request ID is missing.');
      return;
    }

    const payloadItems = Object.values(assignments);

    // Validate outsource items have vendors
    const missingVendors = payloadItems.filter(
      (p) => p.destination === 'VENDOR_OUTSOURCE' && !p.vendorId
    );
    if (missingVendors.length > 0) {
      setErrorMessage(
        `Please select an external vendor for all items assigned to Outsource (${missingVendors.length} item(s) unassigned).`
      );
      return;
    }

    try {
      await routeMutation.mutateAsync({
        tenantId,
        organizationId,
        requestId: id,
        actorUserId: user?.id,
        actorName: user?.fullName || user?.email || 'Lab Supervisor',
        items: payloadItems,
      });

      setSuccessMessage('Equipment routing & segregation saved successfully!');

      if (redirectPath) {
        setTimeout(() => navigate(redirectPath), 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save routing assignments.');
    }
  };

  if (isLoadingReq || isLoadingVendors) {
    return <DetailViewSkeleton columns={6} rows={5} cardsCount={4} />;
  }

  if (!request) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="size-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-gray-800">Inward Request Not Found</h2>
        <p className="text-gray-500 text-xs mt-1">ID: {id}</p>
        <Link
          to="/requests"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#0274BB] hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
      </div>
    );
  }

  const items = request.request_items || [];
  const totalItems = items.length;
  const inHouseCount = Object.values(assignments).filter((a) => a.destination === 'IN_HOUSE').length;
  const vendorCount = Object.values(assignments).filter((a) => a.destination === 'VENDOR_OUTSOURCE').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/requests/${id}`)}
            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
            title="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Step 2 of 6: Segregation & Routing
              </span>
              <span className="text-xs text-gray-500 font-mono">#{request.request_number}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Equipment Routing & Lab Segregation</h1>
          </div>
        </div>

        {/* Quick Save Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={routeMutation.isPending}
            className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition"
          >
            <Save className="size-3.5" />
            {routeMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(`/lab/verification/${id}`)}
            disabled={routeMutation.isPending}
            className="px-4 py-2 bg-[#0274BB] hover:bg-[#025c94] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <span>Proceed to Lab Execution</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Request Header Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Client Account
          </span>
          <span className="text-sm font-bold text-gray-900 mt-1 block">
            {request.clients?.client_name || 'N/A'}
          </span>
          <span className="text-[11px] text-gray-500">
            {request.clients?.city ? `${request.clients.city}, ` : ''}{request.clients?.state || ''}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Inward Date & Priority
          </span>
          <span className="text-sm font-bold text-gray-900 mt-1 block">
            {request.collection_date}
          </span>
          <span
            className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${
              request.priority === 'URGENT'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {request.priority} PRIORITY
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg">
            <Building className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              In-House Metrology Lab
            </span>
            <span className="text-xl font-extrabold text-blue-900 mt-0.5">
              {inHouseCount} / {totalItems} Items
            </span>
            <span className="text-[11px] text-blue-600 block">Tested in internal standards room</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-600 text-white rounded-lg">
            <Truck className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              External Vendor Outsource
            </span>
            <span className="text-xl font-extrabold text-amber-900 mt-0.5">
              {vendorCount} / {totalItems} Items
            </span>
            <span className="text-[11px] text-amber-600 block">Sent to specialized calibration labs</span>
          </div>
        </div>
      </div>

      {/* Segregation Table Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="size-4 text-[#0274BB]" />
              Inward Items Segregation Matrix
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Specify whether each equipment will be calibrated in-house or outsourced to an external vendor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetAll('IN_HOUSE')}
              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition"
            >
              All In-House
            </button>
            <button
              type="button"
              onClick={() => handleSetAll('VENDOR_OUTSOURCE')}
              className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition"
            >
              All Outsource
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-100 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3">Equipment / Item Master</th>
                <th className="px-4 py-3">Serial No / ID</th>
                <th className="px-4 py-3">Inward Condition</th>
                <th className="px-4 py-3 w-64">Destination Routing</th>
                <th className="px-4 py-3 min-w-[200px]">Vendor & Return Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {items.map((item, index) => {
                const current = assignments[item.id] || {
                  destination: 'IN_HOUSE',
                  vendorId: '',
                  vendorName: '',
                  expectedReturnDate: '',
                  estimatedCost: 0,
                  remarks: '',
                };
                const isOutsource = current.destination === 'VENDOR_OUTSOURCE';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition ${
                      isOutsource ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-mono text-gray-500 font-semibold">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900">
                        {item.item_masters?.item_name || 'Unspecified Equipment'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Code: {item.item_masters?.item_code || 'N/A'} · Cat:{' '}
                        {item.item_masters?.item_category || 'General'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-semibold">
                        {item.serial_number || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.item_condition === 'GOOD'
                            ? 'bg-green-100 text-green-800'
                            : item.item_condition === 'DAMAGED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.item_condition}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="inline-flex rounded-md shadow-sm border border-gray-300 p-0.5 bg-gray-100">
                        <button
                          type="button"
                          onClick={() => handleDestinationChange(item.id, 'IN_HOUSE')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                            !isOutsource
                              ? 'bg-white text-blue-700 shadow-xs border border-blue-200'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Building className="size-3" />
                          <span>In-House Lab</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDestinationChange(item.id, 'VENDOR_OUTSOURCE')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                            isOutsource
                              ? 'bg-white text-amber-800 shadow-xs border border-amber-300'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Truck className="size-3" />
                          <span>Outsource Vendor</span>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {isOutsource ? (
                        <div className="space-y-2">
                          <select
                            value={current.vendorId || ''}
                            onChange={(e) => handleVendorChange(item.id, e.target.value)}
                            className="w-full text-xs border border-amber-300 rounded px-2.5 py-1.5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                          >
                            <option value="">-- Select Calibration Vendor * --</option>
                            {vendors
                              .filter((v) => v.status === 'ACTIVE')
                              .map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.vendor_name} ({v.city || 'Vendor'})
                                </option>
                              ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 block">Expected Return</label>
                              <input
                                type="date"
                                value={current.expectedReturnDate || ''}
                                onChange={(e) =>
                                  handleFieldChange(item.id, 'expectedReturnDate', e.target.value)
                                }
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                              />
                            </div>
                            <div className="w-28">
                              <label className="text-[10px] text-gray-500 block">Est. Cost (₹)</label>
                              <input
                                type="number"
                                min={0}
                                placeholder="0.00"
                                value={current.estimatedCost || ''}
                                onChange={(e) =>
                                  handleFieldChange(
                                    item.id,
                                    'estimatedCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-[11px] flex items-center gap-1.5">
                          <Clock className="size-3.5 text-blue-500" />
                          <span>Will be processed in Internal Standards Room</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600">
            Segregated <strong className="text-blue-700">{inHouseCount} In-House</strong> and{' '}
            <strong className="text-amber-800">{vendorCount} External Vendor</strong> items.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/commercial/quotations/new?requestId=${id}`}
              className="text-xs text-[#0274BB] hover:underline font-semibold"
            >
              Generate Quotation (Optional Step 3) &rarr;
            </Link>
            <button
              type="button"
              onClick={() => handleSave(`/lab/verification/${id}`)}
              disabled={routeMutation.isPending}
              className="px-5 py-2.5 bg-[#0274BB] hover:bg-[#025c94] text-white rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Confirm Routing & Open Lab Verification</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemRoutingPage;
