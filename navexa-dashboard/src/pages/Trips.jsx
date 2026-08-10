import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Route, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, ArrowRight, User, Car, Calendar, Clock, AlertTriangle, AlertCircle, ShieldCheck, Gauge, Check
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveTrips, subscribeTrips, filterAndSortTrips, getNextTripStatus,
  updateTripStatus, deleteTrip, formatINR, TRIP_STAGES, isTripFinalized
} from '../data/tripStore'
import { liveDrivers, subscribeDrivers } from '../data/driverStore'
import { liveVehicles, subscribeVehicles } from '../data/vehicleStore'
import { liveCustomers, subscribeCustomers } from '../data/customerStore'

import { useRouter } from '../context/RouterContext'
import AddTripModal from '../components/trips/AddTripModal'
import EditTripModal from '../components/trips/EditTripModal'
import TripDetailPanel from '../components/trips/TripDetailPanel'
import CancelTripModal from '../components/trips/CancelTripModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import PasswordConfirmModal from '../components/ui/PasswordConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'

export default function TripsPage() {
  const { user } = useUser()
  const { routeParams, clearRouteParams } = useRouter()
  const isAdmin = user?.role !== 'Staff'

  // Data Store State
  const [trips, setTrips] = useState([...liveTrips])
  const [drivers, setDrivers] = useState([...liveDrivers])
  const [vehicles, setVehicles] = useState([...liveVehicles])
  const [customers, setCustomers] = useState([...liveCustomers])

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(routeParams?.Trips?.statusFilter || 'All')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    if (routeParams?.Trips?.statusFilter) {
      setStatusFilter(routeParams.Trips.statusFilter)
    }
  }, [routeParams?.Trips?.statusFilter])
  const [driverFilter, setDriverFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [customerFilter, setCustomerFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('Newest')

  // Mobile Filter Drawer Sheet state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)
  const [viewingTrip, setViewingTrip] = useState(null)
  const [cancellingTrip, setCancellingTrip] = useState(null)
  const [deletingTrip, setDeletingTrip] = useState(null)
  const [passwordConfirmTrip, setPasswordConfirmTrip] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setTrips([...liveTrips])
    const unsubTrips = subscribeTrips(updated => setTrips([...updated]))
    const unsubDrivers = subscribeDrivers(snap => setDrivers([...snap]))
    const unsubVehicles = subscribeVehicles(snap => setVehicles([...snap]))
    const unsubCustomers = subscribeCustomers(snap => setCustomers([...snap]))

    return () => {
      unsubTrips()
      unsubDrivers()
      unsubVehicles()
      unsubCustomers()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Active Filter Count Calculation
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'All') count++
    if (typeFilter !== 'All') count++
    if (driverFilter !== 'All') count++
    if (vehicleFilter !== 'All') count++
    if (customerFilter !== 'All') count++
    if (dateFilter) count++
    return count
  }, [statusFilter, typeFilter, driverFilter, vehicleFilter, customerFilter, dateFilter])

  const handleResetFilters = () => {
    setStatusFilter('All')
    setTypeFilter('All')
    setDriverFilter('All')
    setVehicleFilter('All')
    setCustomerFilter('All')
    setDateFilter('')
    setSearch('')
    setSortBy('Newest')
  }

  // Filtered & Sorted list
  const filteredTrips = useMemo(() => {
    let list = filterAndSortTrips(trips, {
      search,
      status: statusFilter,
      driverId: driverFilter,
      vehicleId: vehicleFilter,
      tripType: typeFilter,
      tripDate: dateFilter,
      sortBy,
    })

    if (customerFilter !== 'All') {
      list = list.filter(t => t.customer.toLowerCase() === customerFilter.toLowerCase())
    }

    return list
  }, [trips, search, statusFilter, driverFilter, vehicleFilter, typeFilter, customerFilter, dateFilter, sortBy])

  // Operational Counts
  const counts = useMemo(() => {
    const total = trips.length
    const booked = trips.filter(t => t.status === 'Booked' || t.status === 'Confirmed').length
    const assigned = trips.filter(t => t.status === 'Driver Assigned' || t.status === 'Vehicle Assigned').length
    const active = trips.filter(t => t.status === 'Started' || t.status === 'Passenger Picked Up').length
    const completed = trips.filter(t => t.status === 'Completed').length
    const cancelled = trips.filter(t => t.status === 'Cancelled').length
    return { total, booked, assigned, active, completed, cancelled }
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
      showToast(`Trip record "${deletingTrip.id}" removed successfully.`)
      setDeletingTrip(null)
    } catch (err) {
      console.error('Error deleting trip:', err)
      showToast('Failed to delete trip.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="page-container">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed right-4 top-16 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-pop animate-slideDown ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle size={16} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* 1. Page Identity & Primary Action Header */}
      <PageHeader
        title="Trips & Operations"
        description="Dispatch, track, and manage passenger trip bookings across your fleet."
        badge={`${trips.length} Total`}
        actionLabel={isAdmin ? 'Add Trip' : undefined}
        onAction={isAdmin ? () => setShowAddModal(true) : undefined}
        actionIcon={Plus}
      />

      {/* 2. Operational Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* All Trips */}
        <button
          onClick={() => setStatusFilter('All')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'All' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-extrabold num text-sm">
            {counts.total}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">All Trips</p>
            <p className="text-[10px] text-ink-soft">Total logged</p>
          </div>
        </button>

        {/* Booked */}
        <button
          onClick={() => setStatusFilter('Booked')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'Booked' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-extrabold num text-sm">
            {counts.booked}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">Booked</p>
            <p className="text-[10px] text-ink-soft">New bookings</p>
          </div>
        </button>

        {/* Assigned */}
        <button
          onClick={() => setStatusFilter('Driver Assigned')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'Driver Assigned' || statusFilter === 'Vehicle Assigned' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-extrabold num text-sm">
            {counts.assigned}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">Assigned</p>
            <p className="text-[10px] text-ink-soft">Fleet ready</p>
          </div>
        </button>

        {/* Active / Ongoing */}
        <button
          onClick={() => setStatusFilter('Active')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'Active' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-extrabold num text-sm">
            {counts.active}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">Active / Road</p>
            <p className="text-[10px] text-ink-soft">On route</p>
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => setStatusFilter('Completed')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'Completed' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold num text-sm">
            {counts.completed}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">Completed</p>
            <p className="text-[10px] text-ink-soft">Finished</p>
          </div>
        </button>

        {/* Cancelled */}
        <button
          onClick={() => setStatusFilter('Cancelled')}
          className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-2xs text-left transition-all cursor-pointer ${
            statusFilter === 'Cancelled' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-extrabold num text-sm">
            {counts.cancelled}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-ink truncate">Cancelled</p>
            <p className="text-[10px] text-ink-soft">Closed</p>
          </div>
        </button>
      </div>

      {/* Contextual Attention Filter Banner */}
      {statusFilter === 'Needs Assignment' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-extrabold shadow-2xs">
              <Route size={18} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-950">
                Filtered View: Trips Needing Driver/Vehicle Assignment ({filteredTrips.length})
              </h3>
              <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                Prioritizing operational urgency. Assign driver and vehicle directly to resolve each trip.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter('All')
              clearRouteParams('Trips')
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X size={14} /> Clear Filter
          </button>
        </div>
      )}

      {/* 3. Search, Filter & Sort Controls Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, driver, vehicle, trip ID, pickup or drop..."
            className="w-full rounded-xl border border-line bg-bg pl-9.5 pr-8 py-2 text-xs sm:text-sm font-medium text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Action Controls & Mobile Filter Button */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Sheet Trigger Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeFilterCount > 0
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-line bg-surface text-ink hover:bg-slate-50'
            }`}
          >
            <Filter size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary text-white h-4.5 w-4.5 flex items-center justify-center text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop Filter Selectors */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Status Stage Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="Active">Active / On Road</option>
              {TRIP_STAGES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Trip Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="One Way">One Way</option>
              <option value="Round Trip">Round Trip</option>
              <option value="Airport">Airport</option>
              <option value="Outstation">Outstation</option>
              <option value="Local">Local</option>
            </select>

            {/* Driver Filter */}
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-bold text-ink outline-none cursor-pointer"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Trip Date">Trip Date</option>
            <option value="Customer Name">Customer Name</option>
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 📱 Mobile Filter Bottom Drawer Sheet Modal */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-xs animate-fadeIn"
          onClick={e => { if (e.target === e.currentTarget) setMobileFilterOpen(false) }}
        >
          <div className="w-full rounded-t-3xl border-t border-line bg-surface p-5 shadow-pop animate-slideUp space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-ink">Filter Trips & Operations</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Status Stage */}
              <div>
                <label className="label-text">Workflow Stage</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Stages</option>
                  <option value="Active">Active / On Road</option>
                  {TRIP_STAGES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Trip Type */}
              <div>
                <label className="label-text">Trip Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Trip Types</option>
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                  <option value="Airport">Airport</option>
                  <option value="Outstation">Outstation</option>
                  <option value="Local">Local</option>
                </select>
              </div>

              {/* Driver */}
              <div>
                <label className="label-text">Assigned Driver</label>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle */}
              <div>
                <label className="label-text">Assigned Vehicle</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Vehicles</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.reg})</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="label-text">Specific Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-line">
              <button
                onClick={handleResetFilters}
                className="rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-ink-soft hover:bg-slate-100 cursor-pointer"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Trip List Section */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No matching trips found"
          description={
            search || activeFilterCount > 0
              ? 'No trip matches your search or active filter parameters.'
              : 'Add your first trip to start managing passenger bookings and driver assignments.'
          }
          actionLabel={isAdmin && !search && activeFilterCount === 0 ? 'Add Trip' : 'Clear Filters'}
          onAction={isAdmin && !search && activeFilterCount === 0 ? () => setShowAddModal(true) : handleResetFilters}
          actionIcon={isAdmin && !search && activeFilterCount === 0 ? Plus : X}
        />
      ) : (
        <>
          {/* 🖥️ DESKTOP & TABLET TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Customer & ID</th>
                  <th className="px-4 py-3">Route (Pickup ➔ Drop)</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Vehicle & Driver</th>
                  <th className="px-4 py-3">Distance (Est / Actual)</th>
                  <th className="px-4 py-3 text-right">Fare</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredTrips.map((trip) => {
                  const isFinalized = isTripFinalized(trip)
                  const nextAction = !isFinalized ? getNextTripStatus(trip.status) : null

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => setViewingTrip(trip)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Customer & Trip ID */}
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold text-ink">{trip.customer}</p>
                        <p className="text-[10px] text-ink-soft num font-bold">{trip.id}</p>
                      </td>

                      {/* Route */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-ink">
                          <span>{trip.pickupLocation}</span>
                          <ArrowRight size={12} className="text-primary shrink-0" />
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
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-ink flex items-center gap-1">
                            <Car size={13} className="text-primary shrink-0" />
                            {trip.vehicle || 'Unassigned'} {trip.vehicleReg ? `(${trip.vehicleReg})` : ''}
                          </p>
                          <p className="text-[10px] text-ink-soft flex items-center gap-1">
                            <User size={12} className="shrink-0" />
                            {trip.driverName || 'Unassigned'}
                          </p>
                          {!isFinalized && (!trip.driverId || trip.driverName === 'Unassigned' || !trip.vehicleId || trip.vehicle === 'Unassigned') && (
                            <div className="pt-0.5">
                              {(!trip.driverId || trip.driverName === 'Unassigned') && (!trip.vehicleId || trip.vehicle === 'Unassigned') ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                                  <AlertTriangle size={10} /> Driver & Vehicle — Missing
                                </span>
                              ) : (!trip.driverId || trip.driverName === 'Unassigned') ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                  <AlertCircle size={10} /> Driver — Missing
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                  <AlertCircle size={10} /> Vehicle — Missing
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Distance: Estimated vs Actual Odometer Distance */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-ink num">
                          {trip.actualDistance !== null ? `${trip.actualDistance} km (Act)` : trip.estimatedDistance ? `${trip.estimatedDistance} km (Est)` : 'N/A'}
                        </p>
                      </td>

                      {/* Fare */}
                      <td className="px-4 py-3.5 text-right font-extrabold text-ink num">
                        {formatINR(trip.fare)}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={trip.paymentStatus} showDot={false} size="sm" />
                      </td>

                      {/* Workflow Stage Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge status={trip.status} size="sm" />
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

                          {isAdmin && !isFinalized && (
                            <>
                              <button
                                onClick={() => setEditingTrip(trip)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer"
                                title="Edit Trip"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setCancellingTrip(trip)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                                title="Cancel Trip"
                              >
                                <AlertTriangle size={15} />
                              </button>
                            </>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => setDeletingTrip(trip)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Trip Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 MOBILE RESPONSIVE CARDS VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTrips.map((trip) => {
              const isFinalized = isTripFinalized(trip)
              const nextAction = !isFinalized ? getNextTripStatus(trip.status) : null

              return (
                <div
                  key={trip.id}
                  onClick={() => setViewingTrip(trip)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Primary Row: Customer & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-ink">{trip.customer}</h4>
                      <p className="text-[11px] text-ink-soft num font-bold">{trip.id}</p>
                    </div>
                    <StatusBadge status={trip.status} size="sm" />
                  </div>

                  {/* Route & Schedule Box */}
                  <div className="rounded-xl bg-bg p-3 border border-line/60 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-ink">
                      <span>{trip.pickupLocation}</span>
                      <ArrowRight size={13} className="text-primary shrink-0" />
                      <span>{trip.destination}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-soft num pt-1 border-t border-line/50">
                      <span>{trip.tripDate} • {trip.tripTime}</span>
                      <span className="font-extrabold text-ink">{formatINR(trip.fare)}</span>
                    </div>
                  </div>

                  {/* Secondary: Vehicle, Driver, Payment */}
                  <div className="flex items-center justify-between text-[11px] text-ink-soft">
                    <div className="flex items-center gap-1 font-semibold text-ink">
                      <Car size={12} className="text-primary" />
                      <span>{trip.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={trip.paymentStatus} showDot={false} size="sm" />
                      {trip.actualDistance !== null && (
                        <span className="font-bold text-primary num">{trip.actualDistance} km</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-line" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] font-semibold text-ink-soft">
                      Driver: <strong className="text-ink">{trip.driverName || 'Unassigned'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {nextAction && isAdmin && (
                        <button
                          onClick={() => handleNextStage(trip)}
                          className="rounded-lg bg-primary-50 text-primary border border-primary/20 px-2.5 py-1 text-[11px] font-bold hover:bg-primary-100 transition-colors cursor-pointer"
                        >
                          {nextAction.label}
                        </button>
                      )}

                      {isAdmin && !isFinalized && (
                        <button
                          onClick={() => setCancellingTrip(trip)}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => setViewingTrip(trip)}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-slate-50 cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 5. Modals & Drawers */}

      {/* Add Trip Modal */}
      {showAddModal && (
        <AddTripModal
          onClose={() => setShowAddModal(false)}
          onSaved={(msg) => {
            showToast(msg)
            setShowAddModal(false)
          }}
          user={user}
        />
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          onClose={() => setEditingTrip(null)}
          onSaved={(msg) => {
            showToast(msg)
            setEditingTrip(null)
          }}
          user={user}
        />
      )}

      {/* Slide-over Trip Details Panel */}
      {viewingTrip && (
        <TripDetailPanel
          trip={viewingTrip}
          isOpen={Boolean(viewingTrip)}
          onClose={() => setViewingTrip(null)}
          onEdit={(t) => {
            setViewingTrip(null)
            setEditingTrip(t)
          }}
          onCancel={(t) => {
            setViewingTrip(null)
            setCancellingTrip(t)
          }}
          onDelete={(t) => {
            setViewingTrip(null)
            setDeletingTrip(t)
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* Cancel Trip Modal */}
      <CancelTripModal
        trip={cancellingTrip}
        isOpen={Boolean(cancellingTrip)}
        onClose={() => setCancellingTrip(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Delete / Cancel Confirmation Modal */}
      {deletingTrip && (
        <ConfirmDialog
          title={`Remove Trip Record #${deletingTrip.id}?`}
          body={`Are you sure you want to delete trip booking #${deletingTrip.id} for customer "${deletingTrip.customer}"? Password verification will be required to confirm.`}
          confirmLabel="Proceed to Verification"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={() => {
            setPasswordConfirmTrip(deletingTrip)
            setDeletingTrip(null)
          }}
          onCancel={() => setDeletingTrip(null)}
        />
      )}

      {/* Password Verification for Trip Deletion */}
      <PasswordConfirmModal
        isOpen={Boolean(passwordConfirmTrip)}
        title="Confirm Trip Record Deletion"
        description={`Deleting trip #${passwordConfirmTrip?.id} (${passwordConfirmTrip?.customer}) will permanently remove operational and dispatch records. Enter password to confirm.`}
        actionLabel="Delete Trip Record"
        onConfirm={async () => {
          if (!passwordConfirmTrip) return
          await deleteTrip(passwordConfirmTrip.id)
          showToast(`Trip record "${passwordConfirmTrip.id}" removed successfully.`)
          setPasswordConfirmTrip(null)
        }}
        onClose={() => setPasswordConfirmTrip(null)}
      />
    </div>
  )
}
