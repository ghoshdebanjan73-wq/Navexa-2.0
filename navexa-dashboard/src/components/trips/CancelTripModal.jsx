import { useState, useEffect } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { updateTripStatus } from '../../data/tripStore'
import { useUser } from '../../context/UserContext'

const CANCELLATION_REASONS = [
  'Customer cancelled',
  'Vehicle unavailable',
  'Driver unavailable',
  'Rescheduled',
  'Other',
]

export default function CancelTripModal({ trip, isOpen, onClose, onSuccess }) {
  const { user } = useUser()
  const [reason, setReason] = useState('Customer cancelled')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && trip) {
      setReason('Customer cancelled')
      setNotes('')
      setError('')
    }
  }, [isOpen, trip])

  if (!isOpen || !trip) return null

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError('')

    try {
      const fullReasonNote = reason === 'Other' && notes.trim()
        ? `Cancelled: Other — ${notes.trim()}`
        : `Cancelled: ${reason}${notes.trim() ? ` (${notes.trim()})` : ''}`

      await updateTripStatus(
        trip.id,
        'Cancelled',
        null,
        user?.name || 'Admin',
        fullReasonNote
      )

      if (onSuccess) {
        onSuccess(`Trip #${trip.id} has been marked as Cancelled.`)
      }
      onClose()
    } catch (err) {
      console.error('Error cancelling trip:', err)
      setError(err.message || 'Failed to cancel trip. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cancel Trip Confirmation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <AlertTriangle size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-ink leading-tight">
                Cancel Trip #{trip.id}?
              </h3>
              <p className="text-xs font-medium text-ink-soft">
                Customer: <strong className="text-ink">{trip.customer}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Explanation Body */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5 text-xs text-amber-900 leading-relaxed">
          Are you sure you want to cancel this trip? The trip will remain preserved in your historical records, but will no longer be treated as an active or upcoming trip.
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cancel-reason" className="block text-xs font-bold text-ink">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </label>
            <select
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Details Input */}
          <div className="space-y-1.5">
            <label htmlFor="cancel-notes" className="block text-xs font-bold text-ink">
              Additional Notes <span className="text-ink-soft font-normal">(Optional)</span>
            </label>
            <textarea
              id="cancel-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={reason === 'Other' ? 'Please specify cancellation details...' : 'Optional remarks for history log...'}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep Trip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Cancel Trip</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
