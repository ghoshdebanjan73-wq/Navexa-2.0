import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { editCustomer, findByPhone } from '../../data/customerStore'

const fieldCls = (hasError) =>
  `w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
    hasError
      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
      : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
  }`

function FieldLabel({ children, optional = false, required = false }) {
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

export default function EditCustomerModal({ customer, onClose, onSaved, user }) {
  const [name,         setName]         = useState(customer?.name || '')
  const [phone,        setPhone]        = useState(customer?.phone || '')
  const [email,        setEmail]        = useState(customer?.email || '')
  const [address,      setAddress]      = useState(customer?.address || '')
  const [notes,        setNotes]        = useState(customer?.notes || '')
  const [errors,       setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!customer) return null

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

    // Check duplicate phone (excluding current customer ID)
    const existing = findByPhone(phone, customer.id)
    if (existing) {
      setErrors({ phone: `Another customer with this phone number already exists (${existing.name}).` })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    setTimeout(() => {
      editCustomer(customer.id, {
        name:    name.trim(),
        phone:   phone.trim(),
        email:   email.trim(),
        address: address.trim(),
        notes:   notes.trim(),
      }, user?.name || 'Banjo')

      setIsSubmitting(false)
      if (onSaved) onSaved('Customer information updated successfully.')
      onClose()
    }, 350)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Customer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-ink">Edit Customer</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })) }}
              placeholder="Enter customer name"
              className={fieldCls(errors.name)}
              autoComplete="name"
            />
            <FieldError msg={errors.name} />
          </div>

          {/* Phone + Email */}
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

          {/* Address */}
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

          {/* Notes */}
          <div>
            <FieldLabel optional>Notes</FieldLabel>
            <textarea
              rows={3}
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
              onClick={onClose}
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
                <><Loader2 size={15} className="animate-spin" /> Saving Changes...</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
