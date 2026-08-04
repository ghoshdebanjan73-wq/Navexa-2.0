import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Car, Plus, Search, X, Filter, MoreHorizontal, CheckCircle2,
  Route, AlertTriangle, ShieldAlert, CheckCircle, Clock, Eye, Edit3, Trash2, User, Wrench
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveVehicles, subscribeVehicles, filterAndSortVehicles, getVehicleCounts,
  updateVehicleStatus, getEffectiveVehicleStatus, getInsuranceStatus, getMaintenanceAlert, deleteVehicle
} from '../data/vehicleStore'
import { subscribeTrips } from '../data/tripStore'
import AddVehicleModal from '../components/vehicles/AddVehicleModal'
import EditVehicleModal from '../components/vehicles/EditVehicleModal'
import VehicleDetailPanel from '../components/vehicles/VehicleDetailPanel'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'

// Status Badge Styles
const STATUS_STYLES = {
  Available:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle },
  'On Trip':   { bg: 'bg-sky-50 text-sky-700 border-sky-200/60',             icon: Route },
  Maintenance: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60',         icon: AlertTriangle },
  Inactive:    { bg: 'bg-slate-100 text-slate-700 border-slate-200/60',       icon: ShieldAlert },
}

// Metric Chip Component
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

// Actions Popup Menu
function VehicleCardActions({ vehicle, onViewDetails, onEdit, onDelete, onStatusChange, isAdmin }) {
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

          {isAdmin && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false); onEdit() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 cursor-pointer"
              >
                <Edit3 size={14} className="text-primary" />
                <span>Edit Vehicle</span>
              </button>

              <button
                onClick={e => { e.stopPropagation(); setOpen(false); onDelete() }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Vehicle</span>
              </button>
            </>
          )}

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

