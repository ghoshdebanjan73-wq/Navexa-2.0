import { useEffect } from 'react'
import { X, Edit2 } from 'lucide-react'
import TripForm from './TripForm'

export default function EditTripModal({ trip, onClose, onSaved, user }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Trip"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface shadow-pop max-h-[92vh] flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Edit2 size={16} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink leading-tight">Edit Trip</h3>
              <p className="text-[11px] text-ink-soft">Update booking and route details.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1">
          <TripForm
            tripToEdit={trip}
            onClose={onClose}
            onSaved={onSaved}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
