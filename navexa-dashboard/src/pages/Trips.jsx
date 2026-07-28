import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Route, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, ArrowRight, User, Car, Calendar, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveTrips, subscribeTrips, filterAndSortTrips, getNextTripStatus,
  updateTripStatus, deleteTrip, formatINR, TRIP_STAGES
} from '../data/tripStore'
import { liveDrivers, subscribeDrivers } from '../data/driverStore'
import { liveVehicles, subscribeVehicles } from '../data/vehicleStore'

import AddTripModal from '../components/trips/AddTripModal'
import EditTripModal from '../components/trips/EditTripModal'
import TripDetailPanel from '../components/trips/TripDetailPanel'
import ConfirmDialog from '../components/trips/ConfirmDialog'

// Status Stage Colors
export const STAGE_COLORS = {
  Booked:                'bg-slate-100 text-slate-700 border-slate-200',
  Confirmed:             'bg-sky-50 text-sky-700 border-sky-200',
  'Driver Assigned':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Vehicle Assigned':    'bg-purple-50 text-purple-700 border-purple-200',
  Started:               'bg-amber-50 text-amber-700 border-amber-200',
  'Passenger Picked Up': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed:             'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function STATUS_BADGE(status) {
  const cls = STAGE_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {status}
    </span>
  )
}

export function PAYMENT_BADGE(paymentStatus) {
  const cls = paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {paymentStatus}
    </span>
  )
}

