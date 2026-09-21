// src/super-admin/routes/SuperAdminRoutes.tsx
import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminLayout } from '../components/layout/SuperAdminLayout';
import { PlatformRouteGuard } from './PlatformRouteGuards';

const SuperAdminDashboardPage = lazy(() => import('../pages/SuperAdminDashboardPage'));
const TenantListPage = lazy(() => import('../pages/TenantListPage'));
const TenantDetailPage = lazy(() => import('../pages/TenantDetailPage'));
const TenantOnboardingPage = lazy(() => import('../pages/TenantOnboardingPage'));
const AddOrganizationPage = lazy(() => import('../pages/AddOrganizationPage'));
const PlatformUsersPage = lazy(() => import('../pages/PlatformUsersPage'));
const CreatePlatformUserPage = lazy(() => import('../pages/CreatePlatformUserPage'));
const PlatformAuditPage = lazy(() => import('../pages/PlatformAuditPage'));
const RolePermissionMatrixPage = lazy(() => import('../pages/RolePermissionMatrixPage'));

export const SuperAdminRoutes: React.FC = () => {
  return (
    <PlatformRouteGuard>
      <Routes>
        <Route element={<SuperAdminLayout />}>
          {/* Primary Root Routes */}
          <Route index element={<SuperAdminDashboardPage />} />
          <Route path="dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="tenants" element={<TenantListPage />} />
          <Route
            path="tenants/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <TenantOnboardingPage />
              </PlatformRouteGuard>
            }
          />
          <Route
            path="tenants/:id/organizations/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <AddOrganizationPage />
              </PlatformRouteGuard>
            }
          />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="users" element={<PlatformUsersPage />} />
          <Route path="users/permissions" element={<RolePermissionMatrixPage />} />
          <Route path="permissions" element={<RolePermissionMatrixPage />} />
          <Route
            path="users/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <CreatePlatformUserPage />
              </PlatformRouteGuard>
            }
          />
          <Route path="audit" element={<PlatformAuditPage />} />

          {/* Backward compatibility / alias routes */}
          <Route path="super-admin" element={<SuperAdminDashboardPage />} />
          <Route path="super-admin/tenants" element={<TenantListPage />} />
          <Route
            path="super-admin/tenants/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <TenantOnboardingPage />
              </PlatformRouteGuard>
            }
          />
          <Route
            path="super-admin/tenants/:id/organizations/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <AddOrganizationPage />
              </PlatformRouteGuard>
            }
          />
          <Route path="super-admin/tenants/:id" element={<TenantDetailPage />} />
          <Route path="super-admin/users" element={<PlatformUsersPage />} />
          <Route path="super-admin/users/permissions" element={<RolePermissionMatrixPage />} />
          <Route path="super-admin/permissions" element={<RolePermissionMatrixPage />} />
          <Route
            path="super-admin/users/new"
            element={
              <PlatformRouteGuard requireSuperAdmin>
                <CreatePlatformUserPage />
              </PlatformRouteGuard>
            }
          />
          <Route path="super-admin/audit" element={<PlatformAuditPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </PlatformRouteGuard>
  );
};
