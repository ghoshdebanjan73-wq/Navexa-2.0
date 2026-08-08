import { AlertTriangle, X } from 'lucide-react'
import Button from '../ui/Button'

export default function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface shadow-pop animate-scaleUp overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
            <h3 className="text-base font-bold text-ink">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{body}</p>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              onClick={onCancel}
              variant="secondary"
              size="sm"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onConfirm}
              variant={destructive ? 'destructive' : 'primary'}
              size="sm"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
