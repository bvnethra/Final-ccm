import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

/**
 * Modern Shimmer Skeleton Component
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
 */
export const TableBodySkeleton: React.FC<TableBodySkeletonProps> = ({
  rows = 6,
  columns = 8,
  hasAvatar = true,
  avatarShape = 'square',
  actionCol = true,
}) => {
  const rowList = Array.from({ length: rows });
  const middleColCount = Math.max(0, columns - (hasAvatar ? 1 : 0) - (actionCol ? 1 : 0));
  const widthClasses = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-36'];

  return (
    <>
      {rowList.map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="border-b border-slate-100 last:border-b-0">
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
