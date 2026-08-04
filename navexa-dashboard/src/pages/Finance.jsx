import { useState, useEffect, useMemo } from 'react'
import {
  Wallet, TrendingDown, Scale, Plus, TrendingUp, CheckCircle2, Search,
  X, Filter, Calendar, FileText, Car, Route, AlertTriangle, ArrowRight,
  Download, Trash2, Eye, CreditCard
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import RecordIncomeModal from '../components/finance/RecordIncomeModal'
import RecordExpenseModal from '../components/finance/RecordExpenseModal'
import RecordInvoicePaymentModal from '../components/invoices/RecordInvoicePaymentModal'
import InvoiceDetailModal from '../components/invoices/InvoiceDetailModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import {
  liveTransactions, subscribeTxn, subscribeSummary, computeSummary,
  filterAndSortTransactions, deleteTransaction, EXPENSE_CATEGORIES,
  INCOME_CATEGORIES, PAYMENT_METHODS
} from '../data/transactionStore'
import { liveInvoices, subscribeInvoices } from '../data/invoiceStore'
import { liveVehicles } from '../data/vehicleStore'
import { formatINR } from '../data/tripStore'
import { useUser } from '../context/UserContext'
import EmptyState from '../components/ui/EmptyState'

export default function FinancePage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store States
  const [transactions, setTransactions] = useState([...liveTransactions])
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [summary, setSummary] = useState(computeSummary())

  // Tab State
  const [activeTab, setActiveTab] = useState('ledger') // 'ledger' | 'receivables'

  // Filters & Search
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [dateRange, setDateRange] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Modals
  const [showRecordIncome, setShowRecordIncome] = useState(false)
  const [showRecordExpense, setShowRecordExpense] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deletingTxn, setDeletingTxn] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setTransactions([...liveTransactions])
    setInvoices([...liveInvoices])
    setSummary(computeSummary())

    const unsubTxn = subscribeTxn(snap => setTransactions([...snap]))
    const unsubSum = subscribeSummary(snap => setSummary(snap))
    const unsubInv = subscribeInvoices(snap => setInvoices([...snap]))

    return () => {
      unsubTxn()
      unsubSum()
      unsubInv()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Filtered Ledger Transactions
  const filteredTransactions = useMemo(() => {
    return filterAndSortTransactions(transactions, {
      search,
      type: typeFilter,
      category: categoryFilter,
      paymentMethod: methodFilter,
      vehicleId: vehicleFilter,
      dateRange,
      sortBy,
    })
  }, [transactions, search, typeFilter, categoryFilter, methodFilter, vehicleFilter, dateRange, sortBy])

  // Receivables list (unpaid & partially paid invoices)
  const receivables = useMemo(() => {
    return invoices.filter(inv => inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled')
  }, [invoices])

  const handleDeleteConfirm = async () => {
    if (!deletingTxn || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteTransaction(deletingTxn.id)
      showToast('Transaction entry removed.')
      setDeletingTxn(null)
    } catch (err) {
      console.error('Error deleting transaction:', err)
      showToast('Failed to delete transaction.', 'error')
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
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header & Action Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Finance & Expense Management</h1>
          <p className="text-xs text-ink-soft mt-0.5">Real-time revenue, operational expenses, receivables, and profit analysis.</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowRecordIncome(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <TrendingUp size={15} /> Record Income
            </button>
            <button
              onClick={() => setShowRecordExpense(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
            >
              <TrendingDown size={15} /> Record Expense
            </button>
          </div>
        )}
      </div>

      {/* 6 Real-Time Financial Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Wallet} title="Total Income" {...summary.income} />
        <StatCard icon={TrendingDown} title="Total Expenses" {...summary.expenses} />
        <StatCard icon={Scale} title="Net Profit" {...summary.balance} highlighted />
        
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Receivables</p>
          <p className="text-lg font-extrabold text-amber-800 num mt-1">{formatINR(summary.pendingInvoiceAmount)}</p>
          <p className="text-[10px] text-ink-soft font-semibold">{receivables.length} Unpaid Invoices</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Paid Invoices</p>
          <p className="text-lg font-extrabold text-emerald-800 num mt-1">{formatINR(summary.paidInvoiceRevenue)}</p>
          <p className="text-[10px] text-ink-soft font-semibold">Cleared Revenue</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">This Month Profit</p>
          <p className={`text-lg font-extrabold num mt-1 ${summary.thisMonthProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(summary.thisMonthProfit)}
          </p>
          <p className="text-[10px] text-ink-soft font-semibold">Current Month</p>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="w-full">
        <IncomeExpenseChart />
      </div>

      {/* Navigation Tabs (Ledger vs Receivables) */}
      <div className="flex items-center gap-2 border-b border-line pb-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Transaction Ledger ({filteredTransactions.length})
        </button>

        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'receivables'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Outstanding Receivables ({receivables.length})
        </button>
      </div>

      {/* TAB 1: TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Search, Filters & Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions by description, vendor, invoice, trip, vehicle..."
                className="w-full rounded-xl border border-line bg-bg pl-9 pr-8 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
                <Filter size={13} className="text-ink-soft" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <optgroup label="Expenses">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Income">
                    {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Vehicle Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
                <Car size={13} className="text-ink-soft" />
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
                >
                  <option value="All">All Vehicles</option>
                  {liveVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
                <Calendar size={13} className="text-ink-soft" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
                >
                  <option value="All">All Time</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="3M">Last 3 Months</option>
                  <option value="6M">Last 6 Months</option>
                  <option value="1Y">Last 1 Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions found"
              description="No financial transaction matches your search or filter criteria."
            />
          ) : (
            <>
              <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description / Category</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Reference / Trip / Vehicle</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium text-ink">
                    {filteredTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-ink-soft num font-medium">
                          {txn.date}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-ink">{txn.description}</p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-700">
                            {txn.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-ink font-semibold">
                          {txn.paymentMethod}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-ink-soft">
                          {txn.reference && <p className="num font-bold text-ink">Ref: {txn.reference}</p>}
                          {txn.tripId && <p className="num">Trip: {txn.tripId}</p>}
                          {txn.invoiceId && <p className="num text-primary font-bold">Invoice: {txn.invoiceId}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold num">
                          <span className={txn.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}>
                            {txn.type === 'Income' ? '+' : '-'}{formatINR(txn.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isAdmin && (
                            <button
                              onClick={() => setDeletingTxn(txn)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer ml-auto"
                              title="Delete Transaction"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredTransactions.map((txn) => (
                  <div key={txn.id} className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-ink">{txn.description}</p>
                        <p className="text-[10px] text-ink-soft num">{txn.date} • {txn.category}</p>
                      </div>
                      <p className={`text-sm font-extrabold num ${txn.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {txn.type === 'Income' ? '+' : '-'}{formatINR(txn.amount)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft border-t border-line/60 pt-2">
                      <span>Method: <strong className="text-ink">{txn.paymentMethod}</strong></span>
                      {isAdmin && (
                        <button onClick={() => setDeletingTxn(txn)} className="text-rose-600 font-bold hover:underline cursor-pointer">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: OUTSTANDING RECEIVABLES */}
      {activeTab === 'receivables' && (
        <div className="space-y-4">
          {receivables.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-12 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-900">All invoices cleared!</h3>
              <p className="text-xs text-emerald-700 max-w-sm">No outstanding receivables or unpaid client invoices.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-4 py-3">Invoice Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Invoice Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-ink">
                  {receivables.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-primary num">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5 font-bold text-ink">{inv.customerName}</td>
                      <td className="px-4 py-3.5 text-ink-soft num">{inv.dueDate}</td>
                      <td className="px-4 py-3.5 text-right font-bold num">{formatINR(inv.totalAmount)}</td>
                      <td className="px-4 py-3.5 text-right text-emerald-700 font-bold num">{formatINR(inv.amountPaid)}</td>
                      <td className="px-4 py-3.5 text-right text-rose-700 font-extrabold num">{formatINR(inv.balanceDue)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.paymentStatus === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isAdmin && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <RecordIncomeModal
        isOpen={showRecordIncome}
        onClose={() => setShowRecordIncome(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      <RecordExpenseModal
        isOpen={showRecordExpense}
        onClose={() => setShowRecordExpense(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      <RecordInvoicePaymentModal
        invoice={paymentInvoice}
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      <InvoiceDetailModal
        invoice={viewingInvoice}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        onRecordPayment={(inv) => setPaymentInvoice(inv)}
        isAdmin={isAdmin}
      />

      {deletingTxn && (
        <ConfirmDialog
          title="Delete Transaction?"
          body={`Are you sure you want to delete "${deletingTxn.description}" (₹${deletingTxn.amount})? This will update financial totals.`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Entry'}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!isDeleting) setDeletingTxn(null) }}
        />
      )}

    </div>
  )
}
