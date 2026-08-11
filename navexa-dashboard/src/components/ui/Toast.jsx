import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, type, duration, onClose])

  if (!message) return null

  const getVariantStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/20',
          icon: <AlertCircle size={18} className="shrink-0 text-rose-300" />,
        }
      case 'warning':
        return {
          container: 'bg-amber-900/95 text-white border-amber-700 shadow-amber-950/20',
          icon: <AlertTriangle size={18} className="shrink-0 text-amber-300" />,
        }
      case 'info':
        return {
          container: 'bg-sky-900/95 text-white border-sky-700 shadow-sky-950/20',
          icon: <Info size={18} className="shrink-0 text-sky-300" />,
        }
      default:
        return {
          container: 'bg-slate-900/95 text-white border-slate-800 shadow-slate-950/30',
          icon: <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />,
        }
    }
  }

  const variant = getVariantStyles()

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-16 z-50 flex items-center gap-3 rounded-2xl border p-3.5 sm:p-4 shadow-pop backdrop-blur-md animate-slideDown max-w-md ${variant.container}`}
    >
      {variant.icon}
      <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug tracking-tight">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          aria-label="Close notification"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
