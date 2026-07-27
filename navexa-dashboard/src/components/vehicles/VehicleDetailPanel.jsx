import { useState, useEffect } from 'react'
import {
  X, Edit3, Car, Calendar, Route, CheckCircle, AlertTriangle,
  ShieldAlert, User, IndianRupee, Clock, Info, Wrench, Plus, Gauge, Store
} from 'lucide-react'
import { getVehicleTripStats, getEffectiveVehicleStatus } from '../../data/vehicleStore'
import { subscribeTrips } from '../../data/tripStore'
import {
  getMaintenanceByVehicle, getVehicleTotalMaintenanceCost, subscribeMaintenance
} from '../../data/maintenanceStore'
import AddMaintenanceModal from './AddMaintenanceModal'

const STATUS_STYLES = {
  Available:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle },
  'On Trip':   { bg: 'bg-sky-50 text-sky-700 border-sky-200/60',             icon: Route },
  Maintenance: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60',         icon: AlertTriangle },
  Inactive:    { bg: 'bg-slate-100 text-slate-700 border-slate-200/60',       icon: ShieldAlert },
}

export default function VehicleDetailPanel({ vehicle, onClose, onEdit, onShowToast, user }) {
  const [stats, setStats] = useState(() =>
    getVehicleTripStats(vehicle.id, vehicle.name, vehicle.reg)
  )
  const [mntRecords, setMntRecords] = useState(() =>
    getMaintenanceByVehicle(vehicle.id)
  )
  const [totalMntCost, setTotalMntCost] = useState(() =>
    getVehicleTotalMaintenanceCost(vehicle.id)
  )

  const [addMntOpen, setAddMntOpen] = useState(false)

  // Subscribe to liveTrips & liveMaintenance
  useEffect(() => {
    const unsubTrips = subscribeTrips(() => {
      setStats(getVehicleTripStats(vehicle.id, vehicle.name, vehicle.reg))
    })
    const unsubMnt = subscribeMaintenance(() => {
      setMntRecords(getMaintenanceByVehicle(vehicle.id))
      setTotalMntCost(getVehicleTotalMaintenanceCost(vehicle.id))
    })
    return () => {
      unsubTrips()
      unsubMnt()
    }
  }, [vehicle])

  // Escape key to close
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const effectiveStatus = getEffectiveVehicleStatus(vehicle)
  const style = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.Available
  const StatusIcon = style.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vehicle Details"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-sm animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-pop max-h-[92vh] flex flex-col animate-scaleUp">
        
        {/* ── Panel Header ── */}
        <div className="flex items-start justify-between border-b border-line px-5 pt-4 pb-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary shadow-2xs">
              <Car size={22} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-ink truncate">{vehicle.name}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.bg}`}>
                  <StatusIcon size={12} strokeWidth={2.5} />
                  {effectiveStatus}
                </span>
              </div>
              <p className="text-xs text-ink-soft font-semibold num mt-0.5">{vehicle.reg}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
            >
              <Edit3 size={14} className="text-primary" /> Edit
            </button>
            <button
              onClick={onClose}
              aria-label="Close details"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Panel Scrollable Body ── */}
        <div className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-5">
          
          {/* 1. Vehicle Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Vehicle Type</p>
              <p className="text-xs sm:text-sm font-bold text-ink mt-0.5">{vehicle.type || 'Sedan'}</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Capacity</p>
              <p className="text-xs sm:text-sm font-bold text-ink mt-0.5">{vehicle.seats || 4} Seater</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Upcoming Trips</p>
              <p className="text-xs sm:text-sm font-bold text-primary mt-0.5 num">{stats.upcomingCount}</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Completed Trips</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5 num">{stats.completedCount}</p>
            </div>
          </div>

          {/* 2. Next Assignment Section */}
          <div className="rounded-2xl border border-line bg-bg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <Route size={14} className="text-primary" /> Next Assignment
              </h4>
              {stats.nextAssignment && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {stats.nextAssignment.status}
                </span>
              )}
            </div>

            {stats.nextAssignment ? (
              <div className="rounded-xl border border-line bg-surface p-3 space-y-1 mt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-ink">{stats.nextAssignment.customer}</p>
                  <span className="text-xs font-bold text-emerald-700 num">₹{stats.nextAssignment.fare?.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs font-semibold text-primary">{stats.nextAssignment.pickupLocation} → {stats.nextAssignment.destination}</p>
                <div className="flex items-center gap-1 text-[11px] text-ink-soft pt-0.5">
                  <Calendar size={12} />
                  <span>{stats.nextAssignment.tripDate}, {stats.nextAssignment.tripTime}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2 text-xs font-semibold text-ink-soft">
                <Info size={15} className="text-slate-400" />
                <span>No upcoming trips assigned to this vehicle</span>
              </div>
            )}
          </div>

          {/* 3. Maintenance & Service Section */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Maintenance & Service ({mntRecords.length})
                </h4>
                {totalMntCost > 0 && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60 num">
                    Total: ₹{totalMntCost.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <button
                onClick={() => setAddMntOpen(true)}
                className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus size={13} /> Add Maintenance
              </button>
            </div>

            {/* Maintenance History List or Empty State */}
            {mntRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg py-6 px-4 text-center">
                <Wrench size={28} className="text-slate-300 mb-2" />
                <p className="text-xs sm:text-sm font-bold text-ink mb-0.5">No maintenance records yet.</p>
                <p className="text-[11px] text-ink-soft mb-3">Service and repair history for this vehicle will appear here.</p>
                <button
                  onClick={() => setAddMntOpen(true)}
                  className="flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus size={12} /> Add Maintenance
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {mntRecords.map(m => (
                  <div key={m.id} className="rounded-xl border border-line bg-bg p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-100/70 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                          {m.type}
                        </span>
                        <span className="text-ink-soft text-[11px] font-medium">{m.serviceDate}</span>
                      </div>
                      <span className="font-extrabold text-ink num text-sm">₹{m.cost?.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-soft pt-0.5">
                      {m.odometer && (
                        <span className="flex items-center gap-1 font-semibold num text-ink">
                          <Gauge size={12} className="text-slate-400" /> {m.odometer.toLocaleString('en-IN')} km
                        </span>
                      )}
                      {m.serviceProvider && (
                        <span className="flex items-center gap-1 font-semibold text-ink">
                          <Store size={12} className="text-slate-400" /> {m.serviceProvider}
                        </span>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-xs text-ink bg-surface rounded-lg p-2 border border-line/50 leading-relaxed mt-1">
                        {m.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Notes Section */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-1.5">Vehicle Notes</h4>
            <p className="text-xs sm:text-sm text-ink leading-relaxed">
              {vehicle.notes?.trim() ? vehicle.notes : <span className="text-ink-soft italic">Not provided</span>}
            </p>
          </div>

          {/* 5. Trip History List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">Trip History ({stats.totalTrips})</h4>
            </div>

            {stats.recentTrips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-bg p-4 text-center text-xs font-semibold text-ink-soft">
                No trip history recorded yet for this vehicle.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentTrips.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-ink truncate">{t.customer}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                          t.status === 'Ongoing'   ? 'bg-sky-50 text-sky-700' :
                          t.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft truncate mt-0.5">{t.pickupLocation} → {t.destination}</p>
                      <p className="text-[10px] text-ink-soft mt-0.5">{t.tripDate}, {t.tripTime}</p>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-ink num">₹{t.fare?.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-ink-soft">{t.paymentStatus || 'Unpaid'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Panel Footer ── */}
        <div className="flex items-center justify-end border-t border-line px-5 py-3.5 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl border border-line px-5 py-2 text-xs sm:text-sm font-semibold text-ink-soft hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* ── Add Maintenance Modal ── */}
      {addMntOpen && (
        <AddMaintenanceModal
          vehicle={vehicle}
          onClose={() => setAddMntOpen(false)}
          onSaved={(msg) => {
            if (onShowToast) onShowToast(msg)
          }}
          user={user}
        />
      )}
    </div>
  )
}
