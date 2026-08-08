import { useState, useEffect, useMemo } from 'react'
import {
  UserCheck, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, AlertTriangle, ShieldAlert, Car, Phone, Calendar
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveDrivers, subscribeDrivers, filterAndSortDrivers, deleteDriver
} from '../data/driverStore'
import AddDriverModal from '../components/drivers/AddDriverModal'
import EditDriverModal from '../components/drivers/EditDriverModal'
import DriverDetailPanel from '../components/drivers/DriverDetailPanel'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import EmptyState, { SearchEmptyState, FilterEmptyState } from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'

export default function DriversPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // State
  const [drivers, setDrivers] = useState([...liveDrivers])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [viewingDriver, setViewingDriver] = useState(null)
  const [deletingDriver, setDeletingDriver] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast Notice
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setDrivers([...liveDrivers])
    const unsubscribe = subscribeDrivers((updated) => {
      setDrivers([...updated])
    })
    return () => unsubscribe()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtered and Sorted Drivers
  const filteredDrivers = useMemo(() => {
    return filterAndSortDrivers(drivers, {
      search,
      status: statusFilter,
      sortBy,
    })
  }, [drivers, search, statusFilter, sortBy])

  // Metric counts
  const metrics = useMemo(() => {
    const total = drivers.length
    const active = drivers.filter(d => d.status === 'Active').length
    const inactive = drivers.filter(d => d.status === 'Inactive').length
    const unassigned = drivers.filter(d => !d.assignedVehicleId).length
    return { total, active, inactive, unassigned }
  }, [drivers])

  const handleDeleteConfirm = async () => {
    if (!deletingDriver || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteDriver(deletingDriver.id)
      showToast(`Driver "${deletingDriver.fullName}" deleted successfully.`)
      setDeletingDriver(null)
    } catch (err) {
      console.error('Error deleting driver:', err)
      showToast('Failed to delete driver.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="page-container">
      
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

      {/* Header & Top Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-ink tracking-tight">Drivers</h2>
          <p className="text-xs text-ink-soft">Manage drivers, licenses and vehicle assignments.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-extrabold">
            {metrics.total}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Total Drivers</p>
            <p className="text-[11px] text-ink-soft">Registered in fleet</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold">
            {metrics.active}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Active</p>
            <p className="text-[11px] text-ink-soft">On duty / available</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-extrabold">
            {metrics.inactive}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Inactive</p>
            <p className="text-[11px] text-ink-soft">Off duty / paused</p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-extrabold">
            {metrics.unassigned}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Unassigned</p>
            <p className="text-[11px] text-ink-soft">No vehicle tied</p>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Instant Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by driver name, phone, or license..."
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

        {/* Status Filter & Sort Dropdowns */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs">
            <Filter size={14} className="text-ink-soft" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs">
            <span className="text-[11px] font-bold text-ink-soft">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="Driver Name A-Z">Driver Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Driver List Content */}
      {filteredDrivers.length === 0 ? (
        search ? (
          <SearchEmptyState query={search} onClearSearch={() => setSearch('')} />
        ) : statusFilter !== 'All' ? (
          <FilterEmptyState onClearFilters={() => setStatusFilter('All')} />
        ) : (
          <EmptyState
            icon={UserCheck}
            title="No drivers yet"
            description="Add your first driver profile to begin assigning trips and tracking driver licenses."
            actionLabel={isAdmin ? 'Add Driver' : undefined}
            onAction={isAdmin ? () => setShowAddModal(true) : undefined}
            actionIcon={Plus}
          />
        )
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Phone / Contact</th>
                  <th className="px-4 py-3">License Number</th>
                  <th className="px-4 py-3">License Expiry</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredDrivers.map((driver) => {
                  let isExpired = false
                  if (driver.licenseExpiryDate) {
                    isExpired = new Date(driver.licenseExpiryDate) < new Date()
                  }

                  return (
                    <tr
                      key={driver.id}
                      onClick={() => setViewingDriver(driver)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Photo & Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface overflow-hidden shadow-2xs">
                            {driver.photoUrl ? (
                              <img src={driver.photoUrl} alt={driver.fullName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">
                                {driver.fullName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-ink">{driver.fullName}</p>
                            <p className="text-[10px] text-ink-soft num">{driver.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold num">{driver.phone}</p>
                        {driver.email && <p className="text-[10px] text-ink-soft">{driver.email}</p>}
                      </td>

                      {/* License Number */}
                      <td className="px-4 py-3.5 font-bold uppercase num text-ink">
                        {driver.licenseNumber}
                      </td>

                      {/* License Expiry */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold num ${
                          isExpired ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-ink-soft'
                        }`}>
                          {driver.licenseExpiryDate || 'N/A'}
                          {isExpired && <span className="text-[9px] font-extrabold uppercase text-rose-600">Expired</span>}
                        </span>
                      </td>

                      {/* Assigned Vehicle */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Car size={14} className="text-primary shrink-0" />
                          <span>{driver.assignedVehicleName || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          driver.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {driver.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingDriver(driver)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingDriver(driver)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer"
                                title="Edit Driver"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingDriver(driver)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Driver"
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
            {filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setViewingDriver(driver)}
                className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg overflow-hidden">
                      {driver.photoUrl ? (
                        <img src={driver.photoUrl} alt={driver.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {driver.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{driver.fullName}</h4>
                      <p className="text-xs text-ink-soft font-semibold num">{driver.phone}</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    driver.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {driver.status}
                  </span>
                </div>

                {/* Details Subcard */}
                <div className="grid grid-cols-2 gap-2 text-[11px] rounded-xl bg-bg p-3 border border-line/60">
                  <div>
                    <span className="text-ink-soft font-medium block">License:</span>
                    <span className="font-extrabold text-ink uppercase num">{driver.licenseNumber}</span>
                  </div>

                  <div>
                    <span className="text-ink-soft font-medium block">Expiry:</span>
                    <span className="font-bold text-ink num">{driver.licenseExpiryDate || 'N/A'}</span>
                  </div>

                  <div className="col-span-2 pt-1 border-t border-line/40 flex items-center gap-1.5">
                    <Car size={13} className="text-primary" />
                    <span className="font-bold text-ink">{driver.assignedVehicleName || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Mobile Action Footer */}
                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setViewingDriver(driver)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Eye size={14} /> View Details
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingDriver(driver)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* MODALS & PANELS */}

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Driver Modal */}
      <EditDriverModal
        isOpen={Boolean(editingDriver)}
        driver={editingDriver}
        onClose={() => setEditingDriver(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Driver Detail Drawer Panel */}
      <DriverDetailPanel
        driver={viewingDriver}
        isOpen={Boolean(viewingDriver)}
        onClose={() => setViewingDriver(null)}
        onEdit={(drv) => setEditingDriver(drv)}
        onDelete={(drv) => setDeletingDriver(drv)}
        isAdmin={isAdmin}
      />

      {/* Delete Confirmation Dialog */}
      {deletingDriver && (
        <ConfirmDialog
          title="Delete Driver?"
          body={`Are you sure you want to delete driver "${deletingDriver.fullName}" (${deletingDriver.licenseNumber})? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Driver'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingDriver(null) }}
        />
      )}

    </div>
  )
}
