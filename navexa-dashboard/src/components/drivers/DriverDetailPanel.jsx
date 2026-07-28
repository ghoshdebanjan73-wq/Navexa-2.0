import { X, UserCheck, Phone, Mail, Calendar, MapPin, ShieldAlert, Car, Edit3, Trash2, Clock } from 'lucide-react'

export default function DriverDetailPanel({ driver, isOpen, onClose, onEdit, onDelete, isAdmin }) {
  if (!isOpen || !driver) return null

  // Calculate license status / expiry warning
  let expiryStatus = 'Valid'
  let expiryBadgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200'

  if (driver.licenseExpiryDate) {
    const today = new Date()
    const expDate = new Date(driver.licenseExpiryDate)
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      expiryStatus = 'Expired'
      expiryBadgeStyle = 'bg-rose-50 text-rose-700 border-rose-200'
    } else if (diffDays <= 30) {
      expiryStatus = `Expires in ${diffDays} days`
      expiryBadgeStyle = 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md h-full bg-surface border-l border-line shadow-2xl flex flex-col justify-between animate-slideLeft overflow-y-auto">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-line p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink leading-tight">{driver.fullName}</h3>
              <p className="text-xs text-ink-soft num font-semibold">{driver.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1">
          
          {/* Main Card Profile */}
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-bg p-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-surface overflow-hidden shadow-2xs">
              {driver.photoUrl ? (
                <img src={driver.photoUrl} alt={driver.fullName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-extrabold text-primary">
                  {driver.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                driver.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {driver.status}
              </span>
              <p className="text-xs text-ink-soft font-medium">{driver.phone}</p>
              {driver.email && <p className="text-[11px] text-ink-soft">{driver.email}</p>}
            </div>
          </div>

          {/* License Information Section */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">License Details</h4>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${expiryBadgeStyle}`}>
                {expiryStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">License Number</p>
                <p className="font-extrabold text-ink uppercase num mt-0.5">{driver.licenseNumber}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Expiry Date</p>
                <p className="font-bold text-ink num mt-0.5">{driver.licenseExpiryDate || 'N/A'}</p>
              </div>

              {driver.licenseIssueDate && (
                <div>
                  <p className="text-[10px] font-bold text-ink-soft uppercase">Issue Date</p>
                  <p className="font-medium text-ink num mt-0.5">{driver.licenseIssueDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vehicle Card */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-2.5 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Assigned Vehicle
            </h4>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <Car size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{driver.assignedVehicleName || 'Unassigned'}</p>
                <p className="text-[11px] text-ink-soft font-medium">Primary operational vehicle</p>
              </div>
            </div>
          </div>

          {/* Driver Information Section */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Personal Information
            </h4>
            
            <div className="space-y-2.5 text-xs">
              {driver.dateOfBirth && (
                <div className="flex items-center gap-2 text-ink">
                  <Calendar size={14} className="text-ink-soft" />
                  <span className="font-semibold">DOB:</span>
                  <span className="num">{driver.dateOfBirth}</span>
                </div>
              )}

              {driver.address && (
                <div className="flex items-start gap-2 text-ink">
                  <MapPin size={14} className="text-ink-soft shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Address: </span>
                    <span className="text-ink-soft">{driver.address}</span>
                  </div>
                </div>
              )}

              {(driver.emergencyContactName || driver.emergencyContactPhone) && (
                <div className="border-t border-line pt-2 mt-2 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Emergency Contact</p>
                  <p className="font-semibold text-ink">{driver.emergencyContactName || 'N/A'}</p>
                  <p className="text-ink-soft font-medium num">{driver.emergencyContactPhone || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {driver.notes && (
            <div className="rounded-2xl border border-line bg-bg p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Notes</p>
              <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">{driver.notes}</p>
            </div>
          )}

          {/* Timestamp Info */}
          <div className="text-[10px] text-ink-soft space-y-1 pt-2 border-t border-line">
            <p>Created Date: <span className="num font-semibold">{new Date(driver.createdAt || Date.now()).toLocaleString()}</span></p>
            {driver.updatedAt && (
              <p>Last Updated: <span className="num font-semibold">{new Date(driver.updatedAt).toLocaleString()}</span></p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="sticky bottom-0 bg-surface border-t border-line p-4 flex items-center gap-3">
            <button
              onClick={() => { onClose(); onEdit(driver) }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-50 text-primary border border-primary/20 px-4 py-2.5 text-xs font-bold hover:bg-primary-100 transition-colors cursor-pointer"
            >
              <Edit3 size={15} /> Edit Driver
            </button>

            <button
              onClick={() => { onClose(); onDelete(driver) }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
