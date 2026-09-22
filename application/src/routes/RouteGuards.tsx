// application/src/routes/RouteGuards.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import type { PermissionLevel } from '../types/auth';

export function getRequiredModuleForLocation(pathname: string): { moduleCode: string; level: PermissionLevel; altModuleCode?: string } | null {
  if (pathname.includes('/commercial/quotations/new')) return { moduleCode: 'CREATE_QUOTATION', level: 'CREATE' };
  if (pathname.includes('/commercial/quotations')) return { moduleCode: 'CREATE_QUOTATION', level: 'VIEW' };
  if (pathname.includes('/commercial/invoices')) return { moduleCode: 'CREATE_INVOICE', level: 'VIEW' };
  if (pathname.includes('/commercial/vendor-pos') || pathname.includes('/lab/vendor-pos')) {
    return { moduleCode: 'RAISE_PO_VENDOR_OUTSOURCING', level: 'VIEW', altModuleCode: 'RECORD_CALIBRATION_FREQUENCY' };
  }
  if (pathname.includes('/lab/due-list')) return { moduleCode: 'CALIBRATION_DUE_LIST', level: 'VIEW' };
  if (pathname.includes('/lab/calibration')) return { moduleCode: 'RECORD_CALIBRATION_FREQUENCY', level: 'VIEW' };
  if (pathname.includes('/lab/verification')) return { moduleCode: 'LAB_VERIFICATION_RECEIPT', level: 'VIEW' };
  if (pathname.includes('/lab/queue')) {
    return { moduleCode: 'LAB_VERIFICATION_RECEIPT', level: 'VIEW', altModuleCode: 'RECORD_CALIBRATION_FREQUENCY' };
  }
  if (pathname.includes('/requests/new') || pathname.includes('/logistics/dispatch/new')) {
    return { moduleCode: 'CREATE_REQUEST', level: 'CREATE' };
  }
  if (pathname.includes('/requests') || pathname.includes('/logistics/dispatch') || pathname.includes('/logistics/dispatches')) {
    return { moduleCode: 'CREATE_REQUEST', level: 'VIEW' };
  }
  if (pathname.includes('/roles') || pathname.includes('/logs')) {
    return { moduleCode: 'ROLE_PERMISSION_MANAGEMENT', level: 'VIEW' };
  }
  if (
    pathname.includes('/masters/clients/new') ||
    pathname.includes('/masters/vendors/new') ||
    pathname.includes('/masters/items/new') ||
    pathname.includes('/clients/new') ||
    pathname.includes('/vendors/new') ||
    pathname.includes('/items/new') ||
    pathname.endsWith('/edit')
  ) {
    return { moduleCode: 'CLIENT_VENDOR_ITEM_MASTER', level: 'CREATE' };
  }
  if (
    pathname.includes('/masters/clients') ||
    pathname.includes('/masters/vendors') ||
    pathname.includes('/masters/items')
  ) {
    return { moduleCode: 'CLIENT_VENDOR_ITEM_MASTER', level: 'VIEW' };
  }
  return null;
}

export function getDefaultRouteForUser(canPerform: (mod: string, lvl?: PermissionLevel) => boolean): string {
  if (canPerform('CREATE_REQUEST', 'VIEW')) return '/requests';
  if (canPerform('LAB_VERIFICATION_RECEIPT', 'VIEW') || canPerform('RECORD_CALIBRATION_FREQUENCY', 'VIEW')) return '/lab/queue';
  if (canPerform('CALIBRATION_DUE_LIST', 'VIEW')) return '/lab/due-list';
  if (canPerform('CREATE_QUOTATION', 'VIEW')) return '/commercial/quotations';
  if (canPerform('CREATE_INVOICE', 'VIEW')) return '/commercial/invoices';
  if (canPerform('CLIENT_VENDOR_ITEM_MASTER', 'VIEW')) return '/masters/clients';
  if (canPerform('ROLE_PERMISSION_MANAGEMENT', 'VIEW')) return '/roles';
  return '/login';
}

/**
 * Clean, declarative route guard enforcing module permissions.
 */
export const RequireModulePermission: React.FC<{
  moduleCode: string;
  level?: PermissionLevel;
  allowAlternativeModule?: string;
  children: React.ReactNode;
}> = ({ moduleCode, level = 'VIEW', allowAlternativeModule, children }) => {
  const { isSuperAdmin, canPerform, isLoading } = useAuthContext();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  const hasPerm =
    canPerform(moduleCode, level) ||
    (allowAlternativeModule ? canPerform(allowAlternativeModule, level) : false);

  if (!hasPerm) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

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
  const { hasPermission, canPerform, isLoading } = useAuthContext();

  if (isLoading) return null;

  const permitted = permission.includes(':')
    ? canPerform(permission.split(':')[0], permission.split(':')[1] as PermissionLevel)
    : hasPermission(permission);

  if (!permitted) {
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
 * Route guard that validates access against live module permissions.
 */
export const DisallowCollectionAgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, canPerform, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  const req = getRequiredModuleForLocation(location.pathname);
  if (req && !canPerform(req.moduleCode, req.level)) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard that validates access against live module permissions.
 */
export const DisallowLabEntryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, canPerform, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  const req = getRequiredModuleForLocation(location.pathname);
  if (req && !canPerform(req.moduleCode, req.level)) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard that validates access against live module permissions.
 * Prevents Approvers from generating draft quotations (Maker-Checker separation).
 */
export const DisallowLabApproverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, canPerform, getPermissionLevel, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  // Approvers approve quotations; they do not create draft quotations (Maker-Checker)
  if (location.pathname.includes('/commercial/quotations/new')) {
    const permLevel = getPermissionLevel('CREATE_QUOTATION');
    if (permLevel === 'APPROVE') {
      return <Navigate to="/commercial/quotations" replace />;
    }
  }

  const req = getRequiredModuleForLocation(location.pathname);
  if (req && !canPerform(req.moduleCode, req.level)) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard that validates access against live module permissions.
 */
export const DisallowAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, canPerform, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  const req = getRequiredModuleForLocation(location.pathname);
  if (req && !canPerform(req.moduleCode, req.level)) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard requiring Master creation or editing permissions.
 */
export const RequireMasterEditRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSuperAdmin, canPerform, isLoading } = useAuthContext();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  if (!canPerform('CLIENT_VENDOR_ITEM_MASTER', 'CREATE')) {
    return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
  }

  return <>{children}</>;
};

/**
 * Root dashboard redirect based on active operational permissions.
 */
export const DashboardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canPerform, isLoading, isSuperAdmin } = useAuthContext();

  if (isLoading) return null;
  if (isSuperAdmin) return <>{children}</>;

  return <Navigate to={getDefaultRouteForUser(canPerform)} replace />;
};
