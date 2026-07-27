import { useState, useEffect } from 'react'
import { X, Loader2, Plus, IndianRupee, TrendingUp, TrendingDown, UserPlus } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { vehicles as allVehicles, upcomingTrips } from '../../data/mockData'
import { addTransaction, addActivity, formatDate } from '../../data/transactionStore'
import { addCustomer, findByPhone, getCustomerNames, subscribeCustomers } from '../../data/customerStore'
import { addTrip } from '../../data/tripStore'
import TripForm from '../trips/TripForm'

const INCOME_CATEGORIES = ['Trip Payment', 'Advance Payment', 'Other Income']

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Toll & Parking',
  'Maintenance',
  'Repair',
  'Cleaning',
  'Driver Expense',
  'Other Expense',
]

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Other']

// ─── Shared helper: field class ───────────────────────────────────────────────
const fieldCls = (hasError) =>
  `w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
    hasError
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
      : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
  }`

// ─── Shared: Label ────────────────────────────────────────────────────────────
function FieldLabel({ children, optional = false, required = false }) {
  return (
    <label className="block text-xs font-bold text-ink mb-1">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
      {optional && <span className="ml-1 text-[11px] font-normal text-ink-soft">(Optional)</span>}
    </label>
  )
}

// ─── Shared: Error message ────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-[11px] font-semibold text-rose-600">{msg}</p>
}

// ─── Shared: INR Amount input ─────────────────────────────────────────────────
function AmountInput({ value, onChange, error }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">
        <IndianRupee size={13} strokeWidth={2.5} />
      </span>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        value={value}
        onChange={onChange}
        placeholder="0"
        className={`w-full rounded-xl border bg-bg pl-8 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink num outline-none transition-all focus:bg-surface ${
          error
            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
            : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
        }`}
      />
    </div>
  )
}

// ─── Shared: Form footer buttons ──────────────────────────────────────────────
function FormFooter({ onCancel, isSubmitting, submitLabel, loadingLabel }) {
  return (
    <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-line shrink-0">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-line px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-100 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            {loadingLabel}
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  )
}

// ─── Today's date in YYYY-MM-DD ───────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10)

