// src/components/ui/UIPrimitives.tsx
import React from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

// ==========================================
// 1. Cards & Containers (CCM Design System Section 4)
// ==========================================
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-[#E5E7EB] bg-white text-[#111827] shadow-sm transition-all',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 border-b border-[#E5E7EB]', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-tight text-[#111827]', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[#6B7280] leading-relaxed', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 border-t border-[#E5E7EB]', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/**
 * Nethra CCM KPI Card Primitive (Section 4.1 & 4.2)
 */
export interface KPICardProps {
  title: string;
  value: string | number;
  subMetrics?: { label: string; value: string | number; color?: string }[];
  footerAction?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subMetrics = [],
  footerAction,
  accentColor = '#0274BB',
  className,
}) => {
  return (
    <Card className={cn('overflow-hidden relative flex flex-col justify-between border-[#E5E7EB]', className)}>
      <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{title}</span>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111827] mt-2 mb-4">
            {value}
          </div>
        </div>

        {subMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#E5E7EB] mt-auto">
            {subMetrics.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[11px] text-[#6B7280] font-medium">{m.label}</span>
                <span className="text-sm font-semibold text-[#111827]" style={{ color: m.color }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {footerAction && (
        <div className="px-6 py-3 bg-[#F5F7FA] border-t border-[#E5E7EB] flex items-center justify-between">
          {footerAction}
        </div>
      )}
    </Card>
  );
};

// ==========================================
// 2. Button Primitive (CCM Design System Section 3)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'outlineInk'
    | 'success'
    | 'warning'
    | 'danger'
    | 'destructive'
    | 'successOutline'
    | 'warningOutline'
    | 'dangerOutline'
    | 'ghost'
    | 'default'
    | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    // 8px base grid + rounded-md (4px as per Section 7.3)
    const base =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0274BB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default: 'bg-[#0274BB] text-white hover:bg-[#003B8C] active:bg-[#003B8C] shadow-sm',
      primary: 'bg-[#0274BB] text-white hover:bg-[#003B8C] active:bg-[#003B8C] shadow-sm',
      secondary: 'border border-[#0274BB] bg-transparent text-[#0274BB] hover:bg-[#E6F2FF] active:bg-[#E6F2FF]',
      tertiary: 'bg-transparent text-[#0274BB] hover:text-[#003B8C] hover:underline p-0 h-auto',
      outlineInk: 'border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F5F7FA] active:bg-[#E5E7EB]',
      outline: 'border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F5F7FA] active:bg-[#E5E7EB]',
      ghost: 'bg-transparent text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#111827]',
      success: 'bg-[#16A34A] text-white hover:bg-[#15803d] active:bg-[#15803d] shadow-sm',
      successOutline: 'border border-[#16A34A] bg-transparent text-[#16A34A] hover:bg-[#f0fdf4]',
      warning: 'bg-[#EF7626] text-white hover:bg-[#d46118] active:bg-[#d46118] shadow-sm',
      warningOutline: 'border border-[#EF7626] bg-transparent text-[#EF7626] hover:bg-[#fff7ed]',
      danger: 'bg-[#DC2626] text-white hover:bg-[#b91c1c] active:bg-[#b91c1c] shadow-sm',
      destructive: 'bg-[#DC2626] text-white hover:bg-[#b91c1c] active:bg-[#b91c1c] shadow-sm',
      dangerOutline: 'border border-[#DC2626] bg-transparent text-[#DC2626] hover:bg-[#fef2f2]',
    };

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm font-semibold',
      sm: 'h-8 px-3 text-xs font-medium',
      lg: 'h-10 px-6 text-base font-semibold',
      icon: 'size-9 p-0 flex items-center justify-center',
    };

    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = 'Button';

// ==========================================
// 3. Status Badge & Pills (CCM Section 1.2 & 3.1)
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'danger'
    | 'destructive'
    | 'analytics'
    | 'info'
    | 'secondary'
    | 'outline';
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', pill = true, ...props }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors';
  const radius = pill ? 'rounded-full' : 'rounded-[3px]';

  const variants = {
    default: 'bg-[#E5E7EB] text-[#374151]',
    secondary: 'bg-[#F5F7FA] text-[#4B5563] border border-[#E5E7EB]',
    outline: 'border border-[#D1D5DB] bg-white text-[#374151]',
    primary: 'bg-[#E6F2FF] text-[#0274BB] border border-[#0274BB]/30',
    success: 'bg-[#dcfce7] text-[#16A34A] border border-[#16A34A]/30',
    warning: 'bg-[#fef3c7] text-[#b45309] border border-[#f59e0b]/30',
    error: 'bg-[#fee2e2] text-[#DC2626] border border-[#DC2626]/30',
    danger: 'bg-[#fee2e2] text-[#DC2626] border border-[#DC2626]/30',
    destructive: 'bg-[#fee2e2] text-[#DC2626] border border-[#DC2626]/30',
    analytics: 'bg-[#f3e8ff] text-[#7C3AED] border border-[#7C3AED]/30',
    info: 'bg-[#e0f2fe] text-[#0284C7] border border-[#0284C7]/30',
  };

  return <div className={cn(base, radius, variants[variant], className)} {...props} />;
};

