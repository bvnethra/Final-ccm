// application/src/routes/index.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  ProtectedRoute,
  DisallowCollectionAgentRoute,
  DisallowLabEntryRoute,
  DisallowLabApproverRoute,
  DisallowAdminRoute,
  RequireMasterEditRoute,
  DashboardRoute,
} from './RouteGuards';
import { AppLayout } from '../components/layout/AppLayout';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const RolePermissionPage = lazy(() => import('../pages/roles/RolePermissionPage'));
const RequestListPage = lazy(() => import('../pages/requests/RequestListPage'));
const NewRequestPage = lazy(() => import('../pages/requests/NewRequestPage'));
const RequestDetailPage = lazy(() => import('../pages/requests/RequestDetailPage'));
const LabQueuePage = lazy(() => import('../pages/lab/LabQueuePage'));
const VerificationPage = lazy(() => import('../pages/lab/VerificationPage'));
const CalibrationPage = lazy(() => import('../pages/lab/CalibrationPage'));
const CalibrationDueListPage = lazy(() => import('../pages/lab/CalibrationDueListPage'));
const QuotationListPage = lazy(() => import('../pages/commercial/QuotationListPage'));
const QuotationBuilderPage = lazy(() => import('../pages/commercial/QuotationBuilderPage'));
const InvoiceListPage = lazy(() => import('../pages/commercial/InvoiceListPage'));
const DispatchListPage = lazy(() => import('../pages/logistics/DispatchListPage'));
const DispatchBuilderPage = lazy(() => import('../pages/logistics/DispatchBuilderPage'));
const ClientListPage = lazy(() => import('../pages/masters/ClientListPage'));
const ClientCreatePage = lazy(() => import('../pages/masters/ClientCreatePage'));
const ClientDetailPage = lazy(() => import('../pages/masters/ClientDetailPage'));
const ClientEditPage = lazy(() => import('../pages/masters/ClientEditPage'));
const VendorListPage = lazy(() => import('../pages/masters/VendorListPage'));
const VendorCreatePage = lazy(() => import('../pages/masters/VendorCreatePage'));
const VendorDetailPage = lazy(() => import('../pages/masters/VendorDetailPage'));
const VendorEditPage = lazy(() => import('../pages/masters/VendorEditPage'));
const ItemMasterListPage = lazy(() => import('../pages/masters/ItemMasterListPage'));
const ItemMasterCreatePage = lazy(() => import('../pages/masters/ItemMasterCreatePage'));
const ItemMasterDetailPage = lazy(() => import('../pages/masters/ItemMasterDetailPage'));
const ItemMasterEditPage = lazy(() => import('../pages/masters/ItemMasterEditPage'));

