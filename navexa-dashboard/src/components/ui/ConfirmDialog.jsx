import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface shadow-pop animate-modalPop overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
            <h3 className="text-base font-bold text-ink">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{body}</p>
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary hover:bg-primary-600'
              }`}
            >
              {isSubmitting ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
