import { useState, useEffect } from 'react'
import { X, UserCheck, Upload, Loader2, AlertCircle } from 'lucide-react'
import { liveVehicles } from '../../data/vehicleStore'
import { addDriver, isLicenseNumberDuplicate } from '../../data/driverStore'
import { useUser } from '../../context/UserContext'

export default function AddDriverModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useUser()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseIssueDate, setLicenseIssueDate] = useState('')
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('')
  const [assignedVehicleId, setAssignedVehicleId] = useState('')
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')

  // Photo
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setError('')
      setFullName('')
      setPhone('')
      setEmail('')
      setDateOfBirth('')
      setAddress('')
      setEmergencyContactName('')
      setEmergencyContactPhone('')
      setLicenseNumber('')
      setLicenseIssueDate('')
      setLicenseExpiryDate('')
      setAssignedVehicleId('')
      setStatus('Active')
      setNotes('')
      setPhotoPreview('')
      setPhotoFile(null)
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
    if (!fullName.trim()) return 'Full Name is required.'
    if (!phone.trim()) return 'Phone Number is required.'
    if (!licenseNumber.trim()) return 'Driving License Number is required.'
    if (!licenseExpiryDate) return 'License Expiry Date is required.'

    // Check email format if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.'
    }

    // Check duplicate license number
    if (isLicenseNumberDuplicate(licenseNumber)) {
      return `License number "${licenseNumber.trim().toUpperCase()}" is already registered.`
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
      let assignedVehicleName = 'Unassigned'
      if (assignedVehicleId) {
        const found = liveVehicles.find(v => v.id === assignedVehicleId)
        if (found) assignedVehicleName = `${found.name} (${found.reg})`
      }

      await addDriver(
        {
          fullName,
          phone,
          email,
          dateOfBirth,
          address,
          emergencyContactName,
          emergencyContactPhone,
          licenseNumber,
          licenseIssueDate,
          licenseExpiryDate,
          assignedVehicleId: assignedVehicleId || null,
          assignedVehicleName,
          status,
          notes,
          photoUrl: photoPreview || null,
        },
        currentUser?.id
      )

      if (onSuccess) onSuccess('Driver added successfully!')
      onClose()
    } catch (err) {
      console.error('Error adding driver:', err)
      setError(err.message || 'Failed to add driver. Please try again.')
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
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">Add New Driver</h3>
              <p className="text-xs text-ink-soft">Enter driver credentials and license details.</p>
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
          
          {/* Photo & Status Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-line bg-bg p-3.5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-surface overflow-hidden shadow-2xs">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <UserCheck size={24} className="text-ink-soft" />
              )}
            </div>
            
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <label className="text-xs font-bold text-ink">Driver Photo (Optional)</label>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
                  <Upload size={14} /> Upload Photo
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
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

            {/* Driving License Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                Driving License Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. WB-12-2023-0098"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink uppercase font-semibold outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* License Expiry Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">
                License Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* License Issue Date */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">License Issue Date</label>
              <input
                type="date"
                value={licenseIssueDate}
                onChange={(e) => setLicenseIssueDate(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Assigned Vehicle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Assigned Vehicle</label>
              <select
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary cursor-pointer font-medium"
              >
                <option value="">Unassigned</option>
                {liveVehicles.length > 0 ? (
                  liveVehicles.map(veh => (
                    <option key={veh.id} value={veh.id}>
                      {veh.name} ({veh.reg})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No vehicles available</option>
                )}
              </select>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Emergency Contact Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Sunita Kumar (Wife)"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-ink">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="e.g. +91 98765 00000"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-ink">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full residential address"
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
                placeholder="Additional details, shift timing or background notes..."
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
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
                <span>Add Driver</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
