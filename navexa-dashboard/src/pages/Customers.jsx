import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Users, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, Building, Phone, Mail, CreditCard, Calendar, Route
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveCustomers, subscribeCustomers, filterAndSortCustomers, getCustomer360Stats,
  getInitials, deleteCustomer
} from '../data/customerStore'
import { subscribeTrips, formatINR } from '../data/tripStore'

import AddCustomerModal from '../components/customers/AddCustomerModal'
import EditCustomerModal from '../components/customers/EditCustomerModal'
import CustomerDetailPanel from '../components/customers/CustomerDetailPanel'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import EmptyState, { SearchEmptyState, FilterEmptyState } from '../components/ui/EmptyState'

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

export default function CustomersPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store State
  const [customers, setCustomers] = useState([...liveCustomers])
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('All')
  const [specialFilter, setSpecialFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [deletingCustomer, setDeletingCustomer] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setCustomers([...liveCustomers])
    const unsubCustomers = subscribeCustomers(updated => setCustomers([...updated]))
    const unsubTrips = subscribeTrips(() => setCustomers([...liveCustomers]))

    return () => {
      unsubCustomers()
      unsubTrips()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    return filterAndSortCustomers(customers, {
      search,
      statusTab,
      filterType: specialFilter,
      sortBy,
    })
  }, [customers, search, statusTab, specialFilter, sortBy])

  // Aggregate Counts
  const counts = useMemo(() => {
    const total = customers.length
    const active = customers.filter(c => c.status === 'Active').length
    const inactive = customers.filter(c => c.status === 'Inactive').length
    const withPending = customers.filter(c => getCustomer360Stats(c.name, c.id).pendingAmount > 0).length
    const withUpcoming = customers.filter(c => getCustomer360Stats(c.name, c.id).upcomingTrips > 0).length
    return { total, active, inactive, withPending, withUpcoming }
  }, [customers])

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteCustomer(deletingCustomer.id)
      showToast(`Customer "${deletingCustomer.name}" deleted successfully.`)
      setDeletingCustomer(null)
    } catch (err) {
      console.error('Error deleting customer:', err)
      showToast('Failed to delete customer.', 'error')
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
          <h2 className="text-xl font-extrabold text-ink tracking-tight">Customer CRM</h2>
          <p className="text-xs text-ink-soft">Manage customer 360° profiles, contact preferences, and trip history.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Metric Chips Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <MetricChip
          label="All Customers"
          value={counts.total}
          active={statusTab === 'All' && specialFilter === 'All'}
          colorStyle="text-ink"
          onClick={() => { setStatusTab('All'); setSpecialFilter('All') }}
        />
        <MetricChip
          label="Active"
          value={counts.active}
          active={statusTab === 'Active'}
          colorStyle="text-emerald-700"
          onClick={() => { setStatusTab('Active'); setSpecialFilter('All') }}
        />
        <MetricChip
          label="Pending Payments"
          value={counts.withPending}
          active={specialFilter === 'Pending Payments'}
          colorStyle="text-amber-700"
          onClick={() => { setStatusTab('All'); setSpecialFilter('Pending Payments') }}
        />
        <MetricChip
          label="Upcoming Trips"
          value={counts.withUpcoming}
          active={specialFilter === 'Upcoming Trips'}
          colorStyle="text-sky-700"
          onClick={() => { setStatusTab('All'); setSpecialFilter('Upcoming Trips') }}
        />
        <MetricChip
          label="Inactive"
          value={counts.inactive}
          active={statusTab === 'Inactive'}
          colorStyle="text-slate-600"
          onClick={() => { setStatusTab('Inactive'); setSpecialFilter('All') }}
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
            placeholder="Search by customer name, phone, email, business..."
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
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <Filter size={13} className="text-ink-soft" />
            <select
              value={statusTab}
              onChange={(e) => setStatusTab(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
              <option value="Customer Name">Customer Name</option>
              <option value="Highest Revenue">Highest Revenue</option>
              <option value="Most Trips">Most Trips</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Content Views */}
      {filteredCustomers.length === 0 ? (
        search ? (
          <SearchEmptyState query={search} onClearSearch={() => setSearch('')} />
        ) : statusTab !== 'All' || specialFilter !== 'All' ? (
          <FilterEmptyState onClearFilters={() => { setStatusTab('All'); setSpecialFilter('All'); }} />
        ) : (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start building your customer records and managing trips."
            actionLabel={isAdmin ? 'Add Customer' : undefined}
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
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone & Contact</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Total Trips</th>
                  <th className="px-4 py-3">Lifetime Revenue</th>
                  <th className="px-4 py-3">Pending Payments</th>
                  <th className="px-4 py-3">Last Trip</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredCustomers.map((customer) => {
                  const stats = customer.stats

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setViewingCustomer(customer)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Name & Business */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary font-bold shadow-2xs">
                            {getInitials(customer.name)}
                          </div>
                          <div>
                            <p className="font-bold text-ink">{customer.name}</p>
                            {customer.companyName && (
                              <p className="text-[10px] text-ink-soft">{customer.companyName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold num">{customer.phone}</p>
                        <span className="text-[10px] text-ink-soft font-bold">
                          {customer.preferredContactMethod || 'Phone'}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-ink-soft font-medium">
                        {customer.email || 'N/A'}
                      </td>

                      {/* Total Trips */}
                      <td className="px-4 py-3.5 text-center font-extrabold num">
                        {stats.totalTrips}
                      </td>

                      {/* Lifetime Revenue */}
                      <td className="px-4 py-3.5 font-extrabold text-emerald-700 num">
                        {formatINR(stats.lifetimeRevenue)}
                      </td>

                      {/* Pending Payments */}
                      <td className="px-4 py-3.5 font-extrabold num">
                        {stats.pendingAmount > 0 ? (
                          <span className="inline-flex rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px]">
                            {formatINR(stats.pendingAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0</span>
                        )}
                      </td>

                      {/* Last Trip */}
                      <td className="px-4 py-3.5 text-ink-soft num font-medium">
                        {stats.lastTrip ? stats.lastTrip.tripDate : 'No trips yet'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {customer.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingCustomer(customer)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
                            title="View 360° Profile"
                          >
                            <Eye size={15} />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setEditingCustomer(customer)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer"
                                title="Edit Customer"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingCustomer(customer)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Customer"
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
            {filteredCustomers.map((customer) => {
              const stats = customer.stats

              return (
                <div
                  key={customer.id}
                  onClick={() => setViewingCustomer(customer)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary font-extrabold shadow-2xs">
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink">{customer.name}</h4>
                        <p className="text-xs text-ink-soft font-semibold num">{customer.phone}</p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {customer.status || 'Active'}
                    </span>
                  </div>

                  {/* CRM Stats Subcard */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] rounded-xl bg-bg p-3 border border-line/60">
                    <div>
                      <span className="text-ink-soft font-medium block">Total Trips:</span>
                      <span className="font-extrabold text-ink num">{stats.totalTrips}</span>
                    </div>

                    <div>
                      <span className="text-ink-soft font-medium block">Lifetime Revenue:</span>
                      <span className="font-extrabold text-emerald-700 num">{formatINR(stats.lifetimeRevenue)}</span>
                    </div>

                    {stats.pendingAmount > 0 && (
                      <div className="col-span-2 pt-1 border-t border-line/40 flex items-center justify-between text-amber-800 font-bold">
                        <span>Pending Payment:</span>
                        <span className="num">{formatINR(stats.pendingAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Action Bar */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingCustomer(customer)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Eye size={14} /> View 360° Profile
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          className="rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(customer)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MODALS & PANELS */}

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={Boolean(editingCustomer)}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Customer 360° Profile Drawer */}
      <CustomerDetailPanel
        customer={viewingCustomer}
        isOpen={Boolean(viewingCustomer)}
        onClose={() => setViewingCustomer(null)}
        onEdit={(c) => setEditingCustomer(c)}
        onDelete={(c) => setDeletingCustomer(c)}
        isAdmin={isAdmin}
        user={user}
      />

      {/* Delete Confirmation Dialog */}
      {deletingCustomer && (
        <ConfirmDialog
          title="Delete Customer Profile?"
          body={`Are you sure you want to delete customer "${deletingCustomer.name}" (${deletingCustomer.phone})? This action cannot be undone.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Customer'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingCustomer(null) }}
        />
      )}

    </div>
  )
}
