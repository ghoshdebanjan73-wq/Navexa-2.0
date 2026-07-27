import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus, Search, X, Filter, ChevronDown, MoreHorizontal,
  Route, Calendar, Car, CreditCard, ArrowRight, CheckCircle2,
  Clock, XCircle, Loader2, Edit2, AlertTriangle, ArrowUpDown,
  Play
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveTrips, subscribeTrips, filterTrips, getTripCounts,
  updateTripStatus, formatINR, TRIP_STATUSES
} from '../data/tripStore'
import { liveVehicles } from '../data/vehicleStore'
import { getInitials } from '../data/customerStore'
import { subscribePayments, getTripPaymentSummary } from '../data/paymentStore'
import TripDetailPanel from '../components/trips/TripDetailPanel'
import EditTripModal from '../components/trips/EditTripModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import AddTripModal from '../components/trips/AddTripModal'

// ─── Status badge styles ──────────────────────────────────────────────────────
export const STATUS_BADGE = {
  Upcoming:  'bg-sky-50 text-sky-700 border border-sky-200/60',
  Ongoing:   'bg-amber-50 text-amber-700 border border-amber-200/60',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  Cancelled: 'bg-rose-50 text-rose-700 border border-rose-200/60',
}

export const PAYMENT_BADGE = {
  Paid:    'bg-emerald-50 text-emerald-700',
  Partial: 'bg-amber-50 text-amber-700',
  Unpaid:  'bg-slate-100 text-slate-600',
}

// ─── Metric Card Component ────────────────────────────────────────────────────
function StatCard({ label, count, active, onClick, colorClass }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
        active
          ? 'border-primary bg-primary text-white shadow-xs'
          : 'border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div>
        <p className={`num text-2xl font-extrabold leading-none ${active ? 'text-white' : colorClass}`}>
          {count}
        </p>
        <p className={`text-xs font-semibold mt-1 ${active ? 'text-white/80' : 'text-ink-soft'}`}>
          {label}
        </p>
      </div>
    </button>
  )
}

