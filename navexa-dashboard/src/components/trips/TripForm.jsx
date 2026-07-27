import { useState, useEffect } from 'react'
import { Plus, Loader2, IndianRupee, Calendar, Clock, Lock } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { liveVehicles, subscribeVehicles, getEffectiveVehicleStatus } from '../../data/vehicleStore'
import { addTrip, editTrip, PAYMENT_STATUSES, formatINR } from '../../data/tripStore'
import { getCustomerNames, subscribeCustomers, addCustomer, findByPhone, getCustomerByName } from '../../data/customerStore'
import { getTripAmountPaid } from '../../data/paymentStore'
import { addActivity } from '../../data/transactionStore'

// Helper: today in YYYY-MM-DD format for <input type="date">
const todayISO = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Convert formatted trip date ("27 Jul" or "27 Jul 2026") to YYYY-MM-DD for date input */
export function parseDateToISO(dateStr) {
  if (!dateStr) return todayISO()
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  const parts = dateStr.trim().split(/\s+/)
  if (parts.length >= 2) {
    const day = parts[0].padStart(2, '0')
    const monthStr = parts[1].toLowerCase()
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    }
    const month = months[monthStr.substring(0, 3)] || '01'
    const year = parts[2] || new Date().getFullYear()
    return `${year}-${month}-${day}`
  }
  return todayISO()
}

/** Convert formatted trip time ("10:30 AM" or "02:30 PM") to 24h "HH:MM" for time input */
export function parseTimeTo24h(timeStr) {
  if (!timeStr) return '10:30'
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr

  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (match) {
    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const ampm = match[3] ? match[3].toUpperCase() : null

    if (ampm === 'PM' && hours < 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0

    return `${String(hours).padStart(2, '0')}:${minutes}`
  }
  return '10:30'
}

// Helper: convert YYYY-MM-DD to "27 Jul" or "27 Jul 2026"
export function formatTripDate(isoStr) {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length !== 3) return isoStr
  const [y, m, d] = parts
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d))
  if (isNaN(dateObj.getTime())) return isoStr
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// Helper: convert 24h "14:30" to 12h "02:30 PM"
export function formatTripTime(time24) {
  if (!time24) return ''
  const parts = time24.split(':')
  if (parts.length < 2) return time24
  let hours = Number(parts[0])
  const minutes = parts[1]
  if (isNaN(hours)) return time24
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const strHours = String(hours).padStart(2, '0')
  return `${strHours}:${minutes} ${ampm}`
}

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

