import { useState, useEffect } from 'react'
import { X, Loader2, Car } from 'lucide-react'
import { editVehicle, liveVehicles, normaliseReg } from '../../data/vehicleStore'

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

export default function EditVehicleModal({ vehicle, onClose, onSaved, user }) {
  const [name,         setName]         = useState(vehicle?.name || '')
  const [reg,          setReg]          = useState(vehicle?.reg || '')
  const [type,         setType]         = useState(vehicle?.type || 'Sedan')
  const [seats,        setSeats]        = useState(vehicle?.seats ? String(vehicle.seats) : '4')
  const [status,       setStatus]       = useState(vehicle?.status || 'Available')
  const [notes,        setNotes]        = useState(vehicle?.notes || '')
  const [errors,       setErrors]       = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const validate = () => {
    const e = {}
    if (!name.trim()) {
      e.name = 'Enter vehicle name or model.'
    }
    if (!reg.trim()) {
      e.reg = 'Enter registration number.'
    } else {
      const target = normaliseReg(reg)
      const existing = liveVehicles.find(
        v => v.id !== vehicle.id && normaliseReg(v.reg) === target
      )
      if (existing) {
        e.reg = `A vehicle with registration "${existing.reg}" already exists.`
      }
    }
    if (!type) {
      e.type = 'Select vehicle type.'
    }
    if (seats !== '' && (isNaN(Number(seats)) || Number(seats) <= 0 || !Number.isInteger(Number(seats)))) {
      e.seats = 'Enter a valid positive seating capacity (e.g. 4, 6, 7).'
    }
    if (!status) {
      e.status = 'Select current status.'
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
      editVehicle(vehicle.id, {
        name:  name.trim(),
        reg:   reg.trim().toUpperCase(),
        type,
        seats: seats ? Number(seats) : 4,
        status,
        notes: notes.trim(),
      }, user?.name || 'Banjo')

      setIsSubmitting(false)
      if (onSaved) onSaved('Vehicle details updated successfully.')
      onClose()
    }, 350)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Vehicle"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Car size={18} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink leading-tight">Edit Vehicle</h3>
              <p className="text-[11px] text-ink-soft">Update fleet vehicle details.</p>
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
          {/* A. Vehicle Name / Model */}
          <div>
            <FieldLabel required>Vehicle Name / Model</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: null })) }}
              placeholder="e.g. Swift Dzire, Innova Crysta"
              className={fieldCls(errors.name)}
              autoFocus
            />
            <FieldError msg={errors.name} />
          </div>

          {/* B. Registration Number */}
          <div>
            <FieldLabel required>Registration Number</FieldLabel>
            <input
              type="text"
              value={reg}
              onChange={e => { setReg(e.target.value); setErrors(p => ({ ...p, reg: null })) }}
              placeholder="e.g. WB-12 AB 4521"
              className={fieldCls(errors.reg)}
            />
            <FieldError msg={errors.reg} />
          </div>

          {/* C. Vehicle Type & D. Seating Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <FieldLabel required>Vehicle Type</FieldLabel>
              <select
                value={type}
                onChange={e => { setType(e.target.value); setErrors(p => ({ ...p, type: null })) }}
                className={fieldCls(errors.type)}
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="MUV">MUV</option>
                <option value="Other">Other</option>
              </select>
              <FieldError msg={errors.type} />
            </div>

            <div>
              <FieldLabel optional>Seating Capacity</FieldLabel>
              <input
                type="number"
                min="1"
                step="1"
                value={seats}
                onChange={e => { setSeats(e.target.value); setErrors(p => ({ ...p, seats: null })) }}
                placeholder="4"
                className={fieldCls(errors.seats)}
              />
              <FieldError msg={errors.seats} />
            </div>
          </div>

          {/* E. Current Status */}
          <div>
            <FieldLabel required>Current Status</FieldLabel>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setErrors(p => ({ ...p, status: null })) }}
              className={fieldCls(errors.status)}
            >
              <option value="Available">Available (Ready for Trips)</option>
              <option value="On Trip">On Trip (Active Assignment)</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
            <FieldError msg={errors.status} />
          </div>

          {/* F. Notes */}
          <div>
            <FieldLabel optional>Notes</FieldLabel>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Regular airport vehicle, AC available, luggage carrier..."
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
            />
          </div>

          {/* Form Actions */}
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
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-90 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
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
