import { useState, useEffect } from 'react'
import { X, TrendingDown, Loader2, IndianRupee, AlertCircle, Upload, Paperclip } from 'lucide-react'
import { addTransaction, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../data/transactionStore'
import { liveVehicles } from '../../data/vehicleStore'
import { liveTrips } from '../../data/tripStore'
import { useUser } from '../../context/UserContext'
import { supabase } from '../../lib/supabase'

export default function RecordExpenseModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Fuel')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [description, setDescription] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [tripId, setTripId] = useState('')
  const [vendor, setVendor] = useState('')
  const [reference, setReference] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPath, setReceiptPath] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setDate(new Date().toISOString().split('T')[0])
      setAmount('')
      setCategory('Fuel')
      setPaymentMethod('Cash')
      setDescription('')
      setVehicleId('')
      setTripId('')
      setVendor('')
      setReference('')
      setReceiptFile(null)
      setReceiptPath('')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive expense amount.')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description for this expense.')
      return
    }

    setSaving(true)
    setError('')

    let uploadedPath = receiptPath

    // Upload receipt to Supabase Storage if file selected
    if (receiptFile) {
      try {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `receipt_${Date.now()}.${fileExt}`
        const filePath = `receipts/${fileName}`

        const { data, error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, { upsert: true })

        if (!uploadErr && data) {
          uploadedPath = data.path
        }
      } catch (err) {
        console.error('Receipt upload notice (fallback used):', err)
      }
    }

    try {
      await addTransaction({
        type: 'Expense',
        category,
        amount: numAmount,
        description: description.trim(),
        paymentMethod,
        date,
        vehicleId,
        tripId,
        vendor: vendor.trim(),
        reference: reference.trim(),
        receiptPath: uploadedPath,
        notes: notes.trim(),
        createdBy: currentUser?.name || 'Dispatcher',
      }, currentUser?.id)

      if (onSuccess) onSuccess(`Expense of ₹${numAmount} recorded successfully!`)
      onClose()
    } catch (err) {
      console.error('Error recording expense:', err)
      setError(err.message || 'Failed to record expense entry.')
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <TrendingDown size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Record Expense</h3>
              <p className="text-xs text-ink-soft">Enter operational cost, fuel, or maintenance expense.</p>
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
                  placeholder="e.g. 2500"
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
              placeholder="e.g. Diesel refill at HP Pump Hooghly"
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map(cat => (
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

          {/* Vehicle & Trip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Vehicle (Optional)</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
              >
                <option value="">— None —</option>
                {liveVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registration || v.id})</option>
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

          {/* Vendor & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Vendor / Payee</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Indian Oil / Garage"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Reference / Bill No</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-9081"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Receipt / Bill Upload</label>
            <label className="flex items-center justify-between rounded-xl border border-dashed border-line bg-bg p-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <Paperclip size={16} />
                <span className="truncate max-w-[200px]">
                  {receiptFile ? receiptFile.name : 'Upload receipt image/PDF'}
                </span>
              </div>
              <span className="rounded-lg bg-surface border border-line px-2.5 py-1 text-[11px] font-bold text-ink">Browse</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
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
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Expense Entry</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
