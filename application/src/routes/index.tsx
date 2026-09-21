// application/src/routes/index.tsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './RouteGuards';
import { AppLayout } from '../components/layout/AppLayout';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const RequestListPage = lazy(() => import('../pages/requests/RequestListPage'));
const NewRequestPage = lazy(() => import('../pages/requests/NewRequestPage'));
const RequestDetailPage = lazy(() => import('../pages/requests/RequestDetailPage'));
const LabQueuePage = lazy(() => import('../pages/lab/LabQueuePage'));
const VerificationPage = lazy(() => import('../pages/lab/VerificationPage'));
const CalibrationPage = lazy(() => import('../pages/lab/CalibrationPage'));
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
          <Route index element={<DashboardPage />} />

          {/* Master Data: Client Master */}
          <Route path="masters/clients" element={<ClientListPage />} />
          <Route path="masters/clients/new" element={<ClientCreatePage />} />
          <Route path="masters/clients/:id" element={<ClientDetailPage />} />
          <Route path="masters/clients/:id/edit" element={<ClientEditPage />} />

          {/* Master Data: Vendor Master */}
          <Route path="masters/vendors" element={<VendorListPage />} />
          <Route path="masters/vendors/new" element={<VendorCreatePage />} />
          <Route path="masters/vendors/:id" element={<VendorDetailPage />} />
          <Route path="masters/vendors/:id/edit" element={<VendorEditPage />} />

          {/* Master Data: Item Master */}
          <Route path="masters/items" element={<ItemMasterListPage />} />
          <Route path="masters/items/new" element={<ItemMasterCreatePage />} />
          <Route path="masters/items/:id" element={<ItemMasterDetailPage />} />
          <Route path="masters/items/:id/edit" element={<ItemMasterEditPage />} />

          {/* Process 1: Equipment Intake */}
          <Route path="requests" element={<RequestListPage />} />
          <Route path="requests/new" element={<NewRequestPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />

          {/* Process 2 & 3: Lab Inspection & Calibration */}
          <Route path="lab/queue" element={<LabQueuePage />} />
          <Route path="lab/verification/:requestId" element={<VerificationPage />} />
          <Route path="lab/calibration/:requestId" element={<CalibrationPage />} />

          {/* Process 4: Commercial Quotations & Billing */}
          <Route path="commercial/quotations" element={<QuotationListPage />} />
          <Route path="commercial/quotations/new" element={<QuotationBuilderPage />} />
          <Route path="commercial/invoices" element={<InvoiceListPage />} />

          {/* Process 5: Logistics & Gate Pass Dispatch */}
          <Route path="logistics/dispatches" element={<DispatchListPage />} />
          <Route path="logistics/dispatch/new" element={<DispatchBuilderPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
