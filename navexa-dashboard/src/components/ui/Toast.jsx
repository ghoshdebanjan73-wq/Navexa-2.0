import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, type, duration, onClose])

  if (!message) return null

  const isError = type === 'error'
  const isInfo = type === 'info'

  const bgStyles = isError
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : isInfo
    ? 'bg-sky-50 border-sky-200 text-sky-800'
    : 'bg-emerald-50 border-emerald-200 text-emerald-800'

  const Icon = isError ? AlertCircle : isInfo ? Info : CheckCircle

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-4 top-16 z-50 flex items-center gap-3 rounded-2xl border p-4 shadow-pop animate-slideDown max-w-sm ${bgStyles}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="text-xs font-bold flex-1 leading-snug">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-ink-soft hover:text-ink transition-colors cursor-pointer p-0.5"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
