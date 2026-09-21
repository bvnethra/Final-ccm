// src/components/ui/UIPrimitives.tsx
import React from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

// ==========================================
// 1. Cards & Containers (Design System Section 4)
// ==========================================
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] shadow-xs', className)}
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
    <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight text-[#111827]', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-[#6B7280] leading-relaxed', className)} {...props} />
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
 * KPI Card Primitive (Section 4.1 & 4.2)
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
// 2. Button Primitive (Design System Section 3)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | 'primary' 
    | 'default' 
    | 'secondary' 
    | 'tertiary'
    | 'outline' 
    | 'outlineInk'
    | 'ghost' 
    | 'accent'
    | 'destructive' 
    | 'danger' 
    | 'success'
    | 'warning'
    | 'success-outline'
    | 'successOutline'
    | 'warning-outline'
    | 'warningOutline'
    | 'danger-outline'
    | 'dangerOutline'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0274BB] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default: 'bg-[#0274BB] text-white shadow-xs hover:bg-[#003B8C] active:bg-[#003B8C]',
      primary: 'bg-[#0274BB] text-white shadow-xs hover:bg-[#003B8C] active:bg-[#003B8C]',
      accent: 'bg-[#EF7626] text-white shadow-xs hover:bg-[#d8641a] active:bg-[#c45512]',
      secondary: 'bg-[#F5F7FA] text-[#374151] border border-[#E5E7EB] shadow-xs hover:bg-[#E5E7EB] active:bg-[#D1D5DB]',
      tertiary: 'bg-transparent text-[#0274BB] hover:text-[#003B8C] hover:underline p-0 h-auto',
      outline: 'border border-[#E5E7EB] bg-white text-[#374151] shadow-xs hover:bg-[#F5F7FA] hover:text-[#111827] active:bg-[#E5E7EB]',
      outlineInk: 'border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F5F7FA] active:bg-[#E5E7EB]',
      ghost: 'bg-transparent text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#111827] active:bg-[#E5E7EB]',
      success: 'bg-[#16A34A] text-white shadow-xs hover:bg-[#15803d] active:bg-[#166534]',
      successOutline: 'border border-[#16A34A] bg-transparent text-[#16A34A] hover:bg-[#f0fdf4]',
      'success-outline': 'border border-[#16A34A] bg-white text-[#16A34A] hover:bg-emerald-50 active:bg-emerald-100',
      warning: 'bg-[#F59E0B] text-white shadow-xs hover:bg-[#d97706] active:bg-[#b45309]',
      warningOutline: 'border border-[#EF7626] bg-transparent text-[#EF7626] hover:bg-[#fff7ed]',
      'warning-outline': 'border border-[#F59E0B] bg-white text-[#d97706] hover:bg-amber-50 active:bg-amber-100',
      destructive: 'bg-[#DC2626] text-white shadow-xs hover:bg-[#b91c1c] active:bg-[#991b1b]',
      danger: 'bg-[#DC2626] text-white shadow-xs hover:bg-[#b91c1c] active:bg-[#991b1b]',
      dangerOutline: 'border border-[#DC2626] bg-transparent text-[#DC2626] hover:bg-[#fef2f2]',
      'danger-outline': 'border border-[#DC2626] bg-white text-[#DC2626] hover:bg-red-50 active:bg-red-100',
      link: 'text-[#0274BB] underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-[4px] px-3 text-xs',
      lg: 'h-10 rounded-[4px] px-6 text-base font-semibold',
      icon: 'size-9 p-0 flex items-center justify-center',
    };

    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = 'Button';

// ==========================================
// 3. Status Badge & Pills (Section 1.2 & 3.1)
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'default' 
    | 'primary' 
    | 'secondary' 
    | 'outline' 
    | 'destructive' 
    | 'danger' 
    | 'error'
    | 'success' 
    | 'warning' 
    | 'info' 
    | 'accent'
    | 'analytics';
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', pill = true, ...props }) => {
  const base = cn(
    'inline-flex items-center border px-2.5 py-0.5 text-xs font-medium transition-colors',
    pill ? 'rounded-full' : 'rounded-[3px]'
  );

  const variants = {
    default: 'border-[#E5E7EB] bg-[#F5F7FA] text-[#374151]',
    primary: 'border-[#b8dcff] bg-[#E6F2FF] text-[#0274BB]',
    secondary: 'border-[#E5E7EB] bg-[#FAFAFA] text-[#4B5563]',
    outline: 'border-[#E5E7EB] bg-white text-[#4B5563]',
    success: 'border-emerald-200 bg-emerald-50 text-[#16A34A]',
    warning: 'border-amber-200 bg-amber-50 text-[#d97706]',
    destructive: 'border-rose-200 bg-rose-50 text-[#DC2626]',
    danger: 'border-rose-200 bg-rose-50 text-[#DC2626]',
    error: 'border-rose-200 bg-rose-50 text-[#DC2626]',
    info: 'border-[#b8dcff] bg-[#E6F2FF] text-[#0274BB]',
    accent: 'border-orange-200 bg-orange-50 text-[#EF7626]',
    analytics: 'border-purple-200 bg-purple-50 text-[#7C3AED]',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
};

// ==========================================
// 4. Form Elements (Section 5)
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
          'flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs transition-colors placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB] disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF]',
          readOnly && 'bg-[#F5F7FA] text-[#6B7280] cursor-default border-[#E5E7EB]',
          error && 'border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]',
          className
        )}
        {...props}
      />
    );

    if (!label && !error && !helperText) return inputElement;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">{label}</label>}
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

export const Field: React.FC<React.HTMLAttributes<HTMLDivElement> & { 'data-invalid'?: boolean }> = ({
  className,
  ...props
}) => <div className={cn('flex flex-col gap-1.5', className)} {...props} />;

export const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('text-xs font-semibold text-[#374151] uppercase tracking-wider', className)} {...props} />
);

export const FieldDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-[11px] text-[#6B7280] leading-normal', className)} {...props} />
);

export const FieldError: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('text-xs text-[#DC2626] font-medium', className)} {...props} />
);

export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-[1px] w-full bg-[#E5E7EB] my-4', className)} />
);

// ==========================================
// 6. Navigation Tabs & Pagination (Section 3.2)
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
// 7. Modal Primitive (Design System: 16px radius, Gray 200 border, White surface)
// ==========================================
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] w-full max-w-xl p-6 shadow-2xl space-y-4 text-[#111827]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#111827] transition cursor-pointer">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
