import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, Search, X, Users, Phone, Mail, Calendar, Route, MoreHorizontal,
  Edit2, CheckCircle2, UserCheck, ArrowUpDown, Filter, ChevronRight
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveCustomers, subscribeCustomers, filterCustomers, computeCustomerSummary,
  getCustomerStats, getInitials
} from '../data/customerStore'
import { subscribeTrips } from '../data/tripStore'
import QuickActionModal from '../components/ui/QuickActionModal'
import EditCustomerModal from '../components/customers/EditCustomerModal'
import CustomerDetailPanel from '../components/customers/CustomerDetailPanel'

// ─── Metric Chip ─────────────────────────────────────────────────────────────
function MetricChip({ label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? 'border-primary bg-primary text-white shadow-xs'
          : 'border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className={`num font-extrabold text-base leading-none ${active ? 'text-white' : 'text-primary'}`}>
        {value}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</span>
    </button>
  )
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
function CustomerRowActions({ customer, onView, onEdit }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
        aria-label="Customer actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-xl border border-line bg-surface shadow-pop py-1 animate-fadeIn">
          <button
            onClick={() => { setOpen(false); onView() }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <UserCheck size={13} className="text-ink-soft" /> View Details
          </button>
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Edit2 size={13} className="text-ink-soft" /> Edit Customer
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Table Row Component ──────────────────────────────────────────────────────
function CustomerTableRow({ customer, onView, onEdit }) {
  const stats = getCustomerStats(customer.name)
  const formattedDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recently'

  return (
    <tr
      onClick={onView}
      className="group transition-colors hover:bg-slate-50/80 cursor-pointer border-b border-line/60"
    >
      <td className="py-3 px-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-bold text-primary shadow-2xs">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink truncate">{customer.name}</p>
            {customer.email && (
              <p className="text-[11px] text-ink-soft truncate">{customer.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-3.5 whitespace-nowrap">
        <span className="text-xs text-ink font-medium num">{customer.phone}</span>
      </td>
      <td className="py-3 px-3.5 text-center">
        <span className="num text-xs font-bold text-ink">{stats.totalTrips}</span>
      </td>
      <td className="py-3 px-3.5 text-center">
        {stats.upcomingTrips > 0 ? (
          <span className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
            {stats.upcomingTrips} Upcoming
          </span>
        ) : (
          <span className="text-xs text-ink-soft">—</span>
        )}
      </td>
      <td className="hidden md:table-cell py-3 px-3.5 whitespace-nowrap">
        <span className="text-xs text-ink-soft">{stats.lastTripDate || 'No trips yet'}</span>
      </td>
      <td className="hidden lg:table-cell py-3 px-3.5 whitespace-nowrap">
        <span className="text-xs text-ink-soft">{formattedDate}</span>
      </td>
      <td className="py-3 px-3.5 text-right" onClick={e => e.stopPropagation()}>
        <CustomerRowActions customer={customer} onView={onView} onEdit={onEdit} />
      </td>
    </tr>
  )
}

// ─── Mobile Card Component ────────────────────────────────────────────────────
function CustomerMobileCard({ customer, onView, onEdit }) {
  const stats = getCustomerStats(customer.name)

  return (
    <div
      onClick={onView}
      className="w-full rounded-2xl border border-line bg-surface p-4 space-y-3 transition-all hover:border-slate-300 hover:shadow-xs active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-extrabold text-primary">
            {getInitials(customer.name)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">{customer.name}</h4>
            <p className="text-xs text-ink-soft num">{customer.phone}</p>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <CustomerRowActions customer={customer} onView={onView} onEdit={onEdit} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-soft pt-2 border-t border-line/60">
        <div>
          <span>Total Trips: </span>
          <span className="num font-bold text-ink">{stats.totalTrips}</span>
        </div>
        <div>
          {stats.upcomingTrips > 0 ? (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
              {stats.upcomingTrips} Upcoming
            </span>
          ) : (
            <span>Last: {stats.lastTripDate || 'No trips'}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State Component ────────────────────────────────────────────────────
function EmptyState({ hasFilters, onAddCustomer, onClearFilters }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Filter size={32} className="text-ink-soft/40 mb-3" />
        <p className="text-sm font-bold text-ink mb-1">No customers found.</p>
        <p className="text-xs text-ink-soft mb-4">Try adjusting your search or filters.</p>
        <button
          onClick={onClearFilters}
          className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-100 cursor-pointer"
        >
          Clear Search / Filters
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users size={36} className="text-ink-soft/30 mb-3" />
      <p className="text-sm font-bold text-ink mb-1">No customers yet.</p>
      <p className="text-xs text-ink-soft mb-5">Add your first customer to start managing trips and customer history.</p>
      <button
        onClick={onAddCustomer}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 shadow-xs cursor-pointer"
      >
        <Plus size={14} /> Add Customer
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN CUSTOMERS PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function CustomersPage() {
  const { user } = useUser()
  const [customers, setCustomers] = useState([...liveCustomers])
  const [summary,   setSummary]   = useState(computeCustomerSummary())

  // Subscribe to customerStore and tripStore for real-time reactivity
  useEffect(() => {
    const unsubCust = subscribeCustomers(snap => {
      setCustomers([...snap])
      setSummary(computeCustomerSummary())
    })
    const unsubTrips = subscribeTrips(() => {
      setCustomers([...liveCustomers])
      setSummary(computeCustomerSummary())
    })
    return () => {
      unsubCust()
      unsubTrips()
    }
  }, [])

  // Filters & Search
  const [search,    setSearch]    = useState('')
  const [filterTab, setFilterTab] = useState('All')

  // Modals & Panels
  const [addModalOpen,     setAddModalOpen]     = useState(false)
  const [editingCustomer,  setEditingCustomer]  = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [toast,            setToast]            = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterTab('All')
  }

  const hasActiveFilters = Boolean(search || filterTab !== 'All')

  // Filtered customer list
  const filteredList = useMemo(() => {
    return filterCustomers({ search, filterTab })
  }, [customers, search, filterTab])

  const filterTabs = ['All Customers', 'With Upcoming Trips', 'Recently Added']

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
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Customers</h1>
          <p className="text-xs text-ink-soft mt-0.5">Manage your customers and view their trip history.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
        >
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* ── Summary Chips ── */}
      <div className="flex flex-wrap gap-2.5">
        <MetricChip
          label="Total Customers"
          value={summary.total}
          active={filterTab === 'All'}
          onClick={() => setFilterTab('All')}
        />
        <MetricChip
          label="With Upcoming Trips"
          value={summary.customersWithUpcoming}
          active={filterTab === 'With Upcoming Trips'}
          onClick={() => setFilterTab('With Upcoming Trips')}
        />
        <MetricChip
          label="New This Month"
          value={summary.newThisMonth}
          active={filterTab === 'Recently Added'}
          onClick={() => setFilterTab('Recently Added')}
        />
      </div>

      {/* ── Search Bar & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
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
          {filterTabs.map(t => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterTab === t
                  ? 'bg-primary-50 text-primary rounded-xl'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t}
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

      {/* ── Table (Desktop) / Cards (Mobile) ── */}
      {filteredList.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onAddCustomer={() => setAddModalOpen(true)}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block w-full rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Phone</th>
                    <th className="py-2.5 px-3.5 text-center">Total Trips</th>
                    <th className="py-2.5 px-3.5 text-center">Upcoming</th>
                    <th className="hidden md:table-cell py-2.5 px-3.5">Last Trip</th>
                    <th className="hidden lg:table-cell py-2.5 px-3.5">Added Date</th>
                    <th className="py-2.5 px-3.5 text-right w-12" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredList.map(c => (
                    <CustomerTableRow
                      key={c.id}
                      customer={c}
                      onView={() => setSelectedCustomer(c)}
                      onEdit={() => setEditingCustomer(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {filteredList.map(c => (
              <CustomerMobileCard
                key={c.id}
                customer={c}
                onView={() => setSelectedCustomer(c)}
                onEdit={() => setEditingCustomer(c)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modal: Add Customer ── */}
      <QuickActionModal
        isOpen={addModalOpen}
        type="customer"
        onClose={() => setAddModalOpen(false)}
        onToast={showToast}
      />

      {/* ── Modal: Edit Customer ── */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={(msg) => {
            setEditingCustomer(null)
            showToast(msg || 'Customer updated.')
          }}
          user={user}
        />
      )}

      {/* ── Panel: Customer Details ── */}
      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => {
            const cust = selectedCustomer
            setSelectedCustomer(null)
            setEditingCustomer(cust)
          }}
          user={user}
          onToast={showToast}
        />
      )}
    </div>
  )
}