// ─── Small action menu inside row ──────────────────────────────────────────
function RowActionsMenu({ trip, onView, onEdit, onStart, onComplete, onCancel }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
        aria-label="Trip actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[160px] rounded-xl border border-line bg-surface shadow-pop py-1 animate-fadeIn">
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onView() }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Route size={13} className="text-ink-soft" /> View Details
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit2 size={13} className="text-ink-soft" /> Edit Trip
          </button>

          {trip.status === 'Upcoming' && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onStart() }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <Play size={13} className="text-amber-600" /> Start Trip
            </button>
          )}

          {trip.status === 'Ongoing' && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onComplete() }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={13} className="text-emerald-600" /> Mark Completed
            </button>
          )}

          {(trip.status === 'Upcoming' || trip.status === 'Ongoing') && (
            <>
              <div className="my-1 border-t border-line/60" />
              <button
                onClick={e => { e.stopPropagation(); setOpen(false); onCancel() }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <XCircle size={13} /> Cancel Trip
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────
function TripTableRow({ trip, onView, onEdit, onStart, onComplete, onCancel }) {
  const paySummary = getTripPaymentSummary(trip.id, trip.fare, trip.paymentStatus)
  const payStatus = paySummary.paymentStatus

  return (
    <tr
      onClick={onView}
      className="group transition-colors hover:bg-slate-50/80 cursor-pointer border-b border-line/60"
    >
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary">
            {getInitials(trip.customer)}
          </div>
          <span className="text-xs font-semibold text-ink">{trip.customer}</span>
        </div>
      </td>
      <td className="py-3 px-3">
        <span className="text-xs text-ink-soft max-w-[180px] truncate block" title={`${trip.pickupLocation} → ${trip.destination}`}>
          {trip.pickupLocation} → {trip.destination}
        </span>
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <p className="text-xs font-medium text-ink">{trip.tripDate}</p>
        <p className="text-[11px] text-ink-soft">{trip.tripTime}</p>
      </td>
      <td className="hidden lg:table-cell py-3 px-3">
        <p className="text-xs font-medium text-ink">{trip.vehicle}</p>
        {trip.vehicleReg && <p className="text-[11px] text-ink-soft">{trip.vehicleReg}</p>}
      </td>
      <td className="py-3 px-3 text-right">
        <span className="num text-xs font-bold text-ink">{formatINR(trip.fare)}</span>
      </td>
      <td className="hidden sm:table-cell py-3 px-3 text-center">
        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${PAYMENT_BADGE[payStatus] || PAYMENT_BADGE.Unpaid}`}>
          {payStatus}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_BADGE[trip.status] || STATUS_BADGE.Upcoming}`}>
          {trip.status}
        </span>
      </td>
      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
        <RowActionsMenu
          trip={trip}
          onView={onView}
          onEdit={onEdit}
          onStart={onStart}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </td>
    </tr>
  )
}

// ─── Mobile trip card ─────────────────────────────────────────────────────────
function TripMobileCard({ trip, onView, onEdit, onStart, onComplete, onCancel }) {
  return (
    <div
      onClick={onView}
      className="w-full rounded-2xl border border-line bg-surface p-4 space-y-2.5 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.99] cursor-pointer"
    >
      {/* Top: Customer + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[10px] font-bold text-primary">
            {getInitials(trip.customer)}
          </div>
          <span className="text-sm font-bold text-ink">{trip.customer}</span>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[trip.status]}`}>
            {trip.status}
          </span>
          <RowActionsMenu
            trip={trip}
            onView={onView}
            onEdit={onEdit}
            onStart={onStart}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
        <Route size={13} className="text-primary shrink-0" />
        <span className="truncate">{trip.pickupLocation} → {trip.destination}</span>
      </div>

      {/* Date, Time & Vehicle */}
      <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1 border-t border-line/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {trip.tripDate} {trip.tripTime}
          </span>
          <span className="flex items-center gap-1">
            <Car size={11} /> {trip.vehicle}
          </span>
        </div>
        <span className="num font-bold text-xs text-ink">{formatINR(trip.fare)}</span>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onAddTrip, onClearFilters }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 sm:p-12 text-center space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary mx-auto">
        <Route size={24} />
      </div>
      <h3 className="text-base font-bold text-ink">No trips found</h3>
      <p className="text-xs text-ink-soft max-w-sm mx-auto">
        {hasFilters
          ? 'No trips match your current filter selection. Try clearing filters.'
          : 'You haven’t added any trips yet. Create your first operational trip now.'}
      </p>
      <div className="pt-2 flex items-center justify-center gap-3">
        {hasFilters ? (
          <button onClick={onClearFilters}
            className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-100 cursor-pointer">
            Clear Filters
          </button>
        ) : (
          <button onClick={onAddTrip}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer">
            <Plus size={14} /> Add First Trip
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TRIPS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function TripsPage() {
  const { user } = useUser()
  const [trips, setTrips] = useState([...liveTrips])
  const [counts, setCounts] = useState(() => getTripCounts())

  // Subscribe to liveTrips & livePayments so UI updates reactively across all tabs
  useEffect(() => {
    const unsubTrips = subscribeTrips((snap) => {
      setTrips([...snap])
      setCounts(getTripCounts())
    })
    const unsubPay = subscribePayments(() => {
      setTrips([...liveTrips])
    })
    return () => {
      unsubTrips()
      unsubPay()
    }
  }, [])

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [sortAsc, setSortAsc] = useState(false)

  // Dialog & Modal state
  const [addOpen, setAddOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)

  // Confirmation dialog state
  const [startConfirmTrip, setStartConfirmTrip] = useState(null)
  const [completeConfirmTrip, setCompleteConfirmTrip] = useState(null)
  const [cancelConfirmTrip, setCancelConfirmTrip] = useState(null)

  // Toast state
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  // Filtered trips computation
  const filteredTrips = useMemo(() => {
    let result = filterTrips({
      search,
      status: statusFilter,
      vehicle: vehicleFilter,
      paymentStatus: payFilter,
    })

    if (sortAsc) {
      result = [...result].reverse()
    }

    return result
  }, [trips, search, statusFilter, vehicleFilter, payFilter, sortAsc])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setVehicleFilter('')
    setPayFilter('')
  }

  const hasActiveFilters = search || statusFilter !== 'All' || vehicleFilter || payFilter

  // Handlers for Row Actions
  const handleView = (trip) => {
    setSelectedTrip(trip)
    setDetailOpen(true)
  }
  const handleEdit = (trip) => {
    setEditingTrip(trip)
    setEditOpen(true)
  }
  const handleStartRequest = (trip) => {
    setStartConfirmTrip(trip)
  }
  const handleCompleteRequest = (trip) => {
    setCompleteConfirmTrip(trip)
  }
  const handleCancelRequest = (trip) => {
    setCancelConfirmTrip(trip)
  }

  // Action confirmations
  const handleConfirmStart = () => {
    if (!startConfirmTrip) return
    updateTripStatus(startConfirmTrip.id, 'Ongoing', user?.name || 'Banjo')
    showToast(`Trip started: ${startConfirmTrip.pickupLocation} → ${startConfirmTrip.destination}. Assigned vehicle is now On Trip.`)
    setStartConfirmTrip(null)
  }

  const handleConfirmComplete = () => {
    if (!completeConfirmTrip) return
    updateTripStatus(completeConfirmTrip.id, 'Completed', user?.name || 'Banjo')
    showToast(`Trip marked as completed. Vehicle released.`)
    setCompleteConfirmTrip(null)
  }

  const handleConfirmCancel = () => {
    if (!cancelConfirmTrip) return
    updateTripStatus(cancelConfirmTrip.id, 'Cancelled', user?.name || 'Banjo')
    showToast(`Trip cancelled. Record preserved in history.`)
    setCancelConfirmTrip(null)
  }

  const statusTabs = ['All', ...TRIP_STATUSES]

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
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Trips</h1>
          <p className="text-xs text-ink-soft mt-0.5">Manage operational bookings, status lifecycle, and vehicle assignments.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus size={15} /> Add Trip
        </button>
      </div>

      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          label="Total Trips"
          count={counts.total}
          active={statusFilter === 'All'}
          colorClass="text-ink"
          onClick={() => setStatusFilter('All')}
        />
        <StatCard
          label="Upcoming"
          count={counts.upcoming}
          active={statusFilter === 'Upcoming'}
          colorClass="text-sky-600"
          onClick={() => setStatusFilter('Upcoming')}
        />
        <StatCard
          label="Ongoing"
          count={counts.ongoing}
          active={statusFilter === 'Ongoing'}
          colorClass="text-amber-600"
          onClick={() => setStatusFilter('Ongoing')}
        />
        <StatCard
          label="Completed"
          count={counts.completed}
          active={statusFilter === 'Completed'}
          colorClass="text-emerald-600"
          onClick={() => setStatusFilter('Completed')}
        />
        <StatCard
          label="Cancelled"
          count={counts.cancelled}
          active={statusFilter === 'Cancelled'}
          colorClass="text-rose-600"
          onClick={() => setStatusFilter('Cancelled')}
        />
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search trips by customer, location, or vehicle..."
            className="w-full rounded-xl border border-line bg-surface pl-9 pr-9 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Vehicle filter */}
          <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
            <option value="">All Vehicles</option>
            {liveVehicles.map(v => (
              <option key={v.id} value={v.name}>{v.name} ({v.reg})</option>
            ))}
          </select>

          {/* Payment status filter */}
          <select value={payFilter} onChange={e => setPayFilter(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
            <option value="">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          {/* Sort toggle */}
          <button onClick={() => setSortAsc(v => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink-soft hover:text-ink hover:border-slate-300 transition-colors cursor-pointer">
            <ArrowUpDown size={13} />
            {sortAsc ? 'Date ↑' : 'Date ↓'}
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer">
              <X size={12} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex gap-1 border-b border-line overflow-x-auto">
        {statusTabs.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              statusFilter === s
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-soft hover:text-ink hover:border-slate-300'
            }`}>
            {s}
            {s !== 'All' && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                {s === 'Upcoming' ? counts.upcoming : s === 'Ongoing' ? counts.ongoing : s === 'Completed' ? counts.completed : counts.cancelled}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Trips Table (desktop) / Cards (mobile) ── */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          hasFilters={Boolean(hasActiveFilters)}
          onAddTrip={() => setAddOpen(true)}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="hidden lg:table-cell py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3 text-right">Fare</th>
                    <th className="hidden sm:table-cell py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center w-10" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map(trip => (
                    <TripTableRow
                      key={trip.id}
                      trip={trip}
                      onView={() => handleView(trip)}
                      onEdit={() => handleEdit(trip)}
                      onStart={() => handleStartRequest(trip)}
                      onComplete={() => handleCompleteRequest(trip)}
                      onCancel={() => handleCancelRequest(trip)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredTrips.map(trip => (
              <TripMobileCard
                key={trip.id}
                trip={trip}
                onView={() => handleView(trip)}
                onEdit={() => handleEdit(trip)}
                onStart={() => handleStartRequest(trip)}
                onComplete={() => handleCompleteRequest(trip)}
                onCancel={() => handleCancelRequest(trip)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Trip Detail Panel ── */}
      {detailOpen && selectedTrip && (
        <TripDetailPanel
          trip={selectedTrip}
          onClose={() => { setDetailOpen(false); setSelectedTrip(null) }}
          onEdit={() => { setDetailOpen(false); handleEdit(selectedTrip) }}
          onStart={() => { setDetailOpen(false); handleStartRequest(selectedTrip) }}
          onComplete={() => { setDetailOpen(false); handleCompleteRequest(selectedTrip) }}
          onCancel={() => { setDetailOpen(false); handleCancelRequest(selectedTrip) }}
          onShowToast={(msg) => showToast(msg)}
          user={user}
        />
      )}

      {/* ── Edit Trip Modal ── */}
      {editOpen && editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditOpen(false)}
          onSaved={(msg) => { setEditOpen(false); showToast(msg || 'Trip updated.') }}
          user={user}
        />
      )}

      {/* ── Start Trip Confirmation Dialog ── */}
      {startConfirmTrip && (
        <ConfirmDialog
          title="Start this trip?"
          body="The trip will be marked as ongoing and the assigned vehicle will be shown as on trip."
          confirmLabel="Start Trip"
          cancelLabel="Cancel"
          onConfirm={handleConfirmStart}
          onCancel={() => setStartConfirmTrip(null)}
        />
      )}

      {/* ── Complete Trip Confirmation Dialog ── */}
      {completeConfirmTrip && (
        <ConfirmDialog
          title="Mark this trip as completed?"
          body="The trip will move to completed history and the vehicle will become available again if no other condition prevents it."
          confirmLabel="Mark Completed"
          cancelLabel="Cancel"
          onConfirm={handleConfirmComplete}
          onCancel={() => setCompleteConfirmTrip(null)}
        />
      )}

      {/* ── Cancel Trip Confirmation Dialog ── */}
      {cancelConfirmTrip && (
        <ConfirmDialog
          title="Cancel this trip?"
          body="The trip will be marked as cancelled. The trip record will be preserved."
          confirmLabel="Cancel Trip"
          cancelLabel="Keep Trip"
          destructive
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelConfirmTrip(null)}
        />
      )}

      {/* ── Add Trip Modal ── */}
      {addOpen && (
        <AddTripModal
          onClose={() => setAddOpen(false)}
          onSaved={(msg) => { setAddOpen(false); showToast(msg || 'Trip added.') }}
          user={user}
        />
      )}
    </div>
  )
}
