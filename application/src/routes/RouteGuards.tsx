// application/src/routes/RouteGuards.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-sm text-[#6B7280]">
          <div className="size-6 border-2 border-[#0274BB] border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Operator Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const PermissionRoute: React.FC<{
  permission: string;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { hasPermission, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (!hasPermission(permission)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-3">
        <div className="p-4 bg-[#fef2f2] border border-[#DC2626]/30 text-[#DC2626] rounded-[4px]">
          <h3 className="font-bold text-base">Access Restricted</h3>
          <p className="text-xs mt-1">
            Your role does not possess the <code>{permission}</code> permission required to access this operational screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Route guard that prevents Collection Agent from accessing screens outside
 * their designated role scope (only Client, Vendor, Item Master view, and Create/View Requests).
 */
export const DisallowCollectionAgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollectionAgent, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (isCollectionAgent) {
    return <Navigate to="/requests" replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard that prevents Lab Entry Person from accessing screens outside
 * their designated role scope (only Client, Vendor, Calibration Due List view, Lab Queue/Verification,
 * Record Calibration, Invoices, Service Flag, Outsource PO).
 */
export const DisallowLabEntryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLabEntryPerson, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (isLabEntryPerson) {
    return <Navigate to="/lab/queue" replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard that prevents Lab Approver from accessing screens outside
 * their designated role scope (only Client, Vendor, Item Master view, Request view,
 * Lab Verification/Proof view, Calibration frequency view, Invoice view, Outsource PO view,
 * and Repair/Quotation approval).
 */
export const DisallowLabApproverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLabApprover, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (isLabApprover) {
    return <Navigate to="/lab/queue" replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard preventing view-only roles (Collection Agent, Lab Entry Person, Lab Approver)
 * from accessing Master creation or editing screens.
 */
export const RequireMasterEditRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollectionAgent, isLabEntryPerson, isLabApprover, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (isCollectionAgent) {
    return <Navigate to="/requests" replace />;
  }
  if (isLabEntryPerson || isLabApprover) {
    return <Navigate to="/lab/queue" replace />;
  }

  return <>{children}</>;
};

/**
 * Root dashboard redirect:
 * - Collection Agent -> /requests
 * - Lab Entry Person -> /lab/queue
 * - Lab Approver -> /lab/queue
 * - Others -> DashboardPage
 */
export const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCollectionAgent, isLabEntryPerson, isLabApprover, isLoading } = useAuthContext();

  if (isLoading) return null;

  if (isCollectionAgent) {
    return <Navigate to="/requests" replace />;
  }
  if (isLabEntryPerson || isLabApprover) {
    return <Navigate to="/lab/queue" replace />;
  }

  return <>{children}</>;
};
