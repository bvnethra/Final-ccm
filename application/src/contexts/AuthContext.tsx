// application/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUserProfile, loginWithCredentials, logoutUser } from '../services/authService';
import type { AuthUser, PermissionLevel } from '../types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isCollectionAgent: boolean;
  isLabEntryPerson: boolean;
  isLabApprover: boolean;
  isAdmin: boolean;
  tenantId: string | undefined;
  tenantName: string | undefined;
  organizationId: string | undefined;
  organizationName: string | undefined;
  enterpriseName: string;
  hasPermission: (permissionCode: string) => boolean;
  canPerform: (moduleCode: string, requiredLevel?: PermissionLevel) => boolean;
  getPermissionLevel: (moduleCode: string) => PermissionLevel;
  refreshPermissions: () => Promise<void>;
  login: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Derived role booleans — read from dynamic roles array loaded from DB
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const isCollectionAgent = Boolean(user?.roles?.includes('COLLECTION_AGENT') && !isSuperAdmin);
  const isLabEntryPerson = Boolean(user?.roles?.includes('LAB_ENTRY_PERSON') && !isSuperAdmin);
  const isLabApprover = Boolean(user?.roles?.includes('LAB_APPROVER') && !isSuperAdmin);
  const isAdmin = Boolean(user?.roles?.includes('ADMIN') && !isSuperAdmin);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getCurrentUserProfile(userId);
      setUser(profile);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // 0. Check for cross-app SSO handoff from Super Admin (localhost:5173)
    const urlParams = new URLSearchParams(window.location.search);
    const crossAccessToken = urlParams.get('access_token');
    const crossRefreshToken = urlParams.get('refresh_token');

    const initAuth = async () => {
      if (crossAccessToken && crossRefreshToken) {
        try {
          const { data } = await supabase.auth.setSession({
            access_token: crossAccessToken,
            refresh_token: crossRefreshToken,
          });
          urlParams.delete('access_token');
          urlParams.delete('refresh_token');
          const cleanUrl =
            window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
          window.history.replaceState({}, '', cleanUrl);

          if (data?.session?.user) {
            await loadUserProfile(data.session.user.id);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to set cross-app session:', err);
        }
      }

      // 1. Initial Session Check directly from live Supabase Auth
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // 2. Live Supabase Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const login = async (email: string, pass: string): Promise<AuthUser> => {
    const authenticatedUser = await loginWithCredentials(email, pass);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  // ── Allows the app to re-fetch permissions from DB without a full page reload ──
  // Useful after super admin changes a role's permissions
  const refreshPermissions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  }, [loadUserProfile]);

  const LEVEL_RANK: Record<PermissionLevel, number> = {
    NONE: 0,
    VIEW: 1,
    CREATE: 2,
    CREATE_EDIT: 3,
    APPROVE: 4,
  };

  const getPermissionLevel = (moduleCode: string): PermissionLevel => {
    if (!user) return 'NONE';
    if (user.isSuperAdmin) return 'APPROVE';
    return user.modulePermissions?.[moduleCode] || 'NONE';
  };

  const canPerform = (moduleCode: string, requiredLevel: PermissionLevel = 'VIEW'): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    const userLevel = user.modulePermissions?.[moduleCode] || 'NONE';
    const userRank = LEVEL_RANK[userLevel] ?? 0;
    const requiredRank = LEVEL_RANK[requiredLevel] ?? 0;
    return userRank >= requiredRank;
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin || user.permissions.includes('*')) return true;

    // Direct module code check against live modulePermissions
    if (permissionCode.includes(':')) {
      const [mod, lvl] = permissionCode.split(':');
      return canPerform(mod, lvl as PermissionLevel);
    }
    if (user.modulePermissions?.[permissionCode] !== undefined) {
      return canPerform(permissionCode, 'VIEW');
    }

    const targetNormalized = permissionCode.toUpperCase().replace(/\./g, '_');
    return user.permissions.some((p) => {
      const userPermNormalized = p.toUpperCase().replace(/\./g, '_');
      return userPermNormalized === targetNormalized || p === permissionCode;
    });
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isSuperAdmin,
        isCollectionAgent,
        isLabEntryPerson,
        isLabApprover,
        isAdmin,
        tenantId: user?.tenantId,
        tenantName: user?.tenantName,
        organizationId: user?.organizationId,
        organizationName: user?.organizationName,
        enterpriseName: user?.tenantName || user?.organizationName || 'Nethra Metrology Services Ltd',
        hasPermission,
        canPerform,
        getPermissionLevel,
        refreshPermissions,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
