import { useState, useEffect } from 'react'
import { X, CreditCard, Loader2, IndianRupee, AlertCircle } from 'lucide-react'
import { recordInvoicePayment, PAYMENT_METHODS } from '../../data/invoiceStore'
import { formatINR } from '../../data/tripStore'

export default function RecordInvoicePaymentModal({ invoice, isOpen, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen && invoice) {
      setError('')
      setAmountPaid(String(invoice.balanceDue || invoice.totalAmount || 0))
      setPaymentMethod('UPI')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setReferenceNumber('')
      setNotes('')
    }
  }, [isOpen, invoice])

  if (!isOpen || !invoice) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const val = Number(amountPaid)
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid payment amount.')
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

      if (onSuccess) onSuccess(`Payment of ₹${val} recorded successfully!`)
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
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Info Box */}
        <div className="rounded-xl border border-line bg-bg p-3 flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] font-bold text-ink-soft uppercase">Total Invoice</p>
            <p className="font-extrabold text-ink num text-sm">{formatINR(invoice.totalAmount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-ink-soft uppercase">Balance Due</p>
            <p className="font-extrabold text-rose-700 num text-sm">{formatINR(invoice.balanceDue)}</p>
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
                min="1"
                max={invoice.balanceDue || invoice.totalAmount}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg pl-8 pr-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Payment Method */}
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

          {/* Payment Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
            />
          </div>

          {/* Reference / UTR Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Reference / UTR / Transaction No</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR12345678"
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
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