// ==========================================
// 4. Form Elements (CCM Section 5)
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, readOnly, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        ref={ref}
        readOnly={readOnly}
        className={cn(
          'flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs transition-colors placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB] disabled:cursor-not-allowed disabled:bg-[#FAFAFA] disabled:text-[#9CA3AF]',
          readOnly && 'bg-[#F5F7FA] text-[#6B7280] cursor-default border-[#E5E7EB]',
          error && 'border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]',
          className
        )}
        {...props}
      />
    );

    if (!label && !error && !helperText) return inputElement;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">{label}</label>}
        {inputElement}
        {helperText && !error && <span className="text-[11px] text-[#6B7280]">{helperText}</span>}
        {error && <span className="text-xs text-[#DC2626] font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

/**
 * Search Input with prefix search icon (Section 5.1)
 */
export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 size-4 text-[#9CA3AF] pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white pl-9 pr-3 py-1 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB]',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ className, label, error, children, ...props }, ref) => {
    const selectEl = (
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs transition-colors focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB] disabled:cursor-not-allowed disabled:bg-[#FAFAFA]',
          error && 'border-[#DC2626]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );

    if (!label && !error) return selectEl;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">{label}</label>}
        {selectEl}
        {error && <span className="text-xs text-[#DC2626] font-medium">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ className, label, error, ...props }, ref) => {
    const textareaEl = (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] shadow-xs transition-colors placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB]',
          error && 'border-[#DC2626]',
          className
        )}
        {...props}
      />
    );

    if (!label && !error) return textareaEl;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-xs font-semibold text-[#374151] uppercase tracking-wider">{label}</label>}
        {textareaEl}
        {error && <span className="text-xs text-[#DC2626] font-medium">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ==========================================
// 5. Form Field Layout Helpers
// ==========================================
export const FieldGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-4', className)} {...props} />
);

export const Field: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
);

export const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('text-xs font-semibold text-[#374151] uppercase tracking-wider', className)} {...props} />
);

export const FieldDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-xs text-[#6B7280] leading-normal', className)} {...props} />
);

export const FieldError: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('text-xs text-[#DC2626] font-medium', className)} {...props} />
);

export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-[1px] w-full bg-[#E5E7EB] my-4', className)} />
);

// ==========================================
// 6. Navigation Tabs & Pagination (CCM Section 3.2)
// ==========================================
export interface CategoryTabItem {
  id: string;
  label: string;
  count?: number;
}

export const CategoryTabs: React.FC<{
  tabs: CategoryTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onTabChange, className }) => {
  return (
    <div className={cn('flex items-center gap-2 border-b border-[#E5E7EB] pb-px', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer select-none',
              isActive
                ? 'border-[#0274BB] text-[#0274BB]'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-[#E6F2FF] text-[#0274BB]' : 'bg-[#F5F7FA] text-[#6B7280]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ==========================================
// 7. Dialog / Modal Primitives (CCM Design System)
// ==========================================
export const DialogOverlay: React.FC<{
  isOpen?: boolean;
  onClose?: () => void;
  onClick?: (e?: any) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen = true, onClose, onClick, children, className }) => {
  if (!isOpen) return null;
  const handleClose = onClose || onClick;
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150',
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget && handleClose) handleClose(e);
      }}
    >
      {children}
    </div>
  );
};

export const DialogContent: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  }
> = ({ className, size = 'lg', children, ...props }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-2xl w-full overflow-hidden border border-[#E5E7EB] flex flex-col my-auto max-h-[90vh]',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]',
      className
    )}
    {...props}
  />
);

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3 className={cn('font-bold text-[#111827] text-base leading-tight', className)} {...props} />
);

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={cn('text-xs text-[#6B7280] leading-normal mt-0.5', className)} {...props} />
);

export const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('p-6 space-y-4 overflow-y-auto flex-1', className)} {...props} />
);

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC]',
      className
    )}
    {...props}
  />
);

// ==========================================
// 8. Form Section Container
// ==========================================
export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  icon,
  title,
  description,
  action,
  badge,
  children,
  className,
  ...props
}) => (
  <Card className={cn('overflow-hidden', className)} {...props}>
    <CardHeader className="flex flex-row items-center justify-between gap-4 p-5 bg-[#FAFAFA] border-b border-[#E5E7EB]">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="size-9 rounded-md bg-[#0274BB]/10 text-[#0274BB] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-[#111827]">{title}</CardTitle>
            {badge}
          </div>
          {description && <CardDescription className="text-xs text-[#6B7280]">{description}</CardDescription>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </CardHeader>
    <CardContent className="p-6">{children}</CardContent>
  </Card>
);

