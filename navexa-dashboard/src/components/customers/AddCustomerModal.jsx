import { useState, useEffect } from 'react'
import { X, UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { addCustomer, findByPhone } from '../../data/customerStore'
import { useUser } from '../../context/UserContext'

export default function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState('Phone')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('India')
  const [postalCode, setPostalCode] = useState('')
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setName('')
      setPhone('')
      setEmail('')
      setCompanyName('')
      setPreferredContactMethod('Phone')
      setAddress('')
      setCity('')
      setState('')
      setCountry('India')
      setPostalCode('')
      setStatus('Active')
      setNotes('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const validate = () => {
    if (!name.trim()) return 'Full Name is required.'
    if (!phone.trim()) return 'Phone Number is required.'

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.'
    }

    const existing = findByPhone(phone)
    if (existing) {
      return `A customer with phone number "${phone.trim()}" already exists (${existing.name}).`
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setSaving(true)
    setError('')

    try {
      await addCustomer(
        {
          name,
          phone,
          email,
          companyName,
          preferredContactMethod,
          address,
          city,
          state,
          country,
          postalCode,
          status,
          notes,
        },
        currentUser?.id
      )

      if (onSuccess) onSuccess('Customer created successfully!')
      onClose()
    } catch (err) {
      console.error('Error adding customer:', err)
      setError(err.message || 'Failed to create customer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="my-8 w-full max-w-xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Add New Customer</h3>
              <p className="text-xs text-ink-soft">Enter customer contact and CRM details.</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anish Roy"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Business / Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Business / Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp Solutions"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Preferred Contact Method */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Preferred Contact Method</label>
              <select
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
              >
                <option value="Phone">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
              </select>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. anish@example.com"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-ink">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or landmark"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kolkata"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. West Bengal"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 700001"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-ink">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special preferences, VIP status, billing instructions..."
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>Add Customer</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