export default function TripsPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Store state
  const [trips, setTrips] = useState([...liveTrips])
  const [drivers, setDrivers] = useState([...liveDrivers])
  const [vehicles, setVehicles] = useState([...liveVehicles])

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [driverFilter, setDriverFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [viewingTrip, setViewingTrip] = useState(null)
  const [deletingTrip, setDeletingTrip] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setTrips([...liveTrips])
    const unsubTrips = subscribeTrips(updated => setTrips([...updated]))
    const unsubDrivers = subscribeDrivers(snap => setDrivers([...snap]))
    const unsubVehicles = subscribeVehicles(snap => setVehicles([...snap]))

    return () => {
      unsubTrips()
      unsubDrivers()
      unsubVehicles()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtered & Sorted list
  const filteredTrips = useMemo(() => {
    return filterAndSortTrips(trips, {
      search,
      status: statusFilter,
      driverId: driverFilter,
      vehicleId: vehicleFilter,
      tripType: typeFilter,
      sortBy,
    })
  }, [trips, search, statusFilter, driverFilter, vehicleFilter, typeFilter, sortBy])

  // Counts
  const counts = useMemo(() => {
    const total = trips.length
    const booked = trips.filter(t => t.status === 'Booked').length
    const active = trips.filter(t => ['Started', 'Passenger Picked Up', 'Vehicle Assigned'].includes(t.status)).length
    const completed = trips.filter(t => t.status === 'Completed').length
    return { total, booked, active, completed }
  }, [trips])

  const handleNextStage = async (trip) => {
    const nextAction = getNextTripStatus(trip.status)
    if (!nextAction) return
    try {
      await updateTripStatus(trip.id, nextAction.next)
      showToast(`Trip ${trip.id} advanced to ${nextAction.next}`)
    } catch (err) {
      console.error('Error advancing trip stage:', err)
      showToast('Failed to advance trip stage.', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTrip || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteTrip(deletingTrip.id)
      showToast(`Trip "${deletingTrip.id}" removed successfully.`)
      setDeletingTrip(null)
    } catch (err) {
      console.error('Error deleting trip:', err)
      showToast('Failed to delete trip.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed right-6 top-16 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-pop animate-slideDown ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle size={16} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header & Primary Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-ink tracking-tight">Trips & Operations</h2>
          <p className="text-xs text-ink-soft">Manage trip bookings, status workflows, drivers, and fleet dispatching.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Trip</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => setStatusFilter('All')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'All' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-extrabold">
            {counts.total}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">All Trips</p>
            <p className="text-[11px] text-ink-soft">Total logged trips</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Booked')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Booked' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-extrabold">
            {counts.booked}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Booked</p>
            <p className="text-[11px] text-ink-soft">Awaiting confirmation</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Active')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Active' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-extrabold">
            {counts.active}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Active / Ongoing</p>
            <p className="text-[11px] text-ink-soft">Dispatch in progress</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Completed')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Completed' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold">
            {counts.completed}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Completed</p>
            <p className="text-[11px] text-ink-soft">Successfully finished</p>
          </div>
        </div>
      </div>

      {/* Search, Filters & Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Instant Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, driver, vehicle, trip ID, pickup or drop..."
            className="w-full rounded-xl border border-line bg-bg pl-9 pr-8 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Stage Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <Filter size={13} className="text-ink-soft" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="Active">Active / Dispatching</option>
              {TRIP_STAGES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Trip Type Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Trip Types</option>
              <option value="One Way">One Way</option>
              <option value="Round Trip">Round Trip</option>
              <option value="Airport">Airport</option>
              <option value="Outstation">Outstation</option>
              <option value="Local">Local</option>
            </select>
          </div>

          {/* Driver Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <User size={13} className="text-ink-soft" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <span className="text-[11px] font-bold text-ink-soft">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Trip Date">Trip Date</option>
              <option value="Customer Name">Customer Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trip List Views */}
      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-surface p-12 text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <Route size={24} />
          </div>
          <h3 className="text-sm font-bold text-ink">No trips found</h3>
          <p className="text-xs text-ink-soft max-w-sm">
            {search || statusFilter !== 'All'
              ? 'No trip matches your search or filter parameters.'
              : 'Add your first trip to start managing passenger bookings and driver assignments.'}
          </p>
          {isAdmin && !search && statusFilter === 'All' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <Plus size={15} /> Add Trip
            </button>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Trip ID & Customer</th>
                  <th className="px-4 py-3">Route (Pickup ➔ Drop)</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Vehicle & Driver</th>
                  <th className="px-4 py-3">Fare</th>
                  <th className="px-4 py-3">Workflow Stage</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredTrips.map((trip) => {
                  const nextAction = getNextTripStatus(trip.status)
                  const stageStyle = STAGE_COLORS[trip.status] || STAGE_COLORS.Booked

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setViewingTrip(trip)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Trip ID & Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold text-ink">{trip.customer}</p>
                        <p className="text-[10px] text-ink-soft num font-bold">{trip.id}</p>
                      </td>

                      {/* Route */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <span>{trip.pickupLocation}</span>
                          <ArrowRight size={12} className="text-ink-soft shrink-0" />
                          <span>{trip.destination}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-ink num">{trip.tripDate}</p>
                        <p className="text-[10px] text-ink-soft num">{trip.tripTime}</p>
                      </td>

                      {/* Vehicle & Driver */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-semibold text-ink flex items-center gap-1">
                            <Car size={13} className="text-primary shrink-0" />
                            {trip.vehicle} {trip.vehicleReg ? `(${trip.vehicleReg})` : ''}
                          </p>
                          <p className="text-[10px] text-ink-soft flex items-center gap-1">
                            <User size={12} className="shrink-0" />
                            {trip.driverName || 'Unassigned'}
                          </p>
                        </div>
                      </td>

                      {/* Fare */}
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold text-ink num">{formatINR(trip.fare)}</p>
                        <span className={`inline-flex rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                          trip.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {trip.paymentStatus}
                        </span>
                      </td>

                      {/* Workflow Stage */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${stageStyle}`}>
                          {trip.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {nextAction && isAdmin && (
                            <button
                              onClick={() => handleNextStage(trip)}
                              className="rounded-lg bg-primary-50 text-primary border border-primary/20 px-2.5 py-1 text-[11px] font-bold hover:bg-primary-100 transition-colors cursor-pointer"
                              title={`Advance to ${nextAction.next}`}
                            >
                              {nextAction.label}
                            </button>
                          )}

                          <button
                            onClick={() => setViewingTrip(trip)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingTrip(trip)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer"
                                title="Edit Trip"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingTrip(trip)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Trip"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTrips.map((trip) => {
              const nextAction = getNextTripStatus(trip.status)
              const stageStyle = STAGE_COLORS[trip.status] || STAGE_COLORS.Booked

              return (
                <div
                  key={trip.id}
                  onClick={() => setViewingTrip(trip)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{trip.customer}</h4>
                      <p className="text-xs text-ink-soft num font-bold">{trip.id}</p>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${stageStyle}`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Route Box */}
                  <div className="rounded-xl bg-bg p-3 border border-line/60 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <span>{trip.pickupLocation}</span>
                      <ArrowRight size={13} className="text-primary shrink-0" />
                      <span>{trip.destination}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-soft num">
                      <span>{trip.tripDate} • {trip.tripTime}</span>
                      <span className="font-extrabold text-ink">{formatINR(trip.fare)}</span>
                    </div>
                  </div>

                  {/* Vehicle & Driver Footer */}
                  <div className="flex items-center justify-between text-[11px] text-ink-soft">
                    <span className="font-semibold text-ink">{trip.vehicle} ({trip.vehicleReg || 'N/A'})</span>
                    <span>Driver: <strong className="text-ink">{trip.driverName || 'Unassigned'}</strong></span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-line" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingTrip(trip)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    <div className="flex items-center gap-2">
                      {nextAction && isAdmin && (
                        <button
                          onClick={() => handleNextStage(trip)}
                          className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                          {nextAction.label}
                        </button>
                      )}

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setEditingTrip(trip)}
                            className="rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-bold text-ink cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingTrip(trip)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODALS & PANELS */}

      {/* Add Trip Modal */}
      {showAddModal && (
        <AddTripModal
          onClose={() => setShowAddModal(false)}
          onSaved={(msg) => showToast(msg)}
          user={user}
        />
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSaved={(msg) => showToast(msg)}
          user={user}
        />
      )}

      {/* Trip Detail Drawer Panel */}
      <TripDetailPanel
        trip={viewingTrip}
        isOpen={Boolean(viewingTrip)}
        onClose={() => setViewingTrip(null)}
        onEdit={(t) => setEditingTrip(t)}
        onDelete={(t) => setDeletingTrip(t)}
        isAdmin={isAdmin}
      />

      {/* Delete Confirmation Dialog */}
      {deletingTrip && (
        <ConfirmDialog
          title="Delete Trip?"
          body={`Are you sure you want to remove trip "${deletingTrip.id}" for customer "${deletingTrip.customer}"? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Trip'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingTrip(null) }}
        />
      )}

    </div>
  )
}
