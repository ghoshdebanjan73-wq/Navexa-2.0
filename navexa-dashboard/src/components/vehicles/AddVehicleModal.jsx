import { useState, useEffect } from 'react'
import { X, Car, Upload, Loader2, AlertCircle, FileText, Wrench } from 'lucide-react'
import { addVehicle, normaliseReg, liveVehicles } from '../../data/vehicleStore'
import { liveDrivers } from '../../data/driverStore'
import { useUser } from '../../context/UserContext'

export default function AddVehicleModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Specs
  const [name, setName] = useState('')
  const [reg, setReg] = useState('')
  const [type, setType] = useState('Sedan')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [manufacturingYear, setManufacturingYear] = useState('')
  const [color, setColor] = useState('')
  const [fuelType, setFuelType] = useState('Diesel')
  const [seats, setSeats] = useState(4)
  const [odometer, setOdometer] = useState('')
  const [assignedDriverId, setAssignedDriverId] = useState('')
  const [status, setStatus] = useState('Available')

  // Photo
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  // Documents
  const [rcNumber, setRcNumber] = useState('')
  const [rcExpiry, setRcExpiry] = useState('')
  const [rcDocPreview, setRcDocPreview] = useState('')

  const [insurancePolicy, setInsurancePolicy] = useState('')
  const [insuranceExpiry, setInsuranceExpiry] = useState('')
  const [insuranceDocPreview, setInsuranceDocPreview] = useState('')

  const [fitnessExpiry, setFitnessExpiry] = useState('')
  const [fitnessDocPreview, setFitnessDocPreview] = useState('')

  const [pollutionExpiry, setPollutionExpiry] = useState('')

  const [permitExpiry, setPermitExpiry] = useState('')
  const [permitDocPreview, setPermitDocPreview] = useState('')

  // Maintenance Schedule
  const [nextServiceDate, setNextServiceDate] = useState('')
  const [nextServiceOdometer, setNextServiceOdometer] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setName('')
      setReg('')
      setType('Sedan')
      setBrand('')
      setModel('')
      setManufacturingYear('')
      setColor('')
      setFuelType('Diesel')
      setSeats(4)
      setOdometer('')
      setAssignedDriverId('')
      setStatus('Available')
      setPhotoPreview('')
      setPhotoFile(null)
      setRcNumber('')
      setRcExpiry('')
      setRcDocPreview('')
      setInsurancePolicy('')
      setInsuranceExpiry('')
      setInsuranceDocPreview('')
      setFitnessExpiry('')
      setFitnessDocPreview('')
      setPollutionExpiry('')
      setPermitExpiry('')
      setPermitDocPreview('')
      setNextServiceDate('')
      setNextServiceOdometer('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    if (!name.trim()) return 'Vehicle Name is required.'
    if (!reg.trim()) return 'Registration Number is required.'
    if (!type.trim()) return 'Vehicle Type is required.'

    const norm = normaliseReg(reg)
    const isDup = liveVehicles.some(v => normaliseReg(v.reg) === norm)
    if (isDup) {
      return `Registration Number "${reg.trim().toUpperCase()}" already exists in fleet.`
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
      let driverName = 'Unassigned'
      if (assignedDriverId) {
        const foundDriver = liveDrivers.find(d => d.id === assignedDriverId)
        if (foundDriver) driverName = foundDriver.fullName
      }

      await addVehicle(
        {
          name,
          reg,
          type,
          brand,
          model,
          manufacturingYear,
          color,
          fuelType,
          seats,
          odometer,
          assignedDriverId: assignedDriverId || null,
          assignedDriverName: driverName,
          status,
          photoUrl: photoPreview || null,
          rcNumber,
          rcExpiry,
          rcDocUrl: rcDocPreview || null,
          insurancePolicy,
          insuranceExpiry,
          insuranceDocUrl: insuranceDocPreview || null,
          fitnessExpiry,
          fitnessDocUrl: fitnessDocPreview || null,
          pollutionExpiry,
          permitExpiry,
          permitDocUrl: permitDocPreview || null,
          nextServiceDate,
          nextServiceOdometer,
        },
        currentUser?.id
      )

      if (onSuccess) onSuccess('Vehicle added successfully!')
      onClose()
    } catch (err) {
      console.error('Error adding vehicle:', err)
      setError(err.message || 'Failed to add vehicle.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Car size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Add New Vehicle</h3>
              <p className="text-xs text-ink-soft">Enter specifications, documents and maintenance schedule.</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: SPECIFICATIONS */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              1. Vehicle Specifications
            </h4>

            {/* Photo & Status Header Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-line bg-bg p-3.5">
              <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Car size={28} className="text-ink-soft" />
                )}
              </div>

              <div className="flex-1 space-y-1 text-center sm:text-left">
                <label className="text-xs font-bold text-ink">Vehicle Photo (Optional)</label>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
                    <Upload size={14} /> Upload Image
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview('') }}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto space-y-1">
                <label className="text-xs font-bold text-ink">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Vehicle Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">
                  Vehicle Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Innova Crysta"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Registration Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">
                  Registration Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reg}
                  onChange={(e) => setReg(e.target.value)}
                  placeholder="e.g. WB 02 AB 1234"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink uppercase font-bold outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">
                  Vehicle Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value
                    setType(newType)
                    if (newType === 'SUV' || newType === 'Innova Crysta' || newType === 'Ertiga SUV') setSeats(7)
                    else setSeats(4)
                  }}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Van">Van</option>
                  <option value="Minibus">Minibus</option>
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Brand / Make</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Toyota, Maruti Suzuki"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Crysta 2.4 VX"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Manufacturing Year */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Manufacturing Year</label>
                <input
                  type="number"
                  value={manufacturingYear}
                  onChange={(e) => setManufacturingYear(e.target.value)}
                  placeholder="e.g. 2023"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Color */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Pearl White"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Fuel Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Seating Capacity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Seating Capacity</label>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  placeholder="e.g. 4 or 7"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Current Odometer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Current Odometer (km)</label>
                <input
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="e.g. 45200"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Assigned Driver */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Assigned Driver</label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
                >
                  <option value="">Unassigned</option>
                  {liveDrivers.length > 0 ? (
                    liveDrivers.map(drv => (
                      <option key={drv.id} value={drv.id}>
                        {drv.fullName} ({drv.licenseNumber}) - {drv.status}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No drivers available</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: DOCUMENTS & EXPIRIES */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              2. Vehicle Documents & Compliance
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* RC Number & Expiry */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">RC Number</label>
                <input
                  type="text"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  placeholder="e.g. RC-98765432"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink uppercase outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">RC Expiry Date</label>
                <input
                  type="date"
                  value={rcExpiry}
                  onChange={(e) => setRcExpiry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Insurance Policy & Expiry */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Insurance Policy Number</label>
                <input
                  type="text"
                  value={insurancePolicy}
                  onChange={(e) => setInsurancePolicy(e.target.value)}
                  placeholder="e.g. POL-889977"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink uppercase outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Fitness Expiry */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Fitness Certificate Expiry</label>
                <input
                  type="date"
                  value={fitnessExpiry}
                  onChange={(e) => setFitnessExpiry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Pollution Expiry */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Pollution Certificate Expiry</label>
                <input
                  type="date"
                  value={pollutionExpiry}
                  onChange={(e) => setPollutionExpiry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              {/* Permit Expiry */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-ink">Permit Expiry Date</label>
                <input
                  type="date"
                  value={permitExpiry}
                  onChange={(e) => setPermitExpiry(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: MAINTENANCE SCHEDULE */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              3. Maintenance Schedule & Reminders
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Next Service Date</label>
                <input
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Next Service Odometer (km)</label>
                <input
                  type="number"
                  value={nextServiceOdometer}
                  onChange={(e) => setNextServiceOdometer(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink num outline-none transition-all focus:bg-surface focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
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
                <span>Add Vehicle</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
