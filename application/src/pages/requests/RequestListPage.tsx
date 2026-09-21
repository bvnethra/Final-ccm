// application/src/pages/requests/RequestListPage.tsx
import React, { useState } from 'react';
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
import { Plus, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

export const RequestListPage: React.FC = () => {
  const { isLabApprover, isAdmin } = useAuthContext();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const { data: requests = [], isLoading, error } = useCalibrationRequests(activeTab);

  const tabs = [
    { id: 'ALL', label: 'All Requests' },
    { id: 'CREATED', label: 'Created / Inward' },
    { id: 'VERIFIED', label: 'Verified' },
    { id: 'CALIBRATED', label: 'Calibrated' },
    { id: 'QUOTATION', label: 'Quotation / Commercial' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CREATED':
        return <Badge variant="primary">CREATED</Badge>;
      case 'VERIFIED':
        return <Badge variant="info">VERIFIED</Badge>;
      case 'CALIBRATED':
        return <Badge variant="success">CALIBRATED</Badge>;
      case 'QUOTATION':
        return <Badge variant="warning">QUOTATION</Badge>;
      case 'PARTIALLY_INVOICED':
        return <Badge variant="warning">PARTIAL INVOICE</Badge>;
      case 'INVOICED':
        return <Badge variant="success">INVOICED</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'DISPATCHED':
        return <Badge variant="warning">DISPATCHED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Equipment Inward Requests</h1>
          <p className="text-sm text-[#6B7280]">
            Lifecycle Process 1: Equipment Inward & Inspection Registration
          </p>
        </div>

        {!isLabApprover && !isAdmin && (
          <Link to="/requests/new">
            <Button variant="primary">
              <Plus className="size-4" /> New Inward Request
            </Button>
          </Link>
        )}
      </div>

      <CategoryTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <Card>
        <CardHeader>
          <CardTitle>Registered Calibration Requests</CardTitle>
          <CardDescription>
            Live inward records scoped to your tenant and branch facility
          </CardDescription>
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
                Get started by clicking &ldquo;New Inward Request&rdquo; to register customer instruments.
              </p>
              <Link to="/requests/new">
                <Button variant="secondary" size="sm" className="mt-2">
                  <Plus className="size-4" /> Register First Inward Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Request Number</th>
                    <th className="px-6 py-3">Client Account</th>
                    <th className="px-6 py-3">Collection Date</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Items Count</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAFAFA]">
                      <td className="px-6 py-4 font-mono font-medium text-[#0274BB]">
                        <Link to={`/requests/${req.id}`} className="hover:underline">
                          {req.request_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#111827]">
                        {req.clients?.client_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {new Date(req.collection_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={req.priority === 'URGENT' ? 'warning' : 'secondary'}
                        >
                          {req.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                      <td className="px-6 py-4 text-[#374151] font-medium">
                        {req.request_items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 text-right">
                        {req.status === 'CREATED' ? (
                          <Link to={`/lab/verification/${req.id}`}>
                            <Button variant="secondary" size="sm">
                              Inspect in Lab <ArrowRight className="size-3.5" />
                            </Button>
                          </Link>
                        ) : req.status === 'VERIFIED' ? (
                          <Link to={`/lab/calibration/${req.id}`}>
                            <Button variant="primary" size="sm">
                              Run Calibration <ArrowRight className="size-3.5" />
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/requests/${req.id}`}>
                            <Button variant="outlineInk" size="sm">
                              View Details
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestListPage;
