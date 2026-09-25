import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

/**
 * Modern Shimmer Skeleton Component
 * Provides smooth pulse and gradient shimmer animations.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 relative overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-none',
        variant === 'rounded' && 'rounded-md',
        className
      )}
      {...props}
    />
  );
};

export interface TableBodySkeletonProps {
  rows?: number;
  columns?: number;
  hasAvatar?: boolean;
  avatarShape?: 'square' | 'circle';
  actionCol?: boolean;
}

/**
 * TableBodySkeleton
 * Drop-in skeleton loader inside any standard <tbody> component.
 * Dynamically computes cells matching the table schema.
 */
export const TableBodySkeleton: React.FC<TableBodySkeletonProps> = ({
  rows = 6,
  columns = 8,
  hasAvatar = true,
  avatarShape = 'square',
  actionCol = true,
}) => {
  const rowList = Array.from({ length: rows });
  // Number of regular data columns between first column and actions column
  const middleColCount = Math.max(0, columns - (hasAvatar ? 1 : 0) - (actionCol ? 1 : 0));

  // Varied widths for realistic layout simulation
  const widthClasses = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-36'];

  return (
    <>
      {rowList.map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="border-b border-slate-100 last:border-b-0">
          {/* Column 1: Info with Avatar & Primary Text */}
          {hasAvatar && (
            <td className="px-5 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <Skeleton
                  className={cn(
                    'size-10 shrink-0 bg-slate-200/90',
                    avatarShape === 'circle' ? 'rounded-full' : 'rounded-lg'
                  )}
                />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className={cn('h-4 bg-slate-200', rIdx % 2 === 0 ? 'w-36' : 'w-44')} />
                  <Skeleton className="h-3 w-20 bg-slate-100" />
                </div>
              </div>
            </td>
          )}

          {/* Middle Columns: Text/Badges/Metrics */}
          {Array.from({ length: middleColCount }).map((_, cIdx) => {
            const wClass = widthClasses[(rIdx + cIdx) % widthClasses.length];
            const isBadge = (cIdx + rIdx) % 3 === 0;

            return (
              <td key={`skeleton-cell-${rIdx}-${cIdx}`} className="px-5 py-4 whitespace-nowrap">
                {isBadge ? (
                  <Skeleton className="h-6 w-20 rounded-full bg-slate-200/70" />
                ) : (
                  <div className="space-y-1">
                    <Skeleton className={cn('h-3.5 bg-slate-200/80', wClass)} />
                    {cIdx === 0 && <Skeleton className="h-2.5 w-16 bg-slate-100" />}
                  </div>
                )}
              </td>
            );
          })}

          {/* Action Column */}
          {actionCol && (
            <td className="px-5 py-4 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="size-8 rounded-lg bg-slate-200/60" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

export interface DetailViewSkeletonProps {
  columns?: number;
  rows?: number;
  cardsCount?: number;
}

/**
 * DetailViewSkeleton
 * Full-page skeleton for detail views with metric cards and equipment tables.
 */
export const DetailViewSkeleton: React.FC<DetailViewSkeletonProps> = ({
  columns = 6,
  rows = 4,
  cardsCount = 4,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div key={`stat-skeleton-${i}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Table Container Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-100">
              <TableBodySkeleton rows={rows} columns={columns} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

