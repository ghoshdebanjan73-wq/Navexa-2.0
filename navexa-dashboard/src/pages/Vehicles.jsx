import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Car, Plus, Search, X, Filter, MoreHorizontal, CheckCircle2,
  Route, AlertTriangle, ShieldAlert, CheckCircle, Clock, Eye, Edit3
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveVehicles, subscribeVehicles, filterVehicles, getVehicleCounts,
  getVehicleAssignment, updateVehicleStatus, getEffectiveVehicleStatus
} from '../data/vehicleStore'
import { subscribeTrips } from '../data/tripStore'
import AddVehicleModal from '../components/vehicles/AddVehicleModal'
import EditVehicleModal from '../components/vehicles/EditVehicleModal'
import VehicleDetailPanel from '../components/vehicles/VehicleDetailPanel'

// ─── Status Badge Colors ───
const STATUS_STYLES = {
  Available:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle },
  'On Trip':   { bg: 'bg-sky-50 text-sky-700 border-sky-200/60',             icon: Route },
  Maintenance: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60',         icon: AlertTriangle },
  Inactive:    { bg: 'bg-slate-100 text-slate-700 border-slate-200/60',       icon: ShieldAlert },
}

// ─── Metric Chip Component ───
function MetricChip({ label, value, active, colorStyle, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? 'border-primary bg-primary text-white shadow-xs'
          : 'border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className={`num font-extrabold text-base leading-none ${active ? 'text-white' : colorStyle}`}>
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</span>
    </button>
  )
}

