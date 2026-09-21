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
  isAdmin: boolean;
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
  const isAdmin = Boolean(user?.roles?.includes('ADMIN') && !user?.isSuperAdmin);

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
            const profile = await getCurrentUserProfile(data.session.user.id);
            setUser(profile);
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
          const profile = await getCurrentUserProfile(session.user.id);
          setUser(profile);
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
        isAdmin,
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
