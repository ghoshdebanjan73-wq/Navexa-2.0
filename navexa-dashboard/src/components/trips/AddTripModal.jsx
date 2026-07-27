import { useEffect } from 'react'
import { X } from 'lucide-react'
import TripForm from './TripForm'

export default function AddTripModal({ onClose, onSaved, user, initialCustomer = '' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Trip"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface shadow-pop max-h-[92vh] flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-ink">Add Trip</h3>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary">Operational</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Canonical Shared Trip Form */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1">
          <TripForm
            onClose={onClose}
            onSaved={onSaved}
            user={user}
            initialCustomer={initialCustomer}
          />
        </div>
      </div>
    </div>
  )
}
