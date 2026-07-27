import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({
  title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, onConfirm, onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface shadow-pop animate-scaleUp">
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5">
          <div className="flex items-center gap-2">
            {destructive && <AlertTriangle size={16} className="text-rose-600 shrink-0" />}
            <h3 className="text-base font-bold text-ink">{title}</h3>
          </div>
          <button onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={onCancel}
              className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors">
              {cancelLabel}
            </button>
            <button onClick={onConfirm}
              className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer transition-opacity ${
                destructive ? 'bg-rose-600' : 'bg-primary'
              }`}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