export default function VehiclesPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store listener state
  const [vehicles, setVehicles] = useState([...liveVehicles])
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [driverFilter, setDriverFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [viewingVehicle, setViewingVehicle] = useState(null)
  const [deletingVehicle, setDeletingVehicle] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setVehicles([...liveVehicles])
    const unsubVehicles = subscribeVehicles(updated => setVehicles([...updated]))
    const unsubTrips = subscribeTrips(() => setVehicles([...liveVehicles]))

    return () => {
      unsubVehicles()
      unsubTrips()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Derived counts
  const counts = useMemo(() => getVehicleCounts(), [vehicles])

  // Filtered and Sorted list
  const filteredVehicles = useMemo(() => {
    return filterAndSortVehicles(vehicles, {
      search,
      statusTab,
      vehicleType: typeFilter,
      assignedDriver: driverFilter,
      sortBy,
    })
  }, [vehicles, search, statusTab, typeFilter, driverFilter, sortBy])

  const handleStatusChange = async (vehicle, newStatus) => {
    await updateVehicleStatus(vehicle.id, newStatus)
    showToast(`Status for "${vehicle.name}" updated to ${newStatus}`)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingVehicle || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteVehicle(deletingVehicle.id)
      showToast(`Vehicle "${deletingVehicle.name}" removed successfully.`)
      setDeletingVehicle(null)
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      showToast('Failed to delete vehicle.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="page-container">
      
      {/* Toast Notification */}
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
          <h2 className="text-xl font-extrabold text-ink tracking-tight">Vehicles</h2>
          <p className="text-xs text-ink-soft">Manage fleet vehicles, specifications, compliance, and driver assignments.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Metric Chips Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <MetricChip
          label="All Fleet"
          value={counts.total}
          active={statusTab === 'All'}
          colorStyle="text-ink"
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
          colorStyle="text-slate-600"
          onClick={() => setStatusTab('Inactive')}
        />
      </div>

      {/* Search, Secondary Filters & Sort Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Instant Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle name, registration number, brand..."
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

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <Filter size={13} className="text-ink-soft" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Luxury">Luxury</option>
              <option value="Van">Van</option>
              <option value="Minibus">Minibus</option>
            </select>
          </div>

          {/* Driver Assignment Filter */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <User size={13} className="text-ink-soft" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Drivers</option>
              <option value="Assigned">Assigned Only</option>
              <option value="Unassigned">Unassigned Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <span className="text-[11px] font-bold text-ink-soft">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Vehicle Name">Vehicle Name</option>
              <option value="Registration Number">Reg Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Content Views */}
      {filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description={
            search || statusTab !== 'All' || typeFilter !== 'All'
              ? 'No vehicle matches your filter criteria.'
              : 'Add your transport vehicles to start logging trips, documents, and maintenance schedules.'
          }
          actionLabel={isAdmin && !search && statusTab === 'All' ? 'Add Vehicle' : undefined}
          onAction={isAdmin && !search && statusTab === 'All' ? () => setShowAddModal(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Registration Number</th>
                  <th className="px-4 py-3">Type & Specs</th>
                  <th className="px-4 py-3">Assigned Driver</th>
                  <th className="px-4 py-3">Insurance Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredVehicles.map((vehicle) => {
                  const effectiveStatus = getEffectiveVehicleStatus(vehicle)
                  const statusStyle = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.Available
                  const StatusIcon = statusStyle.icon
                  const insurance = getInsuranceStatus(vehicle)
                  const warning = getMaintenanceAlert(vehicle)

                  return (
                    <tr
                      key={vehicle.id}
                      onClick={() => setViewingVehicle(vehicle)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Vehicle Photo & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-bg overflow-hidden shadow-2xs">
                            {vehicle.photoUrl ? (
                              <img src={vehicle.photoUrl} alt={vehicle.name} className="h-full w-full object-cover" />
                            ) : (
                              <Car size={18} className="text-ink-soft" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-ink">{vehicle.name}</p>
                            {warning && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                                <AlertTriangle size={10} /> Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reg Number */}
                      <td className="px-4 py-3.5 font-extrabold uppercase num text-ink">
                        {vehicle.reg}
                      </td>

                      {/* Type & Specs */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-ink">{vehicle.type}</p>
                        <p className="text-[10px] text-ink-soft">
                          {vehicle.brand || 'N/A'} • {vehicle.seats || 4} Seats
                        </p>
                      </td>

                      {/* Assigned Driver */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                          <User size={13} className="text-primary shrink-0" />
                          <span>{vehicle.assignedDriverName || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Insurance Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${insurance.color}`}>
                          {insurance.status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle.bg}`}>
                          <StatusIcon size={12} strokeWidth={2.5} />
                          {effectiveStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <VehicleCardActions
                          vehicle={vehicle}
                          onViewDetails={() => setViewingVehicle(vehicle)}
                          onEdit={() => setEditingVehicle(vehicle)}
                          onDelete={() => setDeletingVehicle(vehicle)}
                          onStatusChange={(st) => handleStatusChange(vehicle, st)}
                          isAdmin={isAdmin}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredVehicles.map((vehicle) => {
              const effectiveStatus = getEffectiveVehicleStatus(vehicle)
              const statusStyle = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.Available
              const StatusIcon = statusStyle.icon
              const insurance = getInsuranceStatus(vehicle)
              const warning = getMaintenanceAlert(vehicle)

              return (
                <div
                  key={vehicle.id}
                  onClick={() => setViewingVehicle(vehicle)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-bg overflow-hidden">
                        {vehicle.photoUrl ? (
                          <img src={vehicle.photoUrl} alt={vehicle.name} className="h-full w-full object-cover" />
                        ) : (
                          <Car size={20} className="text-ink-soft" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-ink truncate">{vehicle.name}</h4>
                        <p className="text-xs text-ink-soft font-extrabold uppercase num mt-0.5">{vehicle.reg}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${statusStyle.bg}`}>
                      <StatusIcon size={11} strokeWidth={2.5} />
                      {effectiveStatus}
                    </span>
                  </div>

                  {/* Warning Alert if present */}
                  {warning && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] font-bold text-amber-800">
                      <AlertTriangle size={12} className="shrink-0 text-amber-600" />
                      <span>{warning}</span>
                    </div>
                  )}

                  {/* Details Subcard */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] rounded-xl bg-bg p-3 border border-line/60">
                    <div>
                      <span className="text-ink-soft font-medium block">Type:</span>
                      <span className="font-semibold text-ink">{vehicle.type}</span>
                    </div>

                    <div>
                      <span className="text-ink-soft font-medium block">Insurance:</span>
                      <span className={`inline-flex rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${insurance.color}`}>
                        {insurance.status}
                      </span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-line/40 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-primary shrink-0" />
                        <span className="font-bold text-ink">{vehicle.assignedDriverName || 'Unassigned'}</span>
                      </div>

                      {vehicle.odometer && (
                        <span className="text-ink-soft font-semibold num">{vehicle.odometer.toLocaleString()} km</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Footer Actions */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingVehicle(vehicle)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    <VehicleCardActions
                      vehicle={vehicle}
                      onViewDetails={() => setViewingVehicle(vehicle)}
                      onEdit={() => setEditingVehicle(vehicle)}
                      onDelete={() => setDeletingVehicle(vehicle)}
                      onStatusChange={(st) => handleStatusChange(vehicle, st)}
                      isAdmin={isAdmin}
                    />
                  </div>

                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODALS & DRAWERS */}

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={Boolean(editingVehicle)}
        vehicle={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Vehicle Details Panel */}
      <VehicleDetailPanel
        vehicle={viewingVehicle}
        isOpen={Boolean(viewingVehicle)}
        onClose={() => setViewingVehicle(null)}
        onEdit={(v) => setEditingVehicle(v)}
        onDelete={(v) => setDeletingVehicle(v)}
        isAdmin={isAdmin}
      />

      {/* Delete Confirmation Dialog */}
      {deletingVehicle && (
        <ConfirmDialog
          title="Delete Vehicle?"
          body={`Are you sure you want to remove vehicle "${deletingVehicle.name}" (${deletingVehicle.reg}) from the fleet? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Vehicle'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingVehicle(null) }}
        />
      )}

    </div>
  )
}