// ═══════════════════════════════════════════════════════════════════════════════
// RECORD INCOME FORM
// ═══════════════════════════════════════════════════════════════════════════════
function IncomeForm({ onClose, onToast, user }) {
  const [amount,        setAmount]        = useState('')
  const [category,      setCategory]      = useState('')
  const [date,          setDate]          = useState(todayISO())
  const [linkedTrip,    setLinkedTrip]    = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes,         setNotes]         = useState('')
  const [errors,        setErrors]        = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  const validate = () => {
    const e = {}
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) e.amount   = 'Enter a valid amount.'
    if (!category)                      e.category = 'Select a category.'
    if (!date)                          e.date     = 'Select a date.'
    if (!paymentMethod)                 e.paymentMethod = 'Select a payment method.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e_ = validate()
    if (Object.keys(e_).length) { setErrors(e_); return }
    setErrors({})
    setIsSubmitting(true)

    setTimeout(() => {
      const n = Number(amount)
      const tripObj = linkedTrip ? upcomingTrips.find(t => t.id === linkedTrip) : null
      const label   = tripObj ? tripObj.route : category

      addTransaction({
        id:          `TXN-${Date.now()}`,
        type:        'Income',
        transaction: label,
        category,
        date:        formatDate(date),
        amount:      n,
        paymentMethod,
        tripId:      linkedTrip || null,
        notes,
        createdBy:   user?.id || 'U-01',
      })

      addActivity({
        id:          Date.now(),
        type:        'income',
        text:        `Income recorded — ₹${n.toLocaleString('en-IN')}${tripObj ? ` · ${tripObj.route}` : ` · ${category}`}`,
        performedBy: user?.name || 'Banjo',
        time:        'Just now',
      })

      setIsSubmitting(false)
      if (onToast) onToast('Income recorded successfully.')
      onClose()
    }, 380)
  }

  const tripCategories = ['Trip Payment', 'Advance Payment']
  const showTripHint   = tripCategories.includes(category)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Amount + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Amount</FieldLabel>
          <AmountInput
            value={amount}
            onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: null })) }}
            error={errors.amount}
          />
          <FieldError msg={errors.amount} />
        </div>

        <div>
          <FieldLabel required>Category</FieldLabel>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: null })) }}
            className={fieldCls(errors.category)}
          >
            <option value="">— Select category —</option>
            {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError msg={errors.category} />
        </div>
      </div>

      {/* Date + Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Date</FieldLabel>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: null })) }}
            className={fieldCls(errors.date)}
          />
          <FieldError msg={errors.date} />
        </div>

        <div>
          <FieldLabel required>Payment Method</FieldLabel>
          <select
            value={paymentMethod}
            onChange={e => { setPaymentMethod(e.target.value); setErrors(p => ({ ...p, paymentMethod: null })) }}
            className={fieldCls(errors.paymentMethod)}
          >
            <option value="">— Select method —</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <FieldError msg={errors.paymentMethod} />
        </div>
      </div>

      {/* Linked Trip */}
      <div>
        <FieldLabel optional>
          Linked Trip
          {showTripHint && (
            <span className="ml-1.5 text-[11px] font-normal text-emerald-700">
              — recommended for {category}
            </span>
          )}
        </FieldLabel>
        <select
          value={linkedTrip}
          onChange={e => setLinkedTrip(e.target.value)}
          className={fieldCls(false)}
        >
          <option value="">— No trip linked —</option>
          {upcomingTrips.map(t => (
            <option key={t.id} value={t.id}>
              {t.route} · {t.customer} · ₹{t.fare.toLocaleString('en-IN')}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <FieldLabel optional>Notes</FieldLabel>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
      </div>

      <FormFooter
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel="Record Income"
        loadingLabel="Recording Income..."
      />
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECORD EXPENSE FORM
// ═══════════════════════════════════════════════════════════════════════════════
function ExpenseForm({ onClose, onToast, user }) {
  const [amount,        setAmount]        = useState('')
  const [category,      setCategory]      = useState('')
  const [date,          setDate]          = useState(todayISO())
  const [vehicle,       setVehicle]       = useState('')
  const [linkedTrip,    setLinkedTrip]    = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes,         setNotes]         = useState('')
  const [errors,        setErrors]        = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  const vehicleCategories = ['Fuel', 'Maintenance', 'Repair', 'Cleaning']
  const tripCategories    = ['Toll & Parking']
  const showVehicleHint   = vehicleCategories.includes(category)
  const showTripHint      = tripCategories.includes(category)

  const validate = () => {
    const e = {}
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) e.amount   = 'Enter a valid amount.'
    if (!category)                      e.category = 'Select a category.'
    if (!date)                          e.date     = 'Select a date.'
    if (!paymentMethod)                 e.paymentMethod = 'Select a payment method.'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e_ = validate()
    if (Object.keys(e_).length) { setErrors(e_); return }
    setErrors({})
    setIsSubmitting(true)

    setTimeout(() => {
      const n         = Number(amount)
      const vehicleObj = vehicle ? allVehicles.find(v => v.id === vehicle) : null
      const tripObj    = linkedTrip ? upcomingTrips.find(t => t.id === linkedTrip) : null
      const label      = vehicleObj ? `${category} · ${vehicleObj.name}` : category

      addTransaction({
        id:          `TXN-${Date.now()}`,
        type:        'Expense',
        transaction: label,
        category,
        date:        formatDate(date),
        amount:      n,
        paymentMethod,
        vehicleId:   vehicle || null,
        tripId:      linkedTrip || null,
        notes,
        createdBy:   user?.id || 'U-01',
      })

      addActivity({
        id:          Date.now(),
        type:        'expense',
        text:        `Expense recorded — ${category}${vehicleObj ? `, ${vehicleObj.name}` : ''}${tripObj ? ` · ${tripObj.route}` : ''} · ₹${n.toLocaleString('en-IN')}`,
        performedBy: user?.name || 'Banjo',
        time:        'Just now',
      })

      setIsSubmitting(false)
      if (onToast) onToast('Expense recorded successfully.')
      onClose()
    }, 380)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Amount + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Amount</FieldLabel>
          <AmountInput
            value={amount}
            onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: null })) }}
            error={errors.amount}
          />
          <FieldError msg={errors.amount} />
        </div>

        <div>
          <FieldLabel required>Category</FieldLabel>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: null })) }}
            className={fieldCls(errors.category)}
          >
            <option value="">— Select category —</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError msg={errors.category} />
        </div>
      </div>

      {/* Date + Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Date</FieldLabel>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: null })) }}
            className={fieldCls(errors.date)}
          />
          <FieldError msg={errors.date} />
        </div>

        <div>
          <FieldLabel required>Payment Method</FieldLabel>
          <select
            value={paymentMethod}
            onChange={e => { setPaymentMethod(e.target.value); setErrors(p => ({ ...p, paymentMethod: null })) }}
            className={fieldCls(errors.paymentMethod)}
          >
            <option value="">— Select method —</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <FieldError msg={errors.paymentMethod} />
        </div>
      </div>

      {/* Vehicle */}
      <div>
        <FieldLabel optional>
          Vehicle
          {showVehicleHint && (
            <span className="ml-1.5 text-[11px] font-normal text-rose-700">
              — recommended for {category}
            </span>
          )}
        </FieldLabel>
        <select
          value={vehicle}
          onChange={e => setVehicle(e.target.value)}
          className={fieldCls(false)}
        >
          <option value="">— No vehicle selected —</option>
          {allVehicles.map(v => (
            <option key={v.id} value={v.id} disabled={v.status === 'Inactive'}>
              {v.name} · {v.reg}{v.status === 'Inactive' ? ' (Inactive)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Linked Trip */}
      <div>
        <FieldLabel optional>
          Linked Trip
          {showTripHint && (
            <span className="ml-1.5 text-[11px] font-normal text-rose-700">
              — recommended for {category}
            </span>
          )}
        </FieldLabel>
        <select
          value={linkedTrip}
          onChange={e => setLinkedTrip(e.target.value)}
          className={fieldCls(false)}
        >
          <option value="">— No trip linked —</option>
          {upcomingTrips.map(t => (
            <option key={t.id} value={t.id}>
              {t.route} · {t.customer}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <FieldLabel optional>Notes</FieldLabel>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Fuel refill, toll payment, service details..."
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
      </div>

      <FormFooter
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel="Record Expense"
        loadingLabel="Recording Expense..."
      />
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD CUSTOMER FORM
// Used both standalone (from Quick Actions) and inline (from Trip form).
// Props:
//   onBack          – if provided, renders "Back to Trip" instead of "Cancel"
//   onCustomerAdded – callback(name) after successful add (for Trip selector)
//   onClose         – close modal (used in standalone mode)
//   onToast         – success toast
//   user            – current user
// ═══════════════════════════════════════════════════════════════════════════════
function AddCustomerForm({ onBack, onCustomerAdded, onClose, onToast, user }) {
  const [name,         setName]         = useState('')
  const [phone,        setPhone]        = useState('')
  const [email,        setEmail]        = useState('')
  const [address,      setAddress]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [errors,       setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setAddress(''); setNotes('')
    setErrors({})
  }

  const validate = () => {
    const e = {}
    if (!name.trim())  e.name  = "Enter the customer's name."
    if (!phone.trim()) e.phone = 'Enter a phone number.'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Enter a valid email address.'
    }
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Duplicate phone check
    const existing = findByPhone(phone)
    if (existing) {
      setErrors({ phone: `A customer with this phone number already exists (${existing.name}).` })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    setTimeout(() => {
      const trimmedName = name.trim()

      addCustomer({
        name:      trimmedName,
        phone:     phone.trim(),
        email:     email.trim(),
        address:   address.trim(),
        notes:     notes.trim(),
        createdBy: user?.id || 'U-01',
      })

      addActivity({
        id:          Date.now(),
        type:        'customer',
        text:        `Customer added — ${trimmedName}`,
        performedBy: user?.name || 'Banjo',
        time:        'Just now',
      })

      setIsSubmitting(false)
      resetForm()

      if (onCustomerAdded) onCustomerAdded(trimmedName)  // update Trip selector
      if (onToast) onToast('Customer added successfully.')
      if (onClose) onClose()
    }, 350)
  }

  const handleCancel = () => {
    resetForm()
    if (onBack) onBack()
    else if (onClose) onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Full Name — full width */}
      <div>
        <FieldLabel required>Full Name</FieldLabel>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })) }}
          placeholder="Enter customer name"
          className={fieldCls(errors.name)}
          autoFocus
          autoComplete="name"
        />
        <FieldError msg={errors.name} />
      </div>

      {/* Phone + Email side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: null })) }}
            placeholder="+91 98765 43210"
            className={fieldCls(errors.phone)}
            autoComplete="tel"
          />
          <FieldError msg={errors.phone} />
        </div>
        <div>
          <FieldLabel optional>Email</FieldLabel>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })) }}
            placeholder="customer@example.com"
            className={fieldCls(errors.email)}
            autoComplete="email"
          />
          <FieldError msg={errors.email} />
        </div>
      </div>

      {/* Address — full width */}
      <div>
        <FieldLabel optional>Address</FieldLabel>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Street, locality, city..."
          className={fieldCls(false)}
          autoComplete="street-address"
        />
      </div>

      {/* Notes — compact textarea */}
      <div>
        <FieldLabel optional>Notes</FieldLabel>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Customer preferences or useful information..."
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-line shrink-0">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-xl border border-line px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-100 cursor-pointer"
        >
          {onBack ? 'Back to Trip' : 'Cancel'}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> Adding Customer...</>
          ) : (
            'Add Customer'
          )}
        </button>
      </div>
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const MODAL_META = {
  trip: {
    title:   'Add Trip',
    badge:   { label: 'Operational', cls: 'bg-primary-50 text-primary' },
    maxW:    'max-w-xl',
  },
  income: {
    title:   'Record Income',
    badge:   { label: 'Income', cls: 'bg-emerald-50 text-emerald-700' },
    icon:    TrendingUp,
    iconCls: 'text-emerald-600',
    maxW:    'max-w-lg',
  },
  expense: {
    title:   'Record Expense',
    badge:   { label: 'Expense', cls: 'bg-rose-50 text-rose-700' },
    icon:    TrendingDown,
    iconCls: 'text-rose-600',
    maxW:    'max-w-lg',
  },
  customer: {
    title:   'Add Customer',
    badge:   null,
    icon:    UserPlus,
    iconCls: 'text-primary',
    maxW:    'max-w-lg',
  },
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN QuickActionModal
// ═══════════════════════════════════════════════════════════════════════════════
export default function QuickActionModal({ isOpen, onClose, type = 'trip', onToast }) {
  const { user } = useUser()
  const [activeType, setActiveType] = useState(type)

  // Sync active type when modal opens / type changes
  useEffect(() => {
    if (isOpen) setActiveType(type)
  }, [isOpen, type])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const meta       = MODAL_META[activeType] || MODAL_META.trip
  const HeaderIcon = meta.icon

  // When AddCustomerForm completes from within the Trip sub-form,
  // go back to the Trip form. New name is now in customerStore.
  const handleCustomerAdded = () => {
    setActiveType('trip')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full ${meta.maxW} rounded-2xl border border-line bg-surface shadow-pop animate-scaleUp max-h-[92vh] flex flex-col`}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2">
            {HeaderIcon && (
              <HeaderIcon size={17} strokeWidth={2.25} className={meta.iconCls} />
            )}
            <h3 className="text-base sm:text-lg font-bold text-ink">{meta.title}</h3>
            {meta.badge && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.badge.cls}`}>
                {meta.badge.label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1">
          {activeType === 'trip' && (
            <TripForm
              onClose={onClose}
              onToast={onToast}
              onSwitchToCustomer={() => setActiveType('customer')}
              user={user}
            />
          )}

          {activeType === 'income' && (
            <IncomeForm onClose={onClose} onToast={onToast} user={user} />
          )}

          {activeType === 'expense' && (
            <ExpenseForm onClose={onClose} onToast={onToast} user={user} />
          )}

          {/* Customer form: standalone (type='customer') OR inline from Trip */}
          {activeType === 'customer' && (
            <AddCustomerForm
              onBack={type === 'trip' || activeType !== type ? () => setActiveType('trip') : undefined}
              onCustomerAdded={handleCustomerAdded}
              onClose={onClose}
              onToast={onToast}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  )
}
