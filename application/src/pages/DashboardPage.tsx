// application/src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useCalibrationRequests } from '../hooks/useOperations';
import { useAuthContext } from '../contexts/AuthContext';
import {
  KPICard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '../components/ui/UIPrimitives';
import {
  FlaskConical,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthContext();
  const { data: requests = [], isLoading } = useCalibrationRequests();

  const total = requests.length;
  const pendingVerify = requests.filter((r) => r.status === 'CREATED').length;
  const pendingCalibrate = requests.filter((r) => r.status === 'VERIFIED').length;
  const calibrated = requests.filter((r) => ['CALIBRATED', 'QUOTATION', 'COMPLETED'].includes(r.status)).length;
  const dispatched = requests.filter((r) => ['DISPATCHED', 'DELIVERED', 'COMPLETED'].includes(r.status)).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
            Calibration Command Center
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Enterprise Metrology & Commercial Management • Welcome, {user?.fullName || 'Operator'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/requests/new">
            <Button variant="primary">
              <Plus className="size-4" /> New Intake Request
            </Button>
          </Link>
          <Link to="/lab/queue">
            <Button variant="secondary">
              <FlaskConical className="size-4" /> Lab Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Work Orders"
          value={isLoading ? '—' : total}
          accentColor="#0274BB"
          subMetrics={[
            { label: 'Standard Priority', value: requests.filter((r) => r.priority === 'NORMAL').length },
            { label: 'Urgent Expedited', value: requests.filter((r) => r.priority === 'URGENT').length, color: '#EF7626' },
          ]}
          footerAction={
            <Link to="/requests" className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1">
              View All Requests <ArrowRight className="size-3" />
            </Link>
          }
        />

        <KPICard
          title="Inward Inspection"
          value={isLoading ? '—' : pendingVerify}
          accentColor="#EF7626"
          subMetrics={[
            { label: 'Awaiting Physical Verification', value: pendingVerify, color: '#EF7626' },
            { label: 'Ready for Metrologist', value: pendingCalibrate },
          ]}
          footerAction={
            <Link to="/lab/queue" className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1">
              Open Inspection Queue <ArrowRight className="size-3" />
            </Link>
          }
        />

        <KPICard
          title="Calibrated (Pass)"
          value={isLoading ? '—' : calibrated}
          accentColor="#16A34A"
          subMetrics={[
            { label: 'ISO Certificates Issued', value: calibrated, color: '#16A34A' },
            { label: 'Commercial Quotations', value: requests.filter((r) => r.status === 'QUOTATION').length },
          ]}
          footerAction={
            <Link to="/commercial/quotations" className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1">
              Commercial Quotations <ArrowRight className="size-3" />
            </Link>
          }
        />

        <KPICard
          title="Dispatched / Delivered"
          value={isLoading ? '—' : dispatched}
          accentColor="#7C3AED"
          subMetrics={[
            { label: 'Outward Gate Passes', value: dispatched },
            { label: 'In Transit / Delivered', value: requests.filter((r) => r.status === 'COMPLETED').length, color: '#16A34A' },
          ]}
          footerAction={
            <Link to="/logistics/dispatches" className="text-xs font-semibold text-[#0274BB] hover:underline flex items-center gap-1">
              Logistics Gate Passes <ArrowRight className="size-3" />
            </Link>
          }
        />
      </div>

      {/* Active Pipeline Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Calibration Pipeline</CardTitle>
            <CardDescription>Recent instruments progressing through the 5-step metrology lifecycle</CardDescription>
          </div>
          <Link to="/requests">
            <Button variant="outlineInk" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F7FA] border-b border-[#E5E7EB] text-[#374151] font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Work Order #</th>
                  <th className="px-6 py-3">Client Account</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Current Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-6 py-4 font-mono font-bold text-[#0274BB]">
                      <Link to={`/requests/${req.id}`} className="hover:underline">
                        {req.request_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#111827]">
                      {req.clients?.client_name || 'Standard Client'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={req.priority === 'URGENT' ? 'warning' : 'secondary'}>
                        {req.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          req.status === 'CREATED'
                            ? 'primary'
                            : req.status === 'VERIFIED'
                            ? 'info'
                            : ['CALIBRATED', 'COMPLETED'].includes(req.status)
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'CREATED' ? (
                        <Link to={`/lab/verification/${req.id}`}>
                          <Button variant="secondary" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      ) : req.status === 'VERIFIED' ? (
                        <Link to={`/lab/calibration/${req.id}`}>
                          <Button variant="primary" size="sm">
                            Calibrate
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/requests/${req.id}`}>
                          <Button variant="outlineInk" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-[#6B7280]">
                      No active calibration work orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
