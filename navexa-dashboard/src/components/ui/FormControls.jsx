import React from 'react'

/**
 * Standardized Navexa Form Controls
 * Consistent labels, input heights, borders, focus rings, placeholders, disabled states, and error messages across all modals and form pages.
 */

export function FormLabel({ children, required, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`text-xs font-bold text-ink block mb-1 ${className}`}>
      {children}
      {required && <span className="text-rose-500 ml-1" title="Required field">*</span>}
    </label>
  )
}

export function FormHint({ children, className = '' }) {
  if (!children) return null
  return <p className={`text-[11px] text-ink-soft mt-1 leading-normal ${className}`}>{children}</p>
}

export function FormError({ children, className = '' }) {
  if (!children) return null
  return <p className={`text-[11px] font-semibold text-rose-600 mt-1 leading-normal animate-slideDown ${className}`}>{children}</p>
}

export function FormField({ label, required, hint, error, children, className = '' }) {
  return (
    <div className={`space-y-0.5 ${className}`}>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      {children}
      {error ? <FormError>{error}</FormError> : hint ? <FormHint>{hint}</FormHint> : null}
    </div>
  )
}

export const Input = React.forwardRef(function Input(
  { icon: Icon, error, className = '', ...props },
  ref
) {
  const errorStyle = error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''

  if (Icon) {
    return (
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
          <Icon size={16} />
        </span>
        <input
          ref={ref}
          className={`form-input pl-9 ${errorStyle} ${className}`}
          {...props}
        />
      </div>
    )
  }

  return (
    <input
      ref={ref}
      className={`form-input ${errorStyle} ${className}`}
      {...props}
    />
  )
})

export const Select = React.forwardRef(function Select(
  { error, className = '', children, ...props },
  ref
) {
  const errorStyle = error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''
  return (
    <select
      ref={ref}
      className={`form-select ${errorStyle} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
})

export const Textarea = React.forwardRef(function Textarea(
  { error, className = '', ...props },
  ref
) {
  const errorStyle = error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : ''
  return (
    <textarea
      ref={ref}
      className={`form-textarea ${errorStyle} ${className}`}
      {...props}
    />
  )
})

export function FormGrid({ cols = 2, children, className = '' }) {
  const colClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
  return <div className={`grid gap-3.5 ${colClass} ${className}`}>{children}</div>
}
