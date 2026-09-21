// src/super-admin/hooks/usePlatformAuth.ts
import { useQuery } from '@tanstack/react-query';
import { getCurrentPlatformUser } from '../services/platformAuthService';

export function usePlatformAuth() {
  return useQuery({
    queryKey: ['currentPlatformUser'],
    queryFn: getCurrentPlatformUser,
    staleTime: 5 * 60 * 1000,
  });
}
