// application/src/routes/index.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  ProtectedRoute,
  RequireModulePermission,
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
const EquipmentDetailPage = lazy(() => import('../pages/lab/EquipmentDetailPage'));
const CalibrationDueListPage = lazy(() => import('../pages/lab/CalibrationDueListPage'));
const QuotationListPage = lazy(() => import('../pages/commercial/QuotationListPage'));
const QuotationBuilderPage = lazy(() => import('../pages/commercial/QuotationBuilderPage'));
const QuotationDetailPage = lazy(() => import('../pages/commercial/QuotationDetailPage'));
const InvoiceListPage = lazy(() => import('../pages/commercial/InvoiceListPage'));
const TaxInvoiceDetailPage = lazy(() => import('../pages/commercial/TaxInvoiceDetailPage'));
const VendorPODetailPage = lazy(() => import('../pages/commercial/VendorPODetailPage'));
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
const ItemRoutingPage = lazy(() => import('../pages/operations/ItemRoutingPage'));
const AuditLogsPage = lazy(() => import('../pages/audit/AuditLogsPage'));

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
          {/* Dashboard: Redirects to primary operational landing page based on user permissions */}
          <Route
            index
            element={
              <DashboardRoute>
                <DashboardPage />
              </DashboardRoute>
            }
          />

          {/* Master Data: Client Master */}
          <Route
            path="masters/clients"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <ClientListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/clients/new"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <ClientCreatePage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/clients/:id"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <ClientDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/clients/:id/edit"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <ClientEditPage />
              </RequireModulePermission>
            }
          />

          {/* Master Data: Vendor Master */}
          <Route
            path="masters/vendors"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <VendorListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/vendors/new"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <VendorCreatePage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/vendors/:id"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <VendorDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/vendors/:id/edit"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <VendorEditPage />
              </RequireModulePermission>
            }
          />

          {/* Master Data: Item Master */}
          <Route
            path="masters/items"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <ItemMasterListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/items/new"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <ItemMasterCreatePage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/items/:id"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="VIEW">
                <ItemMasterDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="masters/items/:id/edit"
            element={
              <RequireModulePermission moduleCode="CLIENT_VENDOR_ITEM_MASTER" level="CREATE">
                <ItemMasterEditPage />
              </RequireModulePermission>
            }
          />

          {/* Master Data: Role & Permission Management */}
          <Route
            path="roles"
            element={
              <RequireModulePermission moduleCode="ROLE_PERMISSION_MANAGEMENT" level="VIEW">
                <RolePermissionPage />
              </RequireModulePermission>
            }
          />

          {/* Activity History & Audit Logs */}
          <Route
            path="logs"
            element={
              <RequireModulePermission moduleCode="ROLE_PERMISSION_MANAGEMENT" level="VIEW">
                <AuditLogsPage />
              </RequireModulePermission>
            }
          />

          {/* Process 1: Equipment Inward */}
          <Route
            path="requests"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="VIEW">
                <RequestListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="requests/new"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="CREATE">
                <NewRequestPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="requests/:id"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="VIEW">
                <RequestDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="requests/:id/routing"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="VIEW">
                <ItemRoutingPage />
              </RequireModulePermission>
            }
          />

          {/* Process 2 & 3: Lab Inspection & Calibration */}
          <Route
            path="lab/queue"
            element={
              <RequireModulePermission
                moduleCode="LAB_VERIFICATION_RECEIPT"
                level="VIEW"
                allowAlternativeModule="RECORD_CALIBRATION_FREQUENCY"
              >
                <LabQueuePage />
              </RequireModulePermission>
            }
          />
          <Route
            path="lab/verification/:requestId"
            element={
              <RequireModulePermission moduleCode="LAB_VERIFICATION_RECEIPT" level="VIEW">
                <VerificationPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="lab/calibration/:requestId"
            element={
              <RequireModulePermission moduleCode="RECORD_CALIBRATION_FREQUENCY" level="VIEW">
                <CalibrationPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="lab/calibration/:requestId/equipment/:itemId"
            element={
              <RequireModulePermission moduleCode="RECORD_CALIBRATION_FREQUENCY" level="VIEW">
                <EquipmentDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="lab/due-list"
            element={
              <RequireModulePermission moduleCode="CALIBRATION_DUE_LIST" level="VIEW">
                <CalibrationDueListPage />
              </RequireModulePermission>
            }
          />

          {/* Process 4: Commercial Quotations & Billing */}
          <Route
            path="commercial/quotations"
            element={
              <RequireModulePermission moduleCode="CREATE_QUOTATION" level="VIEW">
                <QuotationListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/quotations/new"
            element={
              <RequireModulePermission moduleCode="CREATE_QUOTATION" level="CREATE">
                <QuotationBuilderPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/quotations/:id"
            element={
              <RequireModulePermission moduleCode="CREATE_QUOTATION" level="VIEW">
                <QuotationDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/quotations/:id/view"
            element={
              <RequireModulePermission moduleCode="CREATE_QUOTATION" level="VIEW">
                <QuotationDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/invoices"
            element={
              <RequireModulePermission moduleCode="CREATE_INVOICE" level="VIEW">
                <InvoiceListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/invoices/:id"
            element={
              <RequireModulePermission moduleCode="CREATE_INVOICE" level="VIEW">
                <TaxInvoiceDetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="commercial/vendor-pos/:id"
            element={
              <RequireModulePermission
                moduleCode="RAISE_PO_VENDOR_OUTSOURCING"
                level="VIEW"
                allowAlternativeModule="RECORD_CALIBRATION_FREQUENCY"
              >
                <VendorPODetailPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="lab/vendor-pos/:id"
            element={
              <RequireModulePermission
                moduleCode="RAISE_PO_VENDOR_OUTSOURCING"
                level="VIEW"
                allowAlternativeModule="RECORD_CALIBRATION_FREQUENCY"
              >
                <VendorPODetailPage />
              </RequireModulePermission>
            }
          />

          {/* Process 5: Logistics & Gate Pass Dispatch */}
          <Route
            path="logistics/dispatches"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="VIEW">
                <DispatchListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="logistics/dispatch"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="VIEW">
                <DispatchListPage />
              </RequireModulePermission>
            }
          />
          <Route
            path="logistics/dispatch/new"
            element={
              <RequireModulePermission moduleCode="CREATE_REQUEST" level="CREATE">
                <DispatchBuilderPage />
              </RequireModulePermission>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
