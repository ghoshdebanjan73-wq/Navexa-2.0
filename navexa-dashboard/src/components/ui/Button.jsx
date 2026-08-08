import { Loader2 } from 'lucide-react'

/**
 * Standardized Navexa Button Component
 * Supports primary, secondary, outline, ghost, destructive, success, warning variants.
 * Full width, icon-only, compact, loading, and disabled states.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyle =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/20'

  const variants = {
    primary: 'bg-primary text-white shadow-xs hover:bg-primary-600 active:scale-[0.98]',
    secondary: 'border border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]',
    outline: 'border border-primary text-primary hover:bg-primary-50 active:scale-[0.98]',
    ghost: 'text-ink-soft hover:bg-slate-100 hover:text-ink active:scale-[0.98]',
    destructive: 'bg-danger text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]',
    success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98]',
    warning: 'bg-amber-600 text-white shadow-xs hover:bg-amber-700 active:scale-[0.98]',
  }

  const sizes = {
    xs: 'px-2.5 py-1 text-[11px] min-h-[30px]',
    sm: 'px-3 py-1.5 text-xs min-h-[34px]',
    md: 'px-4 py-2 text-xs sm:text-sm min-h-[40px]',
    lg: 'px-5 py-2.5 text-sm sm:text-base min-h-[46px]',
    icon: 'p-2 min-h-[36px] min-w-[36px]',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    icon: 16,
  }

  const currentIconSize = iconSizes[size] || 16

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={currentIconSize} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={currentIconSize} strokeWidth={2.25} className="shrink-0" />
      ) : null}
      {children && <span>{children}</span>}
      {!loading && IconRight ? (
        <IconRight size={currentIconSize} strokeWidth={2.25} className="shrink-0" />
      ) : null}
    </button>
  )
}

export function PrimaryButton({ icon: Icon, children, className = '', ...props }) {
  return (
    <Button variant="primary" icon={Icon} className={className} {...props}>
      {children}
    </Button>
  )
}

export function SecondaryButton({ icon: Icon, children, className = '', ...props }) {
  return (
    <Button variant="secondary" icon={Icon} className={className} {...props}>
      {children}
    </Button>
  )
}

export function GhostButton({ icon: Icon, children, className = '', ...props }) {
  return (
    <Button variant="ghost" icon={Icon} className={className} {...props}>
      {children}
    </Button>
  )
}

export function DestructiveButton({ icon: Icon, children, className = '', ...props }) {
  return (
    <Button variant="destructive" icon={Icon} className={className} {...props}>
      {children}
    </Button>
  )
}

export default Button
