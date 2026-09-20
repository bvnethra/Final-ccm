// src/components/ui/UIPrimitives.tsx
import React from 'react';
import { cn } from '../../lib/utils';

// ==========================================
// Card Primitive
// ==========================================
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-100 shadow-xs backdrop-blur-xs', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 border-b border-zinc-800/80', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-none tracking-tight text-zinc-100', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-zinc-400 leading-relaxed', className)} {...props} />
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
    <div ref={ref} className={cn('flex items-center p-6 pt-0 border-t border-zinc-800/80', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// ==========================================
// Button Primitive (Standard shadcn Variants)
// ==========================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      default: 'bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-200 active:bg-zinc-300',
      primary: 'bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-200 active:bg-zinc-300',
      secondary: 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-xs hover:bg-zinc-700/80 active:bg-zinc-700',
      outline: 'border border-zinc-800 bg-transparent text-zinc-200 shadow-xs hover:bg-zinc-800/70 hover:text-zinc-100 active:bg-zinc-800',
      ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100 active:bg-zinc-800',
      destructive: 'bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-900/50 active:bg-red-900 shadow-xs',
      danger: 'bg-red-950/40 text-red-300 border border-red-800/50 hover:bg-red-900/50 active:bg-red-900 shadow-xs',
      link: 'text-zinc-200 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-base',
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
// Badge Primitive
// ==========================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'danger' | 'success' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const base = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium transition-colors';
  const variants = {
    default: 'border-zinc-700 bg-zinc-800 text-zinc-100',
    secondary: 'border-zinc-800 bg-zinc-900 text-zinc-400',
    outline: 'border-zinc-700 text-zinc-300',
    success: 'border-emerald-800/40 bg-emerald-950/40 text-emerald-300',
    warning: 'border-amber-800/40 bg-amber-950/40 text-amber-300',
    destructive: 'border-red-800/40 bg-red-950/40 text-red-300',
    danger: 'border-red-800/40 bg-red-950/40 text-red-300',
    info: 'border-zinc-700 bg-zinc-800 text-zinc-200',
  };

  return <div className={cn(base, variants[variant], className)} {...props} />;
};

// ==========================================
// Input Primitive
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
          'flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    );

    if (!label && !error) return inputElement;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>}
        {inputElement}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ==========================================
// Form Field Grouping Primitives (shadcn forms.md)
// ==========================================
export const FieldGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-4', className)} {...props} />
);

export const Field: React.FC<React.HTMLAttributes<HTMLDivElement> & { 'data-invalid'?: boolean }> = ({
  className,
  ...props
}) => <div className={cn('flex flex-col gap-1.5', className)} {...props} />;

export const FieldLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('text-xs font-medium text-zinc-300 uppercase tracking-wider', className)} {...props} />
);

export const FieldDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-[11px] text-zinc-500 leading-normal', className)} {...props} />
);

export const FieldError: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('text-xs text-red-400 font-medium', className)} {...props} />
);

// ==========================================
// Separator Primitive
// ==========================================
export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('h-[1px] w-full bg-zinc-800 my-4', className)} />
);

// ==========================================
// Modal Primitive (Fallback & Viewers only)
// ==========================================
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-xl p-6 shadow-xl space-y-4 text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
