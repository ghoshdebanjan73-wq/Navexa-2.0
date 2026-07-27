import { useState, useEffect } from 'react'
import { X, Loader2, IndianRupee, CreditCard } from 'lucide-react'
import { recordPayment, getTripPaymentSummary } from '../../data/paymentStore'
import { formatINR } from '../../data/tripStore'

const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Bank Transfer',
  'Card',
  'Other',
]

const todayISO = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fieldCls = (hasError) =>
  `w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
    hasError
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
      : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
  }`

function FieldLabel({ children, required = false, optional = false }) {
  return (
    <label className="block text-xs font-bold text-ink mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
      {optional && <span className="ml-1 text-[11px] font-normal text-ink-soft">(Optional)</span>}
    </label>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-[11px] font-semibold text-rose-600">{msg}</p>
}

export default function RecordPaymentModal({ trip, onClose, onSaved, user }) {
  const summary = getTripPaymentSummary(trip.id, trip.fare, trip.paymentStatus)
  const remainingBalance = summary.balance

  const [amount,        setAmount]        = useState(remainingBalance > 0 ? String(remainingBalance) : '')
  const [paymentDate,   setPaymentDate]   = useState(todayISO())
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [notes,         setNotes]         = useState('')
  const [errors,        setErrors]        = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const validate = () => {
    const e = {}
    const numAmount = Number(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      e.amount = 'Enter a valid payment amount.'
    } else if (numAmount > remainingBalance) {
      e.amount = `Payment amount cannot exceed remaining balance of ${formatINR(remainingBalance)}.`
    }
    if (!paymentDate) {
      e.paymentDate = 'Select payment date.'
    }
    if (!paymentMethod) {
      e.paymentMethod = 'Select payment method.'
    }
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setErrors({})
    setIsSubmitting(true)

    setTimeout(() => {
      recordPayment({
        tripId: trip.id,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        notes: notes.trim(),
      }, user?.name || 'Banjo')

      setIsSubmitting(false)
      if (onSaved) onSaved(`Payment of ${formatINR(Number(amount))} recorded successfully.`)
      onClose()
    }, 350)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record Payment"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard size={18} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink leading-tight">Record Payment</h3>
              <p className="text-[11px] text-ink-soft">{trip.pickupLocation} → {trip.destination}</p>
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

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-4" noValidate>
          
          {/* Payment Summary Context Card */}
          <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-line bg-bg p-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Total Fare</p>
              <p className="text-xs sm:text-sm font-bold text-ink num mt-0.5">{formatINR(summary.fare)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Paid</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-700 num mt-0.5">{formatINR(summary.amountPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Balance Due</p>
              <p className="text-xs sm:text-sm font-extrabold text-rose-700 num mt-0.5">{formatINR(remainingBalance)}</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <FieldLabel required>Payment Amount (₹)</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
                <IndianRupee size={13} strokeWidth={2.5} />
              </span>
              <input
                type="number"
                min="1"
                max={remainingBalance}
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: null })) }}
                placeholder="0"
                className={`${fieldCls(errors.amount)} pl-8 num`}
                autoFocus
              />
            </div>
            <FieldError msg={errors.amount} />
          </div>

          {/* Date + Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <FieldLabel required>Payment Date</FieldLabel>
              <input
                type="date"
                value={paymentDate}
                onChange={e => { setPaymentDate(e.target.value); setErrors(p => ({ ...p, paymentDate: null })) }}
                className={fieldCls(errors.paymentDate)}
              />
              <FieldError msg={errors.paymentDate} />
            </div>

            <div>
              <FieldLabel required>Payment Method</FieldLabel>
              <select
                value={paymentMethod}
                onChange={e => { setPaymentMethod(e.target.value); setErrors(p => ({ ...p, paymentMethod: null })) }}
                className={fieldCls(errors.paymentMethod)}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <FieldError msg={errors.paymentMethod} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel optional>Notes / Reference</FieldLabel>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Advance payment received via GPay..."
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-line shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Recording...</>
              ) : (
                'Record Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
