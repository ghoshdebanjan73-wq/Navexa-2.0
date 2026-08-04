/**
 * RecordExpenseModal.jsx
 * Professional Fleet Expense Management Modal for Navexa.
 * Provides category-specific structured forms for Fuel, Toll, Parking, Maintenance, and all other expense types.
 * Supports photo/bill uploads, Supabase storage, and full vehicle/driver/trip linking.
 */

import { useState, useEffect } from 'react'
import {
  X, TrendingDown, Loader2, IndianRupee, AlertCircle, Paperclip,
  Fuel, Route, Car, Wrench, User, Clock, MapPin, FileText,
  Hash, Phone, ChevronDown, CheckCircle2, Image, Trash2, Eye
} from 'lucide-react'
import { addTransaction, EXPENSE_CATEGORIES, FUEL_TYPES, PAYMENT_METHODS } from '../../data/transactionStore'
import { liveVehicles } from '../../data/vehicleStore'
import { liveDrivers } from '../../data/driverStore'
import { liveTrips } from '../../data/tripStore'
import { useUser } from '../../context/UserContext'
import { logAuditEvent } from '../../data/auditStore'
import { supabase } from '../../lib/supabase'

// ─── Small helper: form field wrapper ────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-ink">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-ink-soft">{hint}</p>}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink num outline-none transition-all focus:bg-surface focus:border-primary placeholder:text-ink-soft placeholder:font-normal"
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer"
    >
      {children}
    </select>
  )
}

