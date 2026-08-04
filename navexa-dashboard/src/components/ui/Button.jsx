import { Loader2 } from 'lucide-react'

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const baseStyle =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary: 'bg-primary text-white shadow-xs hover:bg-primary-600 active:scale-[0.98]',
    secondary: 'border border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]',
    outline: 'border border-primary text-primary hover:bg-primary-50 active:scale-[0.98]',
    ghost: 'text-ink-soft hover:bg-slate-100 hover:text-ink',
    destructive: 'bg-danger text-white shadow-xs hover:bg-rose-700 active:scale-[0.98]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs sm:text-sm',
    lg: 'px-5 py-3 text-sm sm:text-base',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />
      ) : null}
      {children}
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
