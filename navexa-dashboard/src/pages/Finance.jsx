import { useState, useEffect, useMemo } from 'react'
import {
  Wallet, TrendingDown, Scale, Plus, TrendingUp, CheckCircle2, Search,
  X, Filter, Calendar, FileText, Car, Route, AlertTriangle, ArrowRight,
  Download, Trash2, Eye, CreditCard, RotateCcw, ChevronDown, Fuel, Wrench, Receipt, UserCheck, Layers, FileSpreadsheet, Printer
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import RecordIncomeModal from '../components/finance/RecordIncomeModal'
import RecordExpenseModal from '../components/finance/RecordExpenseModal'
import RecordInvoicePaymentModal from '../components/invoices/RecordInvoicePaymentModal'
import InvoiceDetailModal from '../components/invoices/InvoiceDetailModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import {
  liveTransactions, subscribeTxn, subscribeSummary,
  filterAndSortTransactions, deleteTransaction, computeFilteredFinancialSummary,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS
} from '../data/transactionStore'
import { liveInvoices, subscribeInvoices } from '../data/invoiceStore'
import { liveTrips, subscribeTrips, formatINR } from '../data/tripStore'
import { liveVehicles } from '../data/vehicleStore'
import { useUser } from '../context/UserContext'
import EmptyState from '../components/ui/EmptyState'
import { QUICK_DATE_PRESETS, getDateRangeBounds, formatISODate } from '../utils/dateFilterUtils'