// ─── Vehicle Card Actions Menu ───
function VehicleCardActions({ vehicle, onViewDetails, onEdit, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const statuses = ['Available', 'On Trip', 'Maintenance', 'Inactive']

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
        aria-label="Vehicle actions"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[170px] rounded-xl border border-line bg-surface shadow-pop py-1 animate-fadeIn">
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onViewDetails() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 cursor-pointer"
          >
            <Eye size={14} className="text-ink-soft" />
            <span>View Details</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 cursor-pointer"
          >
            <Edit3 size={14} className="text-primary" />
            <span>Edit Vehicle</span>
          </button>

          <div className="my-1 border-t border-line" />

          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Set Status
          </p>
          {statuses.map(st => (
            <button
              key={st}
              disabled={vehicle.status === st}
              onClick={e => { e.stopPropagation(); setOpen(false); onStatusChange(st) }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                vehicle.status === st
                  ? 'bg-slate-50 text-ink-soft font-normal opacity-60 cursor-default'
                  : 'text-ink hover:bg-slate-50'
              }`}
            >
              <span>{st}</span>
              {vehicle.status === st && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Vehicle Card Component ───
function VehicleCard({ vehicle, onViewDetails, onEdit, onStatusChange }) {
  const assignment = getVehicleAssignment(vehicle.name, vehicle.reg)
  const effectiveStatus = getEffectiveVehicleStatus(vehicle)
  const style = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.Available
  const StatusIcon = style.icon

  return (
    <div
      onClick={onViewDetails}
      className="w-full rounded-2xl border border-line bg-surface p-4 flex flex-col justify-between space-y-3.5 transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
    >
      {/* Top Row: Icon, Info, Status & Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary shadow-2xs">
            <Car size={20} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-ink truncate leading-tight">{vehicle.name}</h4>
            <p className="text-xs text-ink-soft font-semibold num mt-0.5">{vehicle.reg}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.bg}`}>
            <StatusIcon size={12} strokeWidth={2.5} />
            {effectiveStatus}
          </span>
          <VehicleCardActions
            vehicle={vehicle}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>

      {/* Details sub-row */}
      <div className="flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="rounded-md bg-bg px-2 py-0.5 font-semibold text-ink-soft">{vehicle.type}</span>
        <span>·</span>
        <span>{vehicle.seats} Seater</span>
      </div>

      {/* Assignment Banner */}
      <div className="rounded-xl border border-line/70 bg-bg p-3 space-y-1">
        {assignment ? (
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1">
              <span>{assignment.status === 'Ongoing' ? 'Active Trip' : 'Upcoming Trip'}</span>
              <span className="text-ink-soft font-normal">{assignment.dateTime}</span>
            </div>
            <p className="text-xs font-bold text-ink leading-tight">{assignment.customer}</p>
            <p className="text-[11px] text-ink-soft mt-0.5">{assignment.route}</p>
          </div>
        ) : vehicle.status === 'On Trip' ? (
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-700 mb-0.5">
              <span>On Trip</span>
            </div>
            <p className="text-xs font-semibold text-ink">Trip in progress</p>
          </div>
        ) : vehicle.status === 'Maintenance' ? (
          <div>
            <p className="text-[11px] font-bold text-amber-700 mb-0.5">Under Maintenance</p>
            <p className="text-xs font-semibold text-ink-soft">Scheduled service & checkup</p>
          </div>
        ) : vehicle.status === 'Inactive' ? (
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">Off Duty</p>
            <p className="text-xs font-semibold text-ink-soft">Currently inactive</p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-bold text-emerald-700 mb-0.5">Ready for Trip</p>
            <p className="text-xs font-semibold text-ink-soft">No active trip assigned</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN VEHICLES PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function VehiclesPage() {
  const { user } = useUser()
  const [vehicles, setVehicles] = useState([...liveVehicles])
  const [counts,   setCounts]   = useState(getVehicleCounts())

  // Subscribe to vehicleStore & tripStore for live reactive updates
  useEffect(() => {
    const unsubVehicles = subscribeVehicles(snap => {
      setVehicles([...snap])
      setCounts(getVehicleCounts())
    })
    const unsubTrips = subscribeTrips(() => {
      setVehicles([...liveVehicles])
      setCounts(getVehicleCounts())
    })
    return () => {
      unsubVehicles()
      unsubTrips()
    }
  }, [])

  // Filters & Search
  const [search,    setSearch]    = useState('')
  const [statusTab, setStatusTab] = useState('All')

  // Modals & Panels
  const [addModalOpen,   setAddModalOpen]   = useState(false)
  const [detailVehicle,  setDetailVehicle]  = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [toast,          setToast]          = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const handleStatusChange = (vehicleId, newStatus) => {
    updateVehicleStatus(vehicleId, newStatus, user?.name || 'Banjo')
    showToast(`Vehicle status updated to ${newStatus}.`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatusTab('All')
  }

  const hasActiveFilters = Boolean(search || statusTab !== 'All')

  // Filtered vehicles list
  const filteredList = useMemo(() => {
    return filterVehicles({ search, statusTab })
  }, [vehicles, search, statusTab])

  const statusTabs = ['All', 'Available', 'On Trip', 'Maintenance', 'Inactive']

  return (
    <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 space-y-5 lg:space-y-6">

      {/* ── Success Toast Banner ── */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-lg animate-fadeUp">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {toast}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Vehicles</h1>
          <p className="text-xs text-ink-soft mt-0.5">Manage your fleet, availability, and vehicle assignments.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* ── Summary Chips ── */}
      <div className="flex flex-wrap gap-2.5">
        <MetricChip
          label="Total Vehicles"
          value={counts.total}
          active={statusTab === 'All'}
          colorStyle="text-primary"
          onClick={() => setStatusTab('All')}
        />
        <MetricChip
          label="Available"
          value={counts.available}
          active={statusTab === 'Available'}
          colorStyle="text-emerald-600"
          onClick={() => setStatusTab('Available')}
        />
        <MetricChip
          label="On Trip"
          value={counts.onTrip}
          active={statusTab === 'On Trip'}
          colorStyle="text-sky-600"
          onClick={() => setStatusTab('On Trip')}
        />
        <MetricChip
          label="Maintenance"
          value={counts.maintenance}
          active={statusTab === 'Maintenance'}
          colorStyle="text-amber-600"
          onClick={() => setStatusTab('Maintenance')}
        />
        <MetricChip
          label="Inactive"
          value={counts.inactive}
          active={statusTab === 'Inactive'}
          colorStyle="text-slate-500"
          onClick={() => setStatusTab('Inactive')}
        />
      </div>

      {/* ── Search Bar & Status Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="w-full rounded-xl border border-line bg-surface pl-9 pr-9 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b sm:border-b-0 border-line overflow-x-auto">
          {statusTabs.map(st => (
            <button
              key={st}
              onClick={() => setStatusTab(st)}
              className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusTab === st
                  ? 'bg-primary-50 text-primary rounded-xl'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer ml-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Vehicle Grid View ── */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-line bg-surface">
          <Car size={36} className="text-ink-soft/30 mb-3" />
          <p className="text-sm font-bold text-ink mb-1">No vehicles found.</p>
          <p className="text-xs text-ink-soft mb-4">Try adjusting your search query or status filter.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-100 cursor-pointer"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
          {filteredList.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onViewDetails={() => setDetailVehicle(v)}
              onEdit={() => setEditingVehicle(v)}
              onStatusChange={(newStatus) => handleStatusChange(v.id, newStatus)}
            />
          ))}
        </div>
      )}

      {/* ── Add Vehicle Modal ── */}
      {addModalOpen && (
        <AddVehicleModal
          onClose={() => setAddModalOpen(false)}
          onSaved={(msg) => showToast(msg)}
          user={user}
        />
      )}

      {/* ── Vehicle Details Panel ── */}
      {detailVehicle && (
        <VehicleDetailPanel
          vehicle={detailVehicle}
          onClose={() => setDetailVehicle(null)}
          onShowToast={(msg) => showToast(msg)}
          user={user}
          onEdit={() => {
            const target = detailVehicle
            setDetailVehicle(null)
            setEditingVehicle(target)
          }}
        />
      )}

      {/* ── Edit Vehicle Modal ── */}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSaved={(msg) => showToast(msg)}
          user={user}
        />
      )}
    </div>
  )
}
