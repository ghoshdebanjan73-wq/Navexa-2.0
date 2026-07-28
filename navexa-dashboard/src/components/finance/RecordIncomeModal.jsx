import { useState, useEffect } from 'react'
import { X, TrendingUp, Loader2, IndianRupee, AlertCircle } from 'lucide-react'
import { addTransaction, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../data/transactionStore'
import { liveCustomers } from '../../data/customerStore'
import { liveTrips } from '../../data/tripStore'
import { useUser } from '../../context/UserContext'

export default function RecordIncomeModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Trip Fare')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [tripId, setTripId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setDate(new Date().toISOString().split('T')[0])
      setAmount('')
      setCategory('Trip Fare')
      setPaymentMethod('UPI')
      setDescription('')
      setReference('')
      setCustomerId('')
      setTripId('')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive income amount.')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description for this income entry.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const selectedCustomer = liveCustomers.find(c => c.id === customerId)

      await addTransaction({
        type: 'Income',
        category,
        amount: numAmount,
        description: description.trim(),
        paymentMethod,
        date,
        customerId,
        tripId,
        reference: reference.trim(),
        notes: notes.trim(),
        createdBy: currentUser?.name || 'Dispatcher',
      }, currentUser?.id)

      if (onSuccess) onSuccess(`Income of ₹${numAmount} recorded successfully!`)
      onClose()
    } catch (err) {
      console.error('Error recording income:', err)
      setError(err.message || 'Failed to record income entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="my-6 w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Record Income</h3>
              <p className="text-xs text-ink-soft">Enter manual revenue or non-invoice payment.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
                  <IndianRupee size={14} />
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full rounded-xl border border-line bg-bg pl-8 pr-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advance payment for Kolkata outstation trip"
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                {INCOME_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Customer & Trip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Related Customer (Optional)</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                <option value="">— None —</option>
                {liveCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Related Trip (Optional)</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                <option value="">— None —</option>
                {liveTrips.map(t => (
                  <option key={t.id} value={t.id}>{t.id} ({t.customer})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Reference / UTR Number</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR98765432"
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
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Save Income Entry</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