// ─── Inline Add Customer Form ──────────────────────────────────────────────────
function AddCustomerSubForm({ onCustomerAdded, onCancel, user }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = "Enter the customer's name."
    if (!phone.trim()) errs.phone = 'Enter a phone number.'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.'
    }
    if (Object.keys(errs).length) { setErrors(errs); return }

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
        name: trimmedName,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        createdBy: user?.id || 'U-01',
      }, user?.name || 'Banjo')

      setIsSubmitting(false)
      onCustomerAdded(trimmedName)
    }, 300)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn" noValidate>
      <div className="rounded-xl border border-primary/30 bg-primary-50/50 p-3 mb-2">
        <p className="text-xs font-bold text-primary">Adding New Customer</p>
        <p className="text-[11px] text-ink-soft">Customer will be saved and preselected for this trip.</p>
      </div>

      <div>
        <FieldLabel required>Full Name</FieldLabel>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })) }}
          placeholder="Enter customer name"
          className={fieldCls(errors.name)}
          autoFocus
        />
        <FieldError msg={errors.name} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Phone Number</FieldLabel>
          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: null })) }}
            placeholder="+91 98765 43210"
            className={fieldCls(errors.phone)}
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
          />
          <FieldError msg={errors.email} />
        </div>
      </div>

      <div>
        <FieldLabel optional>Address</FieldLabel>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="e.g. 12 G.T. Road, Hooghly"
          className={fieldCls(false)}
        />
      </div>

      <div>
        <FieldLabel optional>Notes</FieldLabel>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Preferences, special requirements..."
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-4 py-2 text-xs sm:text-sm font-semibold text-ink-soft hover:bg-slate-100 cursor-pointer"
        >
          Back to Trip
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
// MAIN CANONICAL TRIP FORM (Supports Create & Edit Modes)
// ═══════════════════════════════════════════════════════════════════════════════
export default function TripForm({ onClose, onSaved, initialCustomer = '', tripToEdit = null, user }) {
  const isEditMode = Boolean(tripToEdit)

  const [customerNames, setCustomerNames] = useState(getCustomerNames())
  const [fleetVehicles, setFleetVehicles] = useState([...liveVehicles])
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  // Subscribe to customerStore & vehicleStore
  useEffect(() => {
    const unsubCust = subscribeCustomers(() => setCustomerNames(getCustomerNames()))
    const unsubVeh  = subscribeVehicles(snap => setFleetVehicles([...snap]))
    return () => {
      unsubCust()
      unsubVeh()
    }
  }, [])

  // Initial State: Pre-fill if tripToEdit is provided
  const [customer,      setCustomer]      = useState(tripToEdit?.customer || initialCustomer)
  const [pickup,        setPickup]        = useState(tripToEdit?.pickupLocation || '')
  const [destination,   setDestination]   = useState(tripToEdit?.destination || '')
  const [tripDate,      setTripDate]      = useState(tripToEdit ? parseDateToISO(tripToEdit.tripDate) : todayISO())
  const [tripTime,      setTripTime]      = useState(tripToEdit ? parseTimeTo24h(tripToEdit.tripTime) : '10:30')
  const [vehicle,       setVehicle]       = useState(tripToEdit?.vehicle || '')
  const [fare,          setFare]          = useState(tripToEdit ? String(tripToEdit.fare) : '')
  const [paymentStatus, setPaymentStatus] = useState(tripToEdit?.paymentStatus || 'Unpaid')
  const [notes,         setNotes]         = useState(tripToEdit?.notes || '')
  const [errors,        setErrors]        = useState({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)

  const validate = () => {
    const e = {}
    if (!customer)           e.customer    = 'Select a customer.'
    if (!pickup.trim())      e.pickup      = 'Enter a pickup location.'
    if (!destination.trim()) e.destination = 'Enter a destination.'
    if (!tripDate)           e.tripDate    = 'Select a trip date.'
    if (!tripTime)           e.tripTime    = 'Select a trip time.'
    if (!vehicle)            e.vehicle     = 'Select a vehicle.'
    if (!fare || Number(fare) <= 0) {
      e.fare = 'Enter a valid fare.'
    } else if (isEditMode && tripToEdit) {
      const amountPaid = getTripAmountPaid(tripToEdit.id, tripToEdit.fare, tripToEdit.paymentStatus)
      if (amountPaid > 0 && Number(fare) < amountPaid) {
        e.fare = `Fare cannot be less than the amount already paid (${formatINR(amountPaid)}).`
      }
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
      const vehicleObj = fleetVehicles.find(v => v.name === vehicle || v.id === vehicle)
      const customerObj = getCustomerByName(customer)
      const formattedDateStr = formatTripDate(tripDate)
      const formattedTimeStr = formatTripTime(tripTime)

      if (isEditMode) {
        // Edit mode: mutate existing trip record by ID
        editTrip(tripToEdit.id, {
          customerId:     customerObj?.id || tripToEdit.customerId || '',
          customer,
          pickupLocation: pickup.trim(),
          destination:    destination.trim(),
          tripDate:       formattedDateStr,
          tripTime:       formattedTimeStr,
          vehicle,
          vehicleId:      vehicleObj?.id || tripToEdit.vehicleId || '',
          vehicleReg:     vehicleObj?.reg || tripToEdit.vehicleReg || '',
          fare:           Number(fare),
          paymentStatus,
          notes:          notes.trim(),
        }, user?.name || 'Banjo')

        setIsSubmitting(false)
        if (onSaved) onSaved('Trip updated successfully.')
      } else {
        // Create mode: add new trip record
        addTrip({
          customer,
          customerId:     customerObj?.id || '',
          pickupLocation: pickup.trim(),
          destination:    destination.trim(),
          tripDate:       formattedDateStr,
          tripTime:       formattedTimeStr,
          vehicle,
          vehicleId:      vehicleObj?.id || '',
          vehicleReg:     vehicleObj?.reg || '',
          fare:           Number(fare),
          paymentStatus,
          notes:          notes.trim(),
          createdBy:      user?.id || 'U-01',
        }, user?.name || 'Banjo')

        setIsSubmitting(false)
        if (onSaved) onSaved('Trip added successfully.')
      }

      if (onClose) onClose()
    }, 350)
  }

  if (showAddCustomer) {
    return (
      <AddCustomerSubForm
        user={user}
        onCustomerAdded={(newCustName) => {
          setCustomer(newCustName)
          setShowAddCustomer(false)
        }}
        onCancel={() => setShowAddCustomer(false)}
      />
    )
  }

  const isOngoing = tripToEdit?.status === 'Ongoing'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn" noValidate>
      {/* 1. Customer Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-ink">
            Customer <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowAddCustomer(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            <Plus size={12} /> Add New Customer
          </button>
        </div>
        <select
          value={customer}
          onChange={e => {
            if (e.target.value === '__add_new__') { setShowAddCustomer(true); return }
            setCustomer(e.target.value)
            setErrors(p => ({ ...p, customer: null }))
          }}
          className={fieldCls(errors.customer)}
        >
          <option value="">— Select customer —</option>
          {customerNames.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__add_new__">+ Add New Customer...</option>
        </select>
        <FieldError msg={errors.customer} />
      </div>

      {/* 2. Pickup + Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Pickup Location</FieldLabel>
          <input
            type="text"
            value={pickup}
            placeholder="e.g. Hooghly"
            onChange={e => { setPickup(e.target.value); setErrors(p => ({ ...p, pickup: null })) }}
            className={fieldCls(errors.pickup)}
          />
          <FieldError msg={errors.pickup} />
        </div>
        <div>
          <FieldLabel required>Destination</FieldLabel>
          <input
            type="text"
            value={destination}
            placeholder="e.g. Kolkata"
            onChange={e => { setDestination(e.target.value); setErrors(p => ({ ...p, destination: null })) }}
            className={fieldCls(errors.destination)}
          />
          <FieldError msg={errors.destination} />
        </div>
      </div>

      {/* 3. Trip Date + Trip Time (Calendar & Time pickers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Trip Date</FieldLabel>
          <div className="relative">
            <input
              type="date"
              value={tripDate}
              onChange={e => { setTripDate(e.target.value); setErrors(p => ({ ...p, tripDate: null })) }}
              className={fieldCls(errors.tripDate)}
            />
          </div>
          <FieldError msg={errors.tripDate} />
        </div>

        <div>
          <FieldLabel required>Trip Time</FieldLabel>
          <div className="relative">
            <input
              type="time"
              value={tripTime}
              onChange={e => { setTripTime(e.target.value); setErrors(p => ({ ...p, tripTime: null })) }}
              className={fieldCls(errors.tripTime)}
            />
          </div>
          <FieldError msg={errors.tripTime} />
        </div>
      </div>

      {/* 4. Vehicle Selection & Fare */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FieldLabel required>Vehicle</FieldLabel>
          {isOngoing ? (
            <div className="rounded-xl border border-line bg-bg p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Lock size={13} className="text-amber-600" />
                <span>{vehicle} {tripToEdit?.vehicleReg ? `(${tripToEdit.vehicleReg})` : ''}</span>
              </div>
              <p className="text-[11px] font-semibold text-amber-700 mt-0.5">
                Vehicle cannot be changed while the trip is ongoing.
              </p>
            </div>
          ) : (
            <select
              value={vehicle}
              onChange={e => { setVehicle(e.target.value); setErrors(p => ({ ...p, vehicle: null })) }}
              className={fieldCls(errors.vehicle)}
            >
              <option value="">— Select vehicle —</option>
              {fleetVehicles.map(v => {
                const effStatus = getEffectiveVehicleStatus(v)
                const isCurrentlyAssigned = (tripToEdit?.vehicle && v.name === tripToEdit.vehicle) || (tripToEdit?.vehicleId && v.id === tripToEdit.vehicleId)
                const isDisabled = effStatus !== 'Available' && !isCurrentlyAssigned

                return (
                  <option
                    key={v.id}
                    value={v.name}
                    disabled={isDisabled}
                  >
                    {v.name} ({v.reg}) — {effStatus}{isDisabled ? ' (Unavailable)' : ''}
                  </option>
                )
              })}
            </select>
          )}
          <FieldError msg={errors.vehicle} />
        </div>

        <div>
          <FieldLabel required>Fare (₹)</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
              <IndianRupee size={13} strokeWidth={2.5} />
            </span>
            <input
              type="number"
              min="1"
              value={fare}
              placeholder="0"
              onChange={e => { setFare(e.target.value); setErrors(p => ({ ...p, fare: null })) }}
              className={`${fieldCls(errors.fare)} pl-8 num`}
            />
          </div>
          <FieldError msg={errors.fare} />
        </div>
      </div>

      {/* 5. Payment Status */}
      <div>
        <FieldLabel>Payment Status</FieldLabel>
        <select
          value={paymentStatus}
          onChange={e => setPaymentStatus(e.target.value)}
          className={fieldCls(false)}
        >
          {PAYMENT_STATUSES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* 6. Notes */}
      <div>
        <FieldLabel optional>Notes / Instructions</FieldLabel>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Driver instructions, luggage details, special requests..."
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
        />
      </div>

      {/* Form Action Buttons */}
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
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> {isEditMode ? 'Saving...' : 'Adding...'}</>
          ) : (
            isEditMode ? 'Save Changes' : 'Add Trip'
          )}
        </button>
      </div>
    </form>
  )
}
