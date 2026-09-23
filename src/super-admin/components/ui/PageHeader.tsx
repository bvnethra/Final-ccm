// src/super-admin/components/ui/PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Optional bottom border — defaults to true */
  bordered?: boolean;
}

/**
 * Consistent page-level heading used across all Super Admin pages.
 * Provides a single h1, optional description, and right-aligned action slot.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  bordered = true,
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        bordered ? 'border-b border-[#E5E7EB] pb-4' : ''
      }`}
    >
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {description && (
          <p className="text-[#6B7280] text-xs mt-1 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
