import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, CreditCard, ArrowRight, Calendar, User, Route, IndianRupee,
  AlertTriangle, ShieldCheck, SlidersHorizontal, Check, Printer
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import {
  liveInvoices, subscribeInvoices, filterAndSortInvoices, getInvoiceStats,
  autoGenerateInvoiceFromTrip, deleteInvoice, updateInvoiceStatus, INVOICE_STATUSES
} from '../data/invoiceStore'
import { liveTrips, subscribeTrips, formatINR } from '../data/tripStore'
import { liveCustomers, subscribeCustomers } from '../data/customerStore'

import InvoiceDetailModal from '../components/invoices/InvoiceDetailModal'
import RecordInvoicePaymentModal from '../components/invoices/RecordInvoicePaymentModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import PageHeader from '../components/ui/PageHeader'
import { printInvoice } from '../utils/printInvoice'

export default function InvoicesPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store States
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [completedTrips, setCompletedTrips] = useState([])
  const [customers, setCustomers] = useState([...liveCustomers])

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [customerFilter, setCustomerFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Mobile Filter Sheet Modal
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [deletingInvoice, setDeletingInvoice] = useState(null)
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false)
  const [selectedTripToInvoice, setSelectedTripToInvoice] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast Banner State
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setInvoices([...liveInvoices])
    const unsubInvoices = subscribeInvoices(snap => setInvoices([...snap]))
    const unsubTrips = subscribeTrips(snap => {
      setCompletedTrips(snap.filter(t => t.status === 'Completed' || t.status === 'Started' || t.status === 'Passenger Picked Up'))
    })
    const unsubCustomers = subscribeCustomers(snap => setCustomers([...snap]))

    setCompletedTrips(liveTrips.filter(t => t.status === 'Completed' || t.status === 'Started' || t.status === 'Passenger Picked Up'))

    return () => {
      unsubInvoices()
      unsubTrips()
      unsubCustomers()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'All') count++
    if (customerFilter !== 'All') count++
    return count
  }, [statusFilter, customerFilter])

  const handleResetFilters = () => {
    setStatusFilter('All')
    setCustomerFilter('All')
    setSearch('')
    setSortBy('Newest')
  }

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return filterAndSortInvoices(invoices, {
      search,
      paymentStatus: statusFilter,
      customerId: customerFilter,
      sortBy,
    })
  }, [invoices, search, statusFilter, customerFilter, sortBy])

  // Aggregate Stats
  const stats = useMemo(() => getInvoiceStats(), [invoices])

  // Auto Generate Action
  const handleAutoGenerate = async () => {
    if (!selectedTripToInvoice || isGenerating) return
    const trip = liveTrips.find(t => t.id === selectedTripToInvoice)
    if (!trip) return

    setIsGenerating(true)
    try {
      const generated = await autoGenerateInvoiceFromTrip(trip, user?.id)
      showToast(`Invoice ${generated.invoiceNumber} generated for trip ${trip.id}!`)
      setShowAutoGenerateModal(false)
      setSelectedTripToInvoice('')
      setViewingInvoice(generated)
    } catch (err) {
      console.error('Error generating invoice:', err)
      showToast('Failed to generate invoice.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteInvoice(deletingInvoice.id)
      showToast(`Invoice ${deletingInvoice.invoiceNumber} removed successfully.`)
      setDeletingInvoice(null)
    } catch (err) {
      console.error('Error deleting invoice:', err)
      showToast('Failed to delete invoice.', 'error')
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

      {/* 1. Header & Primary Action */}
      <PageHeader
        title="Invoices & Billing"
        description="Manage billing, client invoices, payment collections, and payment history."
        badge={`${invoices.length} Invoices`}
        actionLabel={isAdmin ? 'Generate Invoice' : undefined}
        onAction={isAdmin ? () => setShowAutoGenerateModal(true) : undefined}
        actionIcon={Plus}
      />

      {/* 2. Billing Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Billed */}
        <button
          onClick={() => setStatusFilter('All')}
          className={`flex items-center gap-3 rounded-2xl border p-4 shadow-xs text-left transition-all cursor-pointer ${
            statusFilter === 'All' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-extrabold text-sm num">
            {stats.total}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Total Billed</p>
            <p className="text-xs sm:text-sm font-extrabold text-ink num">{formatINR(stats.totalPaidRevenue + stats.totalPendingReceivables)}</p>
          </div>
        </button>

        {/* Paid Revenue */}
        <button
          onClick={() => setStatusFilter('Paid')}
          className={`flex items-center gap-3 rounded-2xl border p-4 shadow-xs text-left transition-all cursor-pointer ${
            statusFilter === 'Paid' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-sm num">
            {stats.paidCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Paid Revenue</p>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-700 num">{formatINR(stats.totalPaidRevenue)}</p>
          </div>
        </button>

        {/* Pending Receivables */}
        <button
          onClick={() => setStatusFilter('Sent')}
          className={`flex items-center gap-3 rounded-2xl border p-4 shadow-xs text-left transition-all cursor-pointer ${
            statusFilter === 'Sent' || statusFilter === 'Partially Paid' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-extrabold text-sm num">
            {stats.pendingCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Outstanding</p>
            <p className="text-xs sm:text-sm font-extrabold text-amber-800 num">{formatINR(stats.totalPendingReceivables)}</p>
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => setStatusFilter('Overdue')}
          className={`flex items-center gap-3 rounded-2xl border p-4 shadow-xs text-left transition-all cursor-pointer ${
            statusFilter === 'Overdue' ? 'border-primary bg-primary-50' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-extrabold text-sm num">
            {stats.overdueCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Overdue</p>
            <p className="text-[11px] text-rose-700 font-bold">Action Needed</p>
          </div>
        </button>
      </div>

      {/* 3. Search, Filter & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Instant Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (NVX-000001), customer, trip ID..."
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
          {/* Mobile Filter Trigger Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeFilterCount > 0
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-line bg-surface text-ink hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary text-white h-4.5 w-4.5 flex items-center justify-center text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop Filter Selectors */}
          <div className="hidden lg:flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {INVOICE_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
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
            <option value="Highest Amount">Highest Amount</option>
            <option value="Lowest Amount">Lowest Amount</option>
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
                <h3 className="text-sm font-bold text-ink">Filter Invoices & Billing</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Payment Status */}
              <div>
                <label className="label-text">Billing Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Statuses</option>
                  {INVOICE_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Customer */}
              <div>
                <label className="label-text">Billed Customer</label>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="All">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
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

      {/* 4. Invoice List Section */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            search || activeFilterCount > 0
              ? 'No invoice matches your search or filter parameters.'
              : 'Auto-generate invoices from completed trips to start managing billing and receivables.'
          }
          actionLabel={isAdmin && !search && activeFilterCount === 0 ? 'Generate Invoice from Trip' : 'Clear Filters'}
          onAction={isAdmin && !search && activeFilterCount === 0 ? () => setShowAutoGenerateModal(true) : handleResetFilters}
          actionIcon={isAdmin && !search && activeFilterCount === 0 ? Plus : X}
        />
      ) : (
        <>
          {/* 🖥️ DESKTOP & TABLET TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Trip Reference</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Total Billed</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredInvoices.map((invoice) => {
                  const paid = Number(invoice.amountPaid || 0)
                  const remaining = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, invoice.totalAmount - paid))
                  const progressPct = invoice.totalAmount > 0 ? Math.min(100, Math.round((paid / invoice.totalAmount) * 100)) : 0

                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => setViewingInvoice(invoice)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Invoice Number */}
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold text-primary num">{invoice.invoiceNumber}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-ink">{invoice.customerName}</p>
                        <p className="text-[10px] text-ink-soft num">{invoice.customerPhone || 'No contact'}</p>
                      </td>

                      {/* Trip Ref */}
                      <td className="px-4 py-3.5 text-xs text-ink-soft num font-bold">
                        {invoice.tripId || 'Manual'}
                      </td>

                      {/* Invoice Date */}
                      <td className="px-4 py-3.5 text-ink-soft num font-medium">
                        {invoice.invoiceDate}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5 text-ink-soft num font-medium">
                        {invoice.dueDate}
                      </td>

                      {/* Total Billed */}
                      <td className="px-4 py-3.5 text-right font-extrabold num">
                        {formatINR(invoice.totalAmount)}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3.5 text-right text-emerald-700 font-bold num">
                        {formatINR(paid)}
                      </td>

                      {/* Balance Due */}
                      <td className="px-4 py-3.5 text-right text-rose-700 font-extrabold num">
                        {formatINR(remaining)}
                      </td>

                      {/* Status & Progress */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={invoice.paymentStatus} size="sm" />
                          <div className="flex items-center gap-1 text-[10px] text-ink-soft font-bold num">
                            <div className="h-1.5 w-8 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  progressPct === 100 ? 'bg-emerald-500' : progressPct > 0 ? 'bg-sky-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span>{progressPct}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingInvoice(invoice)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
                            title="View Invoice Details"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => printInvoice(invoice)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer"
                            title="Print / Export A4 Invoice PDF"
                          >
                            <Printer size={15} />
                          </button>

                          {isAdmin && invoice.paymentStatus !== 'Paid' && (
                            <button
                              onClick={() => setPaymentInvoice(invoice)}
                              className="rounded-lg bg-emerald-600 text-white border border-emerald-700 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                              title="Record Payment"
                            >
                              Collect
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => setDeletingInvoice(invoice)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Invoice"
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
            {filteredInvoices.map((invoice) => {
              const paid = Number(invoice.amountPaid || 0)
              const remaining = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, invoice.totalAmount - paid))

              return (
                <div
                  key={invoice.id}
                  onClick={() => setViewingInvoice(invoice)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Primary Row: Invoice # & Customer */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-primary num">{invoice.invoiceNumber}</h4>
                      <p className="text-xs text-ink font-bold">{invoice.customerName}</p>
                    </div>

                    <StatusBadge status={invoice.paymentStatus} size="sm" />
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="rounded-xl bg-bg p-3 border border-line/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-ink-soft">
                      <span>Trip Reference:</span>
                      <span className="font-bold text-ink num">{invoice.tripId || 'Manual'}</span>
                    </div>

                    <div className="flex items-center justify-between text-ink-soft">
                      <span>Invoice Date:</span>
                      <span className="font-medium text-ink num">{invoice.invoiceDate}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/50 text-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-ink-soft">Total</p>
                        <p className="font-extrabold text-ink num text-xs">{formatINR(invoice.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-700">Paid</p>
                        <p className="font-extrabold text-emerald-700 num text-xs">{formatINR(paid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-rose-700">Balance</p>
                        <p className="font-extrabold text-rose-700 num text-xs">{formatINR(remaining)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => printInvoice(invoice)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Printer size={13} /> Print PDF
                    </button>

                    <div className="flex items-center gap-2">
                      {isAdmin && invoice.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => setPaymentInvoice(invoice)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                          Collect Payment
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => setDeletingInvoice(invoice)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 5. Modals & Drawers */}

      {/* Auto-Generate Invoice Selection Modal */}
      {showAutoGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAutoGenerateModal(false) }}
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary font-bold">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-ink">Auto-Generate Invoice</h3>
                  <p className="text-xs text-ink-soft">Select a trip to create an instant billing invoice.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-ink block">Select Completed / Active Trip</label>
              <select
                value={selectedTripToInvoice}
                onChange={(e) => setSelectedTripToInvoice(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg p-3 text-xs font-semibold text-ink outline-none focus:border-primary cursor-pointer"
              >
                <option value="">— Select trip —</option>
                {completedTrips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.customer} ({t.pickupLocation} ➔ {t.destination}) — {formatINR(t.actualFare || t.fare)}
                  </option>
                ))}
              </select>
              {completedTrips.length === 0 && (
                <p className="text-xs text-amber-700 italic">No trips available for invoicing.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setShowAutoGenerateModal(false)}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={!selectedTripToInvoice || isGenerating}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Printable View Drawer Modal */}
      <InvoiceDetailModal
        invoice={viewingInvoice}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        onRecordPayment={(inv) => setPaymentInvoice(inv)}
        isAdmin={isAdmin}
        currentUser={user}
      />

      {/* Record Payment Modal */}
      <RecordInvoicePaymentModal
        invoice={paymentInvoice}
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Delete Confirmation Dialog */}
      {deletingInvoice && (
        <ConfirmDialog
          title={`Remove Invoice #${deletingInvoice.invoiceNumber}?`}
          body={`Are you sure you want to delete invoice "${deletingInvoice.invoiceNumber}" for customer "${deletingInvoice.customerName}"? This financial record will be permanently deleted.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Invoice'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingInvoice(null) }}
        />
      )}

    </div>
  )
}
