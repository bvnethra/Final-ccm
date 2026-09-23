// src/super-admin/components/ui/StatusBadge.tsx
import React from 'react';
import type { TenantStatus, PlatformUserStatus } from '../../types/superAdmin';

type KnownStatus = TenantStatus | PlatformUserStatus | string;

interface StatusConfig {
  dot: string;
  badge: string;
  label?: string;
}

/**
 * Returns consistent semantic colors for any known status string.
 * Falls back gracefully for unknown statuses.
 */
export function getStatusConfig(status: KnownStatus): StatusConfig {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return {
        dot: 'bg-[#16A34A]',
        badge: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      };
    case 'ONBOARDING':
      return {
        dot: 'bg-[#0274BB]',
        badge: 'bg-[#E6F2FF] text-[#0274BB] border-[#b8dcff]',
        label: 'ONBOARDING',
      };
    case 'SUSPENDED':
      return {
        dot: 'bg-[#F59E0B]',
        badge: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'DEACTIVATED':
    case 'INACTIVE':
      return {
        dot: 'bg-[#9CA3AF]',
        badge: 'bg-[#F5F7FA] text-[#6B7280] border-[#E5E7EB]',
      };
    case 'DELETED':
      return {
        dot: 'bg-[#DC2626]',
        badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]',
      };
    default:
      return {
        dot: 'bg-[#9CA3AF]',
        badge: 'bg-[#F5F7FA] text-[#6B7280] border-[#E5E7EB]',
      };
  }
}

interface StatusBadgeProps {
  status: KnownStatus;
  /** Show the colored dot indicator alongside the label */
  showDot?: boolean;
  className?: string;
}

/**
 * Unified semantic status badge used across tenants, users, and audit events.
 * Combines color + label so status is never conveyed by color alone.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  className = '',
}) => {
  const config = getStatusConfig(status);
  const displayLabel = config.label || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${config.badge} ${className}`}
    >
      {showDot && <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />}
      {displayLabel}
    </span>
  );
};