export default function FinancePage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store States
  const [transactions, setTransactions] = useState([...liveTransactions])
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [trips, setTrips] = useState([...liveTrips])

  // Tab State
  const [activeTab, setActiveTab] = useState('ledger') // 'ledger' | 'receivables'

  // Advanced Date Filter States
  const [selectedPreset, setSelectedPreset] = useState('This Month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('')
  const [appliedCustomTo, setAppliedCustomTo] = useState('')

  // Search & Type Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')

  // Mobile Filter Collapse Drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
    setTrips([...liveTrips])

    const unsubTxn = subscribeTxn(snap => setTransactions([...snap]))
    const unsubInv = subscribeInvoices(snap => setInvoices([...snap]))
    const unsubTrip = subscribeTrips(snap => setTrips([...snap]))

    return () => {
      unsubTxn()
      unsubInv()
      unsubTrip()
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Calculate exact date range bounds object based on selected preset & custom range
  const dateBounds = useMemo(() => {
    return getDateRangeBounds(selectedPreset, appliedCustomFrom, appliedCustomTo)
  }, [selectedPreset, appliedCustomFrom, appliedCustomTo])

  // Filtered Ledger Transactions (matching all filters & date bounds)
  const filteredTransactions = useMemo(() => {
    return filterAndSortTransactions(transactions, {
      search,
      type: typeFilter,
      category: categoryFilter,
      paymentMethod: methodFilter,
      vehicleId: vehicleFilter,
      startDate: dateBounds.startDate,
      endDate: dateBounds.endDate,
      sortBy,
    })
  }, [transactions, search, typeFilter, categoryFilter, methodFilter, vehicleFilter, dateBounds, sortBy])

  // Compute Comprehensive Filtered Summary Stats (Income, Expense, Profit, Receivables, Expense Breakdowns, Daily Averages)
  const summaryStats = useMemo(() => {
    return computeFilteredFinancialSummary(transactions, invoices, trips, dateBounds)
  }, [transactions, invoices, trips, dateBounds])

  // Receivables list (unpaid & partially paid invoices)
  const receivables = useMemo(() => {
    return invoices.filter(inv => inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled')
  }, [invoices])

  // Custom Range Apply & Reset Handlers
  const handleApplyCustomRange = () => {
    if (!customFrom && !customTo) return
    setSelectedPreset('Custom')
    setAppliedCustomFrom(customFrom)
    setAppliedCustomTo(customTo)
  }

  const handleResetFilters = () => {
    setSelectedPreset('This Month')
    setCustomFrom('')
    setCustomTo('')
    setAppliedCustomFrom('')
    setAppliedCustomTo('')
    setSearch('')
    setTypeFilter('All')
    setCategoryFilter('All')
    setMethodFilter('All')
    setVehicleFilter('All')
    setSortBy('Newest')
  }

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for selected range.', 'error')
      return
    }

    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Amount (INR)', 'Payment Method', 'Description', 'Reference', 'Vehicle ID', 'Vendor']
    const rows = filteredTransactions.map(t => [
      `"${t.id || ''}"`,
      `"${t.date || ''}"`,
      `"${t.type || ''}"`,
      `"${t.category || ''}"`,
      `"${t.amount || 0}"`,
      `"${t.paymentMethod || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.reference || t.invoiceId || t.tripId || ''}"`,
      `"${t.vehicleId || ''}"`,
      `"${(t.vendor || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Navexa_Finance_${selectedPreset.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('CSV export downloaded.')
  }

  // Export PDF Handler
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for selected range.', 'error')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = filteredTransactions.map(t => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${t.date}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: bold;">${t.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${t.category}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${t.paymentMethod}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold; color: ${t.type === 'Income' ? '#047857' : '#be123c'}">
          ${t.type === 'Income' ? '+' : '-'}₹${Number(t.amount).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Navexa Finance Statement — ${summaryStats.periodLabel}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
            .card-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .card-val { font-size: 15px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">NAVEXA 2.0</div>
              <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Financial Statement & Ledger Report</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <p style="font-weight: bold; color: #0f172a; margin: 0;">Period: ${summaryStats.periodLabel}</p>
              <p style="margin: 2px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="card">
              <div class="card-title">Total Income</div>
              <div class="card-val" style="color: #047857;">₹${summaryStats.totalIncome.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Expenses</div>
              <div class="card-val" style="color: #be123c;">₹${summaryStats.totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-title">Net Profit</div>
              <div class="card-val" style="color: #0f172a;">₹${summaryStats.netProfit.toLocaleString('en-IN')}</div>
            </div>
            <div class="card">
              <div class="card-title">Avg Daily Profit</div>
              <div class="card-val" style="color: #0284c7;">₹${summaryStats.avgDailyProfit.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">Transaction History (${filteredTransactions.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Method</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

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
    <div className="page-container space-y-6">
      
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Finance & Accounting Dashboard</h1>
          <p className="text-xs text-ink-soft mt-0.5">Advanced date filtering, revenue, expenses breakdown, cash flow, and statement export.</p>
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

      {/* ---------------------------------------------------------------------- */}
      {/* ADVANCED DATE FILTERS TOOLBAR */}
      {/* ---------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Date Filters & Accounting Range</h3>
              <p className="text-[11px] text-ink-soft">Select quick date presets or specify a custom range to update all financial metrics.</p>
            </div>
          </div>

          {/* Export & Reset Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset Filters to Default"
            >
              <RotateCcw size={13} /> Reset
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={13} className="text-emerald-700" /> CSV
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <Printer size={13} /> Statement (PDF)
            </button>
          </div>
        </div>

        {/* Quick Filter Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {QUICK_DATE_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setSelectedPreset(preset)
                if (preset !== 'Custom') {
                  setAppliedCustomFrom('')
                  setAppliedCustomTo('')
                }
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedPreset === preset
                  ? 'bg-primary text-white shadow-xs'
                  : 'border border-line bg-bg text-ink-soft hover:bg-slate-100 hover:text-ink'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Custom Date Range Picker inputs (always available or highlighted when Custom selected) */}
        <div className={`flex flex-col sm:flex-row sm:items-center gap-3 pt-2.5 border-t border-line/60 ${selectedPreset === 'Custom' ? 'bg-primary-50/40 p-3 rounded-xl border border-primary/20' : ''}`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-ink whitespace-nowrap">Custom Range:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-ink-soft font-bold uppercase">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink num outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-ink-soft font-bold uppercase">To</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink num outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyCustomRange}
              className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* ACCOUNTING PERIOD SUMMARY BAR (Selected Period, Days, Daily Averages) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-primary/20 bg-primary-50/40 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Selected Accounting Period</span>
            <h3 className="text-base font-extrabold text-ink">{summaryStats.periodLabel}</h3>
          </div>
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary border border-primary/20">
            {summaryStats.totalDays} Days Filtered
          </span>
        </div>

        {/* Daily Averages Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Avg Daily Income</p>
            <p className="text-sm sm:text-base font-extrabold text-emerald-900 num mt-0.5">{formatINR(summaryStats.avgDailyIncome)} / day</p>
          </div>

          <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3">
            <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Avg Daily Expense</p>
            <p className="text-sm sm:text-base font-extrabold text-rose-900 num mt-0.5">{formatINR(summaryStats.avgDailyExpense)} / day</p>
          </div>

          <div className={`rounded-xl border p-3 ${summaryStats.avgDailyProfit >= 0 ? 'border-primary/30 bg-primary-50/60' : 'border-rose-300 bg-rose-100/60'}`}>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Avg Daily Profit</p>
            <p className={`text-sm sm:text-base font-extrabold num mt-0.5 ${summaryStats.avgDailyProfit >= 0 ? 'text-primary' : 'text-rose-700'}`}>
              {formatINR(summaryStats.avgDailyProfit)} / day
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* PRIMARY FINANCIAL METRICS ROW */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={Wallet}
          title="Total Income"
          value={summaryStats.totalIncome}
          delta={0}
          direction="up"
          sentiment="positive"
        />
        <StatCard
          icon={TrendingDown}
          title="Total Expenses"
          value={summaryStats.totalExpenses}
          delta={0}
          direction="up"
          sentiment="warning"
        />
        <StatCard
          icon={Scale}
          title="Net Profit"
          value={summaryStats.netProfit}
          delta={0}
          direction={summaryStats.netProfit >= 0 ? 'up' : 'down'}
          sentiment={summaryStats.netProfit >= 0 ? 'positive' : 'negative'}
          highlighted
        />

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Outstanding Payments</p>
          <p className="text-lg font-extrabold text-amber-800 num mt-1">{formatINR(summaryStats.outstandingPayments)}</p>
          <p className="text-[10px] text-ink-soft font-semibold">{receivables.length} Unpaid Invoices</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Total Trips</p>
          <p className="text-lg font-extrabold text-ink num mt-1">{summaryStats.totalTrips}</p>
          <p className="text-[10px] text-ink-soft font-semibold">Bookings in range</p>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* EXPENSE CATEGORY BREAKDOWN CARDS */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">Expense Category Breakdown (Selected Range)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Fuel */}
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Fuel size={15} />
              </div>
              <p className="text-xs font-bold text-ink">Fuel Expenses</p>
            </div>
            <p className="text-base font-extrabold text-ink num">{formatINR(summaryStats.fuelExpenses)}</p>
          </div>

          {/* Toll */}
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Receipt size={15} />
              </div>
              <p className="text-xs font-bold text-ink">Toll Expenses</p>
            </div>
            <p className="text-base font-extrabold text-ink num">{formatINR(summaryStats.tollExpenses)}</p>
          </div>

          {/* Maintenance */}
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Wrench size={15} />
              </div>
              <p className="text-xs font-bold text-ink">Maintenance</p>
            </div>
            <p className="text-base font-extrabold text-ink num">{formatINR(summaryStats.maintenanceExpenses)}</p>
          </div>

          {/* Driver Payments */}
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <UserCheck size={15} />
              </div>
              <p className="text-xs font-bold text-ink">Driver Payments</p>
            </div>
            <p className="text-base font-extrabold text-ink num">{formatINR(summaryStats.driverExpenses)}</p>
          </div>

          {/* Other Expenses */}
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Layers size={15} />
              </div>
              <p className="text-xs font-bold text-ink">Other Expenses</p>
            </div>
            <p className="text-base font-extrabold text-ink num">{formatINR(summaryStats.otherExpenses)}</p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* CASH FLOW TREND CHART */}
      {/* ---------------------------------------------------------------------- */}
      <div className="w-full">
        <IncomeExpenseChart transactions={filteredTransactions} dateBounds={dateBounds} />
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

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: TRANSACTION LEDGER WITH MULTI-FIELD SEARCH & FILTERS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Search, Filters & Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
            {/* Multi-Field Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, invoice #, trip ID, vehicle, category, reference..."
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

              {/* Method Filter */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
                <CreditCard size={13} className="text-ink-soft" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="bg-transparent font-semibold text-ink outline-none cursor-pointer"
                >
                  <option value="All">All Methods</option>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
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

              {/* Sort By */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs">
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

          {/* DESKTOP TABLE VIEW */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No financial records found"
              description={`No transaction records match the selected date range (${summaryStats.periodLabel}) or search query.`}
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
