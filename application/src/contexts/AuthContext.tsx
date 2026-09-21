// application/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUserProfile, loginWithCredentials, logoutUser } from '../services/authService';
import type { AuthUser } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCollectionAgent: boolean;
  isLabEntryPerson: boolean;
  isLabApprover: boolean;
  tenantId: string | undefined;
  organizationId: string | undefined;
  hasPermission: (permissionCode: string) => boolean;
  login: (email: string, pass: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isCollectionAgent = Boolean(user?.roles?.includes('COLLECTION_AGENT') && !user?.isSuperAdmin);
  const isLabEntryPerson = Boolean(user?.roles?.includes('LAB_ENTRY_PERSON') && !user?.isSuperAdmin);
  const isLabApprover = Boolean(user?.roles?.includes('LAB_APPROVER') && !user?.isSuperAdmin);

  useEffect(() => {
    // 1. Initial Session Check directly from live Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        getCurrentUserProfile(session.user.id)
          .then(setUser)
          .catch(() => setUser(null))
          .finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // 2. Live Supabase Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getCurrentUserProfile(session.user.id).then(setUser).catch(() => setUser(null));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<AuthUser> => {
    const authenticatedUser = await loginWithCredentials(email, pass);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin || user.permissions.includes('*')) return true;

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
        isCollectionAgent,
        isLabEntryPerson,
        isLabApprover,
        tenantId: user?.tenantId,
        organizationId: user?.organizationId,
        hasPermission,
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
