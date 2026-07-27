import { useState, useEffect } from 'react'
import { X, Loader2, Wrench, IndianRupee } from 'lucide-react'
import { addMaintenanceRecord } from '../../data/maintenanceStore'
import { updateVehicleStatus } from '../../data/vehicleStore'

const MAINTENANCE_TYPES = [
  'Regular Service',
  'Oil Change',
  'Tyre Work',
  'Repair',
  'AC Service',
  'Battery',
  'Cleaning',
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

export default function AddMaintenanceModal({ vehicle, onClose, onSaved, user }) {
  const [type,            setType]            = useState('Regular Service')
  const [serviceDate,     setServiceDate]     = useState(todayISO())
  const [cost,            setCost]            = useState('')
  const [odometer,        setOdometer]        = useState('')
  const [serviceProvider, setServiceProvider] = useState('')
  const [notes,           setNotes]           = useState('')
  const [setStatusMnt,    setSetStatusMnt]    = useState(false)
  const [errors,          setErrors]          = useState({})
  const [isSubmitting,    setIsSubmitting]    = useState(false)

  // Escape key to close
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const validate = () => {
    const e = {}
    if (!type) {
      e.type = 'Select maintenance type.'
    }
    if (!serviceDate) {
      e.serviceDate = 'Select service date.'
    }
    if (cost === '' || isNaN(Number(cost)) || Number(cost) < 0) {
      e.cost = 'Enter a valid cost amount (₹).'
    }
    if (odometer !== '' && (isNaN(Number(odometer)) || Number(odometer) <= 0)) {
      e.odometer = 'Enter a valid odometer reading in km.'
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
      // 1. Add maintenance record
      addMaintenanceRecord({
        vehicleId: vehicle.id,
        type,
        serviceDate,
        cost: Number(cost),
        odometer: odometer ? Number(odometer) : null,
        serviceProvider: serviceProvider.trim(),
        notes: notes.trim(),
      }, user?.name || 'Banjo')

      // 2. Optionally update vehicle status if user checked "Set status to Maintenance"
      if (setStatusMnt) {
        updateVehicleStatus(vehicle.id, 'Maintenance', user?.name || 'Banjo')
      }

      setIsSubmitting(false)
      if (onSaved) onSaved('Maintenance record added successfully.')
      onClose()
    }, 350)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Maintenance"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Wrench size={18} strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-ink leading-tight">Add Maintenance Record</h3>
              <p className="text-[11px] text-ink-soft">Record service or repair work for this vehicle.</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-4" noValidate>
          
          {/* Pre-selected Vehicle Banner */}
          <div className="rounded-xl border border-line bg-bg p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Vehicle</p>
              <p className="text-xs sm:text-sm font-extrabold text-ink mt-0.5">{vehicle.name}</p>
            </div>
            <span className="rounded-md bg-surface border border-line px-2.5 py-1 text-xs font-bold text-ink-soft num">
              {vehicle.reg}
            </span>
          </div>

          {/* Maintenance Type */}
          <div>
            <FieldLabel required>Maintenance Type</FieldLabel>
            <select
              value={type}
              onChange={e => { setType(e.target.value); setErrors(p => ({ ...p, type: null })) }}
              className={fieldCls(errors.type)}
              autoFocus
            >
              {MAINTENANCE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <FieldError msg={errors.type} />
          </div>

          {/* Date + Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <FieldLabel required>Service Date</FieldLabel>
              <input
                type="date"
                value={serviceDate}
                onChange={e => { setServiceDate(e.target.value); setErrors(p => ({ ...p, serviceDate: null })) }}
                className={fieldCls(errors.serviceDate)}
              />
              <FieldError msg={errors.serviceDate} />
            </div>

            <div>
              <FieldLabel required>Cost (₹)</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
                  <IndianRupee size={13} strokeWidth={2.5} />
                </span>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={e => { setCost(e.target.value); setErrors(p => ({ ...p, cost: null })) }}
                  placeholder="2500"
                  className={`${fieldCls(errors.cost)} pl-8 num`}
                />
              </div>
              <FieldError msg={errors.cost} />
            </div>
          </div>

          {/* Odometer + Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <FieldLabel optional>Odometer Reading (km)</FieldLabel>
              <input
                type="number"
                min="1"
                value={odometer}
                onChange={e => { setOdometer(e.target.value); setErrors(p => ({ ...p, odometer: null })) }}
                placeholder="45200"
                className={`${fieldCls(errors.odometer)} num`}
              />
              <FieldError msg={errors.odometer} />
            </div>

            <div>
              <FieldLabel optional>Service Provider</FieldLabel>
              <input
                type="text"
                value={serviceProvider}
                onChange={e => setServiceProvider(e.target.value)}
                placeholder="e.g. Maruti Service Centre"
                className={fieldCls(false)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel optional>Notes / Description</FieldLabel>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Engine oil and oil filter replaced, wheel alignment..."
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
            />
          </div>

          {/* Optional Vehicle Status Checkbox */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={setStatusMnt}
                onChange={e => setSetStatusMnt(e.target.checked)}
                className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span className="text-xs font-semibold text-ink">
                Set vehicle status to <strong className="text-amber-800 font-bold">Maintenance</strong>
              </span>
            </label>
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
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-90 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Adding...</>
              ) : (
                'Add Maintenance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