function SectionHeader({ icon: Icon, title, color = 'bg-amber-50 text-amber-700' }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${color}`}>
      <Icon size={14} />
      <span className="text-xs font-extrabold uppercase tracking-wider">{title}</span>
    </div>
  )
}

// ─── FILE UPLOAD COMPONENT ────────────────────────────────────────────────────
function FileUploadArea({ file, onFileChange, onClear, label = 'Upload Bill / Receipt', accept = 'image/*,application/pdf' }) {
  const isImage = file && file.type.startsWith('image/')
  const previewUrl = isImage ? URL.createObjectURL(file) : null

  return (
    <div className="space-y-2">
      {file ? (
        <div className="relative rounded-xl border border-line bg-bg overflow-hidden">
          {isImage && previewUrl ? (
            <div className="relative h-28 w-full">
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                <span className="text-[10px] font-bold text-white truncate">{file.name}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink truncate">{file.name}</p>
                <p className="text-[10px] text-ink-soft">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-md"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-between rounded-xl border border-dashed border-line bg-bg p-3 cursor-pointer hover:bg-slate-50 hover:border-primary/50 transition-all">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <Paperclip size={15} />
            <span>{label}</span>
          </div>
          <span className="rounded-lg bg-surface border border-line px-2.5 py-1 text-[11px] font-bold text-ink whitespace-nowrap">
            Browse
          </span>
          <input
            type="file"
            accept={accept}
            onChange={e => { if (e.target.files && e.target.files[0]) onFileChange(e.target.files[0]) }}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}

// ─── CATEGORY-SPECIFIC SUB-FORM PANELS ───────────────────────────────────────

function FuelPanel({ data, onChange }) {
  return (
    <div className="space-y-3 rounded-xl bg-amber-50/40 border border-amber-100 p-4">
      <SectionHeader icon={Fuel} title="Fuel Details" color="bg-amber-50 text-amber-700" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fuel Type" required>
          <Select value={data.fuelType || ''} onChange={e => onChange('fuelType', e.target.value)}>
            <option value="">— Select —</option>
            {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>

        <Field label="Quantity (Litres / kWh)" hint="e.g. 45.5">
          <Input
            type="number"
            step="0.1"
            min="0"
            value={data.quantity || ''}
            onChange={e => onChange('quantity', e.target.value)}
            placeholder="e.g. 45.5"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate per Litre (₹)" hint="Auto-calculates total">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.ratePerUnit || ''}
            onChange={e => onChange('ratePerUnit', e.target.value)}
            placeholder="e.g. 96.50"
          />
        </Field>

        <Field label="Odometer Reading (km)">
          <Input
            type="number"
            min="0"
            value={data.odometer || ''}
            onChange={e => onChange('odometer', e.target.value)}
            placeholder="e.g. 58340"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fuel Pump Name">
          <Input
            type="text"
            value={data.pumpName || ''}
            onChange={e => onChange('pumpName', e.target.value)}
            placeholder="e.g. HP Petrol Pump"
          />
        </Field>

        <Field label="Pump Location">
          <Input
            type="text"
            value={data.pumpLocation || ''}
            onChange={e => onChange('pumpLocation', e.target.value)}
            placeholder="e.g. Hooghly Bypass"
          />
        </Field>
      </div>

      {/* Auto-calculated total notice */}
      {data.quantity && data.ratePerUnit && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-100/80 border border-amber-200 px-3 py-2">
          <CheckCircle2 size={14} className="text-amber-700 shrink-0" />
          <p className="text-xs font-bold text-amber-800">
            Calculated total: ₹{(Number(data.quantity) * Number(data.ratePerUnit)).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  )
}

function TollPanel({ data, onChange }) {
  return (
    <div className="space-y-3 rounded-xl bg-sky-50/40 border border-sky-100 p-4">
      <SectionHeader icon={Route} title="Toll Details" color="bg-sky-50 text-sky-700" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Toll Plaza Name">
          <Input
            type="text"
            value={data.plazaName || ''}
            onChange={e => onChange('plazaName', e.target.value)}
            placeholder="e.g. DND Flyover Toll"
          />
        </Field>

        <Field label="Plaza Location">
          <Input
            type="text"
            value={data.plazaLocation || ''}
            onChange={e => onChange('plazaLocation', e.target.value)}
            placeholder="e.g. NH-2, Faridabad"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="FASTag Used?">
          <Select value={data.fastagUsed || 'No'} onChange={e => onChange('fastagUsed', e.target.value)}>
            <option value="No">No — Cash Paid</option>
            <option value="Yes">Yes — FASTag</option>
          </Select>
        </Field>

        <Field label="Transaction / Receipt No">
          <Input
            type="text"
            value={data.transactionNo || ''}
            onChange={e => onChange('transactionNo', e.target.value)}
            placeholder="e.g. FT-8823991"
          />
        </Field>
      </div>
    </div>
  )
}

function ParkingPanel({ data, onChange }) {
  return (
    <div className="space-y-3 rounded-xl bg-purple-50/40 border border-purple-100 p-4">
      <SectionHeader icon={MapPin} title="Parking Details" color="bg-purple-50 text-purple-700" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Parking Name / Area">
          <Input
            type="text"
            value={data.parkingName || ''}
            onChange={e => onChange('parkingName', e.target.value)}
            placeholder="e.g. Airport Parking P3"
          />
        </Field>

        <Field label="Parking Location">
          <Input
            type="text"
            value={data.location || ''}
            onChange={e => onChange('location', e.target.value)}
            placeholder="e.g. Terminal 2, IGI Airport"
          />
        </Field>
      </div>

      <Field label="Duration (Hours)" hint="How many hours the vehicle was parked">
        <Input
          type="number"
          step="0.5"
          min="0"
          value={data.hours || ''}
          onChange={e => onChange('hours', e.target.value)}
          placeholder="e.g. 3"
        />
      </Field>
    </div>
  )
}

function MaintenancePanel({ data, onChange }) {
  const isRepair = data._category === 'Repair'
  return (
    <div className="space-y-3 rounded-xl bg-indigo-50/40 border border-indigo-100 p-4">
      <SectionHeader icon={Wrench} title={isRepair ? 'Repair Details' : 'Maintenance Details'} color="bg-indigo-50 text-indigo-700" />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Workshop Name">
          <Input
            type="text"
            value={data.workshopName || ''}
            onChange={e => onChange('workshopName', e.target.value)}
            placeholder="e.g. Rajesh Auto Garage"
          />
        </Field>

        <Field label="Mechanic Name">
          <Input
            type="text"
            value={data.mechanicName || ''}
            onChange={e => onChange('mechanicName', e.target.value)}
            placeholder="e.g. Suresh Kumar"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Invoice / Bill Number">
          <Input
            type="text"
            value={data.invoiceNumber || ''}
            onChange={e => onChange('invoiceNumber', e.target.value)}
            placeholder="e.g. SRV-2024-088"
          />
        </Field>

        <Field label="Next Service Due Date">
          <Input
            type="date"
            value={data.nextServiceDate || ''}
            onChange={e => onChange('nextServiceDate', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Work Description">
        <textarea
          value={data.workDescription || ''}
          onChange={e => onChange('workDescription', e.target.value)}
          placeholder="e.g. Oil change, brake pad replacement, engine check..."
          rows={2}
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary resize-none"
        />
      </Field>

      <Field label="Parts Replaced">
        <Input
          type="text"
          value={data.partsReplaced || ''}
          onChange={e => onChange('partsReplaced', e.target.value)}
          placeholder="e.g. Brake pads, Engine oil filter, Air filter"
        />
      </Field>

      <Field label="Workshop Contact / Phone">
        <Input
          type="tel"
          value={data.workshopPhone || ''}
          onChange={e => onChange('workshopPhone', e.target.value)}
          placeholder="e.g. 9876543210"
        />
      </Field>
    </div>
  )
}

// ─── MAIN MODAL COMPONENT ─────────────────────────────────────────────────────

export default function RecordExpenseModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  // Core fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Fuel')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [description, setDescription] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [tripId, setTripId] = useState('')
  const [vendor, setVendor] = useState('')
  const [vendorPhone, setVendorPhone] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [notes, setNotes] = useState('')

  // File upload
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPath, setReceiptPath] = useState('')

  // Category-specific metadata
  const [metadata, setMetadata] = useState({})

  // ─── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setError('')
      setUploadProgress('')
      setDate(new Date().toISOString().split('T')[0])
      setTime(new Date().toTimeString().slice(0, 5))
      setAmount('')
      setCategory('Fuel')
      setPaymentMethod('Cash')
      setDescription('')
      setVehicleId('')
      setDriverId('')
      setTripId('')
      setVendor('')
      setVendorPhone('')
      setBillNumber('')
      setNotes('')
      setReceiptFile(null)
      setReceiptPath('')
      setMetadata({})
    }
  }, [isOpen])

  if (!isOpen) return null

  // ─── Metadata handler ────────────────────────────────────────────────────────
  const handleMetadataChange = (key, value) => {
    setMetadata(prev => ({ ...prev, [key]: value }))
  }

  // ─── Fuel auto-calc ──────────────────────────────────────────────────────────
  const handleFuelMetaChange = (key, value) => {
    const updated = { ...metadata, [key]: value, _category: 'Fuel' }
    // Auto-calc total when both quantity and rate are set
    if ((key === 'quantity' || key === 'ratePerUnit') && updated.quantity && updated.ratePerUnit) {
      const calc = (Number(updated.quantity) * Number(updated.ratePerUnit)).toFixed(2)
      setAmount(calc)
    }
    setMetadata(updated)
  }

  // ─── Auto-generate description from category fields ──────────────────────────
  const autoDescription = () => {
    if (category === 'Fuel') {
      const parts = []
      if (metadata.fuelType) parts.push(metadata.fuelType)
      parts.push('refill')
      if (metadata.pumpName) parts.push(`at ${metadata.pumpName}`)
      if (metadata.pumpLocation) parts.push(`(${metadata.pumpLocation})`)
      return parts.join(' ')
    }
    if (category === 'Toll') return [metadata.plazaName, metadata.plazaLocation].filter(Boolean).join(' — ') || 'Toll charge'
    if (category === 'Parking') return [metadata.parkingName, metadata.location].filter(Boolean).join(', ') || 'Parking charge'
    if (category === 'Maintenance' || category === 'Repair') return [metadata.workshopName, metadata.workDescription].filter(Boolean).join(' — ') || `${category} expense`
    return ''
  }

  // ─── File Upload to Supabase ─────────────────────────────────────────────────
  const uploadFile = async (file) => {
    if (!file) return ''
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `expense_${category.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${fileExt}`
      const filePath = `expense-receipts/${fileName}`

      setUploadProgress('Uploading attachment...')

      const { data, error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, { upsert: true })

      if (!uploadErr && data) {
        setUploadProgress('')
        return data.path
      }
    } catch (err) {
      console.warn('Attachment upload notice (non-critical):', err)
    }
    setUploadProgress('')
    return ''
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return

    // Validation
    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive expense amount.')
      return
    }

    if (!vehicleId && category !== 'Office Expense' && category !== 'Miscellaneous' && category !== 'Other' && category !== 'Driver Salary' && category !== 'Driver Allowance' && category !== 'Driver Payment') {
      // Vehicle is strongly recommended but not required for all types
    }

    setSaving(true)
    setError('')

    // Upload attachment
    let uploadedPath = receiptPath
    if (receiptFile) {
      uploadedPath = await uploadFile(receiptFile)
    }

    // Generate description if empty
    const finalDescription = description.trim() || autoDescription() || `${category} expense`

    // Build structured metadata object
    const expenseMetadata = {
      category,
      ...metadata,
    }

    try {
      await addTransaction({
        type: 'Expense',
        category,
        subcategory: metadata.fuelType || '',
        amount: numAmount,
        description: finalDescription,
        paymentMethod,
        date,
        time,
        vehicleId,
        driverId,
        tripId,
        vendor: vendor.trim(),
        vendorPhone: vendorPhone.trim(),
        billNumber: billNumber.trim() || metadata.invoiceNumber || metadata.transactionNo || '',
        reference: billNumber.trim() || metadata.invoiceNumber || metadata.transactionNo || '',
        receiptPath: uploadedPath,
        notes: notes.trim(),
        createdBy: currentUser?.name || 'Dispatcher',
        expenseMetadata,
      }, currentUser?.id)

      // Log Audit Event
      await logAuditEvent({
        action: 'CREATE',
        entityType: 'Finance',
        entityId: `TXN-${Date.now()}`,
        entityLabel: finalDescription,
        description: `Expense recorded: ${category} — ₹${numAmount} ${vendor ? `from ${vendor}` : ''}`,
        user: currentUser,
      })

      if (onSuccess) onSuccess(`₹${numAmount} ${category} expense recorded successfully!`)
      onClose()
    } catch (err) {
      console.error('Error recording expense:', err)
      setError(err.message || 'Failed to record expense entry.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Category Icon ────────────────────────────────────────────────────────────
  const showFuelPanel = category === 'Fuel'
  const showTollPanel = category === 'Toll'
  const showParkingPanel = category === 'Parking'
  const showMaintenancePanel = category === 'Maintenance' || category === 'Repair' || category === 'Tyres'

  // Category colors for header
  const catColor = showFuelPanel ? 'bg-amber-600'
    : showTollPanel ? 'bg-sky-600'
    : showParkingPanel ? 'bg-purple-600'
    : showMaintenancePanel ? 'bg-indigo-600'
    : category === 'Insurance' || category === 'Pollution Certificate' || category === 'Road Tax' ? 'bg-teal-600'
    : 'bg-rose-600'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 pt-8 pb-8 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-pop animate-scaleUp overflow-hidden">

        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-line ${catColor.replace('bg-', 'bg-').replace('-600', '-50')}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs ${catColor}`}>
              {showFuelPanel ? <Fuel size={18} /> : showTollPanel ? <Route size={18} /> : showParkingPanel ? <MapPin size={18} /> : showMaintenancePanel ? <Wrench size={18} /> : <TrendingDown size={18} />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Record Fleet Expense</h3>
              <p className="text-xs text-ink-soft">
                {showFuelPanel ? 'Fuel refill with pump details & odometer' : showTollPanel ? 'Toll charge with plaza details' : showParkingPanel ? 'Parking charge with location' : showMaintenancePanel ? 'Workshop service or repair record' : 'General operational expense entry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Form Body ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {uploadProgress && (
          <div className="flex items-center gap-2 mx-5 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-700">
            <Loader2 size={14} className="animate-spin shrink-0" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[72vh] overflow-y-auto">

          {/* ─── STEP 1: Category & Core Info ─── */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expense Category" required>
              <Select value={category} onChange={e => { setCategory(e.target.value); setMetadata({ _category: e.target.value }) }}>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </Field>

            <Field label="Amount (₹)" required>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                  <IndianRupee size={13} />
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-line bg-bg pl-8 pr-3.5 py-2 text-xs font-bold text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>
            </Field>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expense Date" required>
              <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </Field>
            <Field label="Expense Time">
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </Field>
          </div>

          {/* ─── STEP 2: Vehicle & Driver ─── */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle" hint="Link to vehicle profile">
              <Select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                <option value="">— Select Vehicle —</option>
                {liveVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.reg || v.id})</option>
                ))}
              </Select>
            </Field>

            <Field label="Driver (Optional)">
              <Select value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">— Select Driver —</option>
                {liveDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Related Trip */}
          <Field label="Related Trip (Optional)" hint="Link this expense to a specific trip">
            <Select value={tripId} onChange={e => setTripId(e.target.value)}>
              <option value="">— No Trip Link —</option>
              {liveTrips.slice(0, 50).map(t => (
                <option key={t.id} value={t.id}>{t.id} — {t.customer || t.pickup || 'Trip'}</option>
              ))}
            </Select>
          </Field>

          {/* ─── STEP 3: Category-Specific Sub-Panel ─── */}
          {showFuelPanel && (
            <FuelPanel
              data={metadata}
              onChange={handleFuelMetaChange}
            />
          )}

          {showTollPanel && (
            <TollPanel
              data={metadata}
              onChange={(k, v) => handleMetadataChange(k, v)}
            />
          )}

          {showParkingPanel && (
            <ParkingPanel
              data={metadata}
              onChange={(k, v) => handleMetadataChange(k, v)}
            />
          )}

          {showMaintenancePanel && (
            <MaintenancePanel
              data={{ ...metadata, _category: category }}
              onChange={(k, v) => handleMetadataChange(k, v)}
            />
          )}

          {/* ─── STEP 4: Vendor & Bill Info ─── */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={category === 'Fuel' ? 'Fuel Pump / Vendor' : 'Vendor / Payee'}>
              <Input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder={category === 'Fuel' ? 'e.g. Indian Oil Pump' : 'e.g. Garage / Vendor'}
              />
            </Field>

            <Field label="Vendor Phone">
              <Input
                type="tel"
                value={vendorPhone}
                onChange={e => setVendorPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill / Invoice No">
              <Input
                type="text"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                placeholder="e.g. BILL-09872"
              />
            </Field>

            <Field label="Payment Method" required>
              <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Description (editable, auto-generated) */}
          <Field label="Description" hint="Auto-generated from fields above — edit if needed">
            <input
              type="text"
              value={description || autoDescription()}
              onChange={e => setDescription(e.target.value)}
              placeholder={autoDescription() || 'Brief description of this expense...'}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary"
            />
          </Field>

          {/* ─── STEP 5: Bill / Receipt Upload ─── */}
          <Field label="Bill / Receipt Attachment" hint="Upload fuel bill, toll receipt, workshop invoice, parking slip...">
            <FileUploadArea
              file={receiptFile}
              onFileChange={setReceiptFile}
              onClear={() => { setReceiptFile(null); setReceiptPath('') }}
              label={
                category === 'Fuel' ? 'Upload Fuel Bill' :
                category === 'Toll' ? 'Upload Toll Receipt' :
                category === 'Parking' ? 'Upload Parking Slip' :
                'Upload Bill / Invoice'
              }
            />
          </Field>

          {/* Notes */}
          <Field label="Notes / Remarks">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this expense..."
              rows={2}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-semibold text-ink outline-none transition-all focus:bg-surface focus:border-primary resize-none"
            />
          </Field>

        </form>

        {/* ─── Footer Actions ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 bg-bg">
          <div className="text-[10px] text-ink-soft">
            Recorded by: <span className="font-bold text-ink">{currentUser?.name || 'Dispatcher'}</span>
          </div>
          <div className="flex items-center gap-2">
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
              form="expense-form"
              onClick={handleSubmit}
              disabled={saving}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${catColor} hover:opacity-90`}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save {category} Expense</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