const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center text-[#6B7280] font-sans text-xs">
    <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin mr-2" />
    Loading view...
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Operational Application Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard: Redirects Collection Agent to /requests, Lab Entry & Approver to /lab/queue */}
          <Route
            index
            element={
              <DashboardRoute>
                <DashboardPage />
              </DashboardRoute>
            }
          />

          {/* Master Data: Client Master */}
          <Route path="masters/clients" element={<ClientListPage />} />
          <Route
            path="masters/clients/new"
            element={
              <RequireMasterEditRoute>
                <ClientCreatePage />
              </RequireMasterEditRoute>
            }
          />
          <Route path="masters/clients/:id" element={<ClientDetailPage />} />
          <Route
            path="masters/clients/:id/edit"
            element={
              <RequireMasterEditRoute>
                <ClientEditPage />
              </RequireMasterEditRoute>
            }
          />

          {/* Master Data: Vendor Master */}
          <Route path="masters/vendors" element={<VendorListPage />} />
          <Route
            path="masters/vendors/new"
            element={
              <RequireMasterEditRoute>
                <VendorCreatePage />
              </RequireMasterEditRoute>
            }
          />
          <Route path="masters/vendors/:id" element={<VendorDetailPage />} />
          <Route
            path="masters/vendors/:id/edit"
            element={
              <RequireMasterEditRoute>
                <VendorEditPage />
              </RequireMasterEditRoute>
            }
          />

          {/* Master Data: Item Master (Hidden/Blocked for Lab Entry Person, View only for Lab Approver) */}
          <Route
            path="masters/items"
            element={
              <DisallowLabEntryRoute>
                <ItemMasterListPage />
              </DisallowLabEntryRoute>
            }
          />
          <Route
            path="masters/items/new"
            element={
              <RequireMasterEditRoute>
                <DisallowLabEntryRoute>
                  <ItemMasterCreatePage />
                </DisallowLabEntryRoute>
              </RequireMasterEditRoute>
            }
          />
          <Route
            path="masters/items/:id"
            element={
              <DisallowLabEntryRoute>
                <ItemMasterDetailPage />
              </DisallowLabEntryRoute>
            }
          />
          <Route
            path="masters/items/:id/edit"
            element={
              <RequireMasterEditRoute>
                <DisallowLabEntryRoute>
                  <ItemMasterEditPage />
                </DisallowLabEntryRoute>
              </RequireMasterEditRoute>
            }
          />

          {/* Master Data: Role & Permission Management (Admin & Super Admin) */}
          <Route path="roles" element={<RolePermissionPage />} />

          {/* Process 1: Equipment Inward (Blocked for Lab Entry Person, Creation blocked for Lab Approver & Admin) */}
          <Route
            path="requests"
            element={
              <DisallowLabEntryRoute>
                <RequestListPage />
              </DisallowLabEntryRoute>
            }
          />
          <Route
            path="requests/new"
            element={
              <DisallowLabEntryRoute>
                <DisallowLabApproverRoute>
                  <DisallowAdminRoute>
                    <NewRequestPage />
                  </DisallowAdminRoute>
                </DisallowLabApproverRoute>
              </DisallowLabEntryRoute>
            }
          />
          <Route path="requests/:id" element={<RequestDetailPage />} />

          {/* Process 2 & 3: Lab Inspection & Calibration */}
          <Route
            path="lab/queue"
            element={
              <DisallowCollectionAgentRoute>
                <LabQueuePage />
              </DisallowCollectionAgentRoute>
            }
          />
          <Route
            path="lab/verification/:requestId"
            element={
              <DisallowCollectionAgentRoute>
                <VerificationPage />
              </DisallowCollectionAgentRoute>
            }
          />
          <Route
            path="lab/calibration/:requestId"
            element={
              <DisallowCollectionAgentRoute>
                <CalibrationPage />
              </DisallowCollectionAgentRoute>
            }
          />
          <Route
            path="lab/due-list"
            element={
              <DisallowCollectionAgentRoute>
                <DisallowLabApproverRoute>
                  <CalibrationDueListPage />
                </DisallowLabApproverRoute>
              </DisallowCollectionAgentRoute>
            }
          />

          {/* Process 4: Commercial Quotations & Billing */}
          <Route
            path="commercial/quotations"
            element={
              <DisallowCollectionAgentRoute>
                <QuotationListPage />
              </DisallowCollectionAgentRoute>
            }
          />
          <Route
            path="commercial/quotations/new"
            element={
              <DisallowCollectionAgentRoute>
                <DisallowLabApproverRoute>
                  <DisallowAdminRoute>
                    <QuotationBuilderPage />
                  </DisallowAdminRoute>
                </DisallowLabApproverRoute>
              </DisallowCollectionAgentRoute>
            }
          />
          <Route
            path="commercial/invoices"
            element={
              <DisallowCollectionAgentRoute>
                <InvoiceListPage />
              </DisallowCollectionAgentRoute>
            }
          />

          {/* Process 5: Logistics & Gate Pass Dispatch (Blocked for Admin, Collection Agent, Lab Entry, Lab Approver) */}
          <Route
            path="logistics/dispatches"
            element={
              <DisallowAdminRoute>
                <DisallowCollectionAgentRoute>
                  <DisallowLabEntryRoute>
                    <DisallowLabApproverRoute>
                      <DispatchListPage />
                    </DisallowLabApproverRoute>
                  </DisallowLabEntryRoute>
                </DisallowCollectionAgentRoute>
              </DisallowAdminRoute>
            }
          />
          <Route
            path="logistics/dispatch"
            element={
              <DisallowAdminRoute>
                <DisallowCollectionAgentRoute>
                  <DisallowLabEntryRoute>
                    <DisallowLabApproverRoute>
                      <DispatchListPage />
                    </DisallowLabApproverRoute>
                  </DisallowLabEntryRoute>
                </DisallowCollectionAgentRoute>
              </DisallowAdminRoute>
            }
          />
          <Route
            path="logistics/dispatch/new"
            element={
              <DisallowAdminRoute>
                <DisallowCollectionAgentRoute>
                  <DisallowLabEntryRoute>
                    <DisallowLabApproverRoute>
                      <DispatchBuilderPage />
                    </DisallowLabApproverRoute>
                  </DisallowLabEntryRoute>
                </DisallowCollectionAgentRoute>
              </DisallowAdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
