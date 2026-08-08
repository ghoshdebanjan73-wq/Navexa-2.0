import { useState, useEffect } from 'react'
import { X, CreditCard, Loader2, IndianRupee, AlertCircle } from 'lucide-react'
import { recordInvoicePayment, PAYMENT_METHODS } from '../../data/invoiceStore'
import { formatINR } from '../../data/tripStore'
import { useUser } from '../../context/UserContext'

export default function RecordInvoicePaymentModal({ invoice, isOpen, onClose, onSuccess }) {
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [collectedBy, setCollectedBy] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen && invoice) {
      setError('')
      const remaining = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount - (invoice.amountPaid || 0)))
      setAmountPaid(String(Math.max(0, remaining)))
      setPaymentMethod('UPI')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setReferenceNumber('')
      setCollectedBy(user?.name || 'Admin')
      setNotes('')
    }
  }, [isOpen, invoice, user?.name])

  if (!isOpen || !invoice) return null

  const invoiceTotal = Number(invoice.totalAmount || 0)
  const alreadyPaid = Number(invoice.amountPaid || 0)
  const currentBalanceDue = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, invoiceTotal - alreadyPaid))
  const enteredPayment = Number(amountPaid) || 0
  const remainingAfterPayment = Math.max(0, currentBalanceDue - enteredPayment)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const val = Number(amountPaid)
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.')
      return
    }

    if (val > currentBalanceDue + 0.01) {
      setError(`Payment amount (${formatINR(val)}) cannot exceed the remaining balance (${formatINR(currentBalanceDue)}).`)
      return
    }

    setSaving(true)
    setError('')

    try {
      await recordInvoicePayment(invoice.id, {
        amountPaid: val,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      })

      if (onSuccess) onSuccess(`Payment of ₹${val.toLocaleString('en-IN')} recorded for Invoice ${invoice.invoiceNumber}!`)
      onClose()
    } catch (err) {
      console.error('Error recording invoice payment:', err)
      setError(err.message || 'Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Record Payment</h3>
              <p className="text-xs text-ink-soft">Invoice: <strong className="text-ink num">{invoice.invoiceNumber}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-slideDown">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Financial Balance Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-line bg-bg p-3 text-xs">
          <div>
            <p className="text-[9px] font-bold text-ink-soft uppercase tracking-wider">Total Invoice</p>
            <p className="font-extrabold text-ink num text-xs">{formatINR(invoiceTotal)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-ink-soft uppercase tracking-wider">Already Paid</p>
            <p className="font-bold text-emerald-700 num text-xs">{formatINR(alreadyPaid)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-ink-soft uppercase tracking-wider">Payment Now</p>
            <p className="font-extrabold text-primary num text-xs">{formatINR(enteredPayment)}</p>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-[9px] font-bold text-ink-soft uppercase tracking-wider">Remaining</p>
            <p className={`font-extrabold num text-xs ${remainingAfterPayment === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatINR(remainingAfterPayment)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount Paid */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">
              Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
                <IndianRupee size={14} />
              </span>
              <input
                type="number"
                required
                step="any"
                min="1"
                max={currentBalanceDue}
                value={amountPaid}
                onChange={(e) => {
                  setError('')
                  setAmountPaid(e.target.value)
                }}
                className="w-full rounded-xl border border-line bg-bg pl-8 pr-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Reference / UTR & Collected By */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Reference / UTR / Txn No</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR987654"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Collected By</label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                placeholder="Collector name"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes..."
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Confirm Payment</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
