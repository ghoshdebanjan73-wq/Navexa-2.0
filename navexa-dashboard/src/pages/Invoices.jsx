import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Plus, Search, X, Filter, MoreHorizontal, Eye, Edit3, Trash2,
  CheckCircle, CreditCard, ArrowRight, Calendar, User, Route, IndianRupee,
  AlertTriangle, ShieldCheck
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

// Status badge styling helper
const STATUS_COLORS = {
  Draft:          'bg-slate-100 text-slate-700 border-slate-200',
  Sent:           'bg-sky-50 text-sky-700 border-sky-200',
  Paid:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-200',
  Overdue:        'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled:      'bg-slate-200 text-slate-600 border-slate-300',
}

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

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [deletingInvoice, setDeletingInvoice] = useState(null)
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false)
  const [selectedTripToInvoice, setSelectedTripToInvoice] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
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

      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-ink tracking-tight">Invoice Management</h2>
          <p className="text-xs text-ink-soft">Generate tax invoices from completed trips, record payments, and export PDF billing statements.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAutoGenerateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Generate Invoice from Trip</span>
          </button>
        )}
      </div>

      {/* Invoice Financial Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => setStatusFilter('All')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'All' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-extrabold text-sm">
            {stats.total}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Total Invoices</p>
            <p className="text-[11px] text-ink-soft num font-bold">{formatINR(stats.totalPaidRevenue + stats.totalPendingReceivables)}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Paid')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Paid' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-sm">
            {stats.paidCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Paid</p>
            <p className="text-[11px] text-emerald-700 num font-bold">{formatINR(stats.totalPaidRevenue)}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Sent')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Sent' || statusFilter === 'Partially Paid' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 font-extrabold text-sm">
            {stats.pendingCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Pending Receivables</p>
            <p className="text-[11px] text-amber-800 num font-bold">{formatINR(stats.totalPendingReceivables)}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('Overdue')}
          className={`rounded-2xl border p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all ${
            statusFilter === 'Overdue' ? 'border-primary bg-primary-50/60' : 'border-line bg-surface hover:bg-slate-50'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 font-extrabold text-sm">
            {stats.overdueCount}
          </div>
          <div>
            <p className="text-xs font-bold text-ink">Overdue</p>
            <p className="text-[11px] text-ink-soft">Requires follow up</p>
          </div>
        </div>
      </div>

      {/* Search, Filters & Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
        {/* Instant Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (NVX-000001), customer, trip ID..."
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <Filter size={13} className="text-ink-soft" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {INVOICE_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
            <User size={13} className="text-ink-soft" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="All">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
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
              <option value="Highest Amount">Highest Amount</option>
              <option value="Lowest Amount">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Views */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={
            search || statusFilter !== 'All'
              ? 'No invoice matches your search or filter criteria.'
              : 'Auto-generate invoices from completed trips to start managing billing and receivables.'
          }
          actionLabel={isAdmin && !search && statusFilter === 'All' ? 'Generate Invoice from Trip' : undefined}
          onAction={isAdmin && !search && statusFilter === 'All' ? () => setShowAutoGenerateModal(true) : undefined}
          actionIcon={Plus}
        />
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Trip Reference</th>
                  <th className="px-4 py-3">Invoice Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filteredInvoices.map((invoice) => {
                  const statusStyle = STATUS_COLORS[invoice.paymentStatus] || STATUS_COLORS.Draft

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

                      {/* Amount */}
                      <td className="px-4 py-3.5 text-right font-extrabold num">
                        {formatINR(invoice.totalAmount)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle}`}>
                          {invoice.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingInvoice(invoice)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
                            title="View Invoice & Print"
                          >
                            <Eye size={15} />
                          </button>

                          {isAdmin && invoice.paymentStatus !== 'Paid' && (
                            <button
                              onClick={() => setPaymentInvoice(invoice)}
                              className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              Pay
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

          {/* MOBILE CARD VIEW */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredInvoices.map((invoice) => {
              const statusStyle = STATUS_COLORS[invoice.paymentStatus] || STATUS_COLORS.Draft

              return (
                <div
                  key={invoice.id}
                  onClick={() => setViewingInvoice(invoice)}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-primary num">{invoice.invoiceNumber}</h4>
                      <p className="text-xs text-ink font-bold">{invoice.customerName}</p>
                    </div>

                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusStyle}`}>
                      {invoice.paymentStatus}
                    </span>
                  </div>

                  {/* Details Subbox */}
                  <div className="rounded-xl bg-bg p-3 border border-line/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Trip Reference:</span>
                      <span className="font-bold text-ink num">{invoice.tripId || 'Manual'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Invoice Date:</span>
                      <span className="font-medium text-ink num">{invoice.invoiceDate}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-line/40">
                      <span className="font-bold text-ink">Total Amount:</span>
                      <span className="font-extrabold text-primary text-sm num">{formatINR(invoice.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingInvoice(invoice)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Eye size={14} /> View & Print
                    </button>

                    <div className="flex items-center gap-2">
                      {isAdmin && invoice.paymentStatus !== 'Paid' && (
                        <button
                          onClick={() => setPaymentInvoice(invoice)}
                          className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                          Record Payment
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

      {/* MODALS */}

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
      />

      {/* Record Payment Modal */}
      <RecordInvoicePaymentModal
        invoice={paymentInvoice}
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Delete Confirmation */}
      {deletingInvoice && (
        <ConfirmDialog
          title="Delete Invoice?"
          body={`Are you sure you want to delete invoice "${deletingInvoice.invoiceNumber}"? This action cannot be undone.`}
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
