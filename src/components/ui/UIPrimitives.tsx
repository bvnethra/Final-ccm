// src/components/ui/UIPrimitives.tsx
import React from 'react';
import { cn } from '../../lib/utils';

// ==========================================
// Card Primitive (Design System: 8px radius, border Gray 200, surface White)
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

// ==========================================
// Button Primitive (Design System: 4px radius, Primary Blue #0274BB, Accent Orange #EF7626)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | 'primary' 
    | 'default' 
    | 'secondary' 
    | 'outline' 
    | 'ghost' 
    | 'accent'
    | 'destructive' 
    | 'danger' 
    | 'success'
    | 'warning'
    | 'success-outline'
    | 'warning-outline'
    | 'danger-outline'
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
      outline: 'border border-[#E5E7EB] bg-white text-[#374151] shadow-xs hover:bg-[#F5F7FA] hover:text-[#111827] active:bg-[#E5E7EB]',
      ghost: 'bg-transparent text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#111827] active:bg-[#E5E7EB]',
      success: 'bg-[#16A34A] text-white shadow-xs hover:bg-[#15803d] active:bg-[#166534]',
      warning: 'bg-[#F59E0B] text-white shadow-xs hover:bg-[#d97706] active:bg-[#b45309]',
      destructive: 'bg-[#DC2626] text-white shadow-xs hover:bg-[#b91c1c] active:bg-[#991b1b]',
      danger: 'bg-[#DC2626] text-white shadow-xs hover:bg-[#b91c1c] active:bg-[#991b1b]',
      'success-outline': 'border border-[#16A34A] bg-white text-[#16A34A] hover:bg-emerald-50 active:bg-emerald-100',
      'warning-outline': 'border border-[#F59E0B] bg-white text-[#d97706] hover:bg-amber-50 active:bg-amber-100',
      'danger-outline': 'border border-[#DC2626] bg-white text-[#DC2626] hover:bg-red-50 active:bg-red-100',
      link: 'text-[#0274BB] underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-[4px] px-3 text-xs',
      lg: 'h-10 rounded-[4px] px-6 text-base font-semibold',
      icon: 'size-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// ==========================================
// Badge / Pill Primitive (Design System: 999px pill or 3px subtle radius)
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'destructive' | 'danger' | 'success' | 'warning' | 'info' | 'accent';
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
    info: 'border-[#b8dcff] bg-[#E6F2FF] text-[#0274BB]',
    accent: 'border-orange-200 bg-orange-50 text-[#EF7626]',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
};

// ==========================================
// Input Primitive (Design System: 4px radius, Gray 200 border, focus #0274BB)
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    const inputElement = (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-[4px] border border-[#E5E7EB] bg-white px-3 py-1 text-sm text-[#111827] shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[#0274BB] focus-visible:ring-1 focus-visible:ring-[#0274BB] disabled:cursor-not-allowed disabled:bg-[#F5F7FA] disabled:text-[#9CA3AF]',
          error && 'border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]',
          className
        )}
        {...props}
      />
    );

    if (!label && !error) return inputElement;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-medium text-[#4B5563] uppercase tracking-wider">{label}</label>}
        {inputElement}
        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ==========================================
// Form Field Grouping Primitives
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

// ==========================================
// Separator Primitive
// ==========================================
export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-[1px] w-full bg-[#E5E7EB] my-4', className)} />
);

// ==========================================
// Modal Primitive (Design System: 16px radius, Gray 200 border, White surface)
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
