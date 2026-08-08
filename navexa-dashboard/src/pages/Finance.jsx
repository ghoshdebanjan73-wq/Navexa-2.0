import { useState, useEffect, useMemo } from 'react'
import {
  Wallet, TrendingDown, Scale, TrendingUp, CheckCircle2, Search,
  X, Filter, Calendar, Car, AlertTriangle, CreditCard, RotateCcw,
  Fuel, Wrench, Receipt, UserCheck, Layers, FileSpreadsheet, Printer,
  ChevronRight, Eye, Trash2, Hash, User, Building2, Route, ArrowDownUp,
  SlidersHorizontal, ChevronDown, ChevronUp, PieChart, ShieldAlert, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import RecordIncomeModal from '../components/finance/RecordIncomeModal'
import RecordExpenseModal from '../components/finance/RecordExpenseModal'
import RecordInvoicePaymentModal from '../components/invoices/RecordInvoicePaymentModal'
import InvoiceDetailModal from '../components/invoices/InvoiceDetailModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import TransactionDetailDrawer from '../components/finance/TransactionDetailDrawer'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import {
  liveTransactions, subscribeTxn, subscribeSummary,
  filterAndSortTransactions, deleteTransaction, computeFilteredFinancialSummary,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS
} from '../data/transactionStore'
import { liveInvoices, subscribeInvoices } from '../data/invoiceStore'
import { liveTrips, subscribeTrips, formatINR } from '../data/tripStore'
import { liveVehicles } from '../data/vehicleStore'
import { liveDrivers } from '../data/driverStore'
import { liveCustomers } from '../data/customerStore'
import { useUser } from '../context/UserContext'
import { logAuditEvent } from '../data/auditStore'
import { QUICK_DATE_PRESETS, getDateRangeBounds } from '../utils/dateFilterUtils'

// ─── Lookup map helper ────────────────────────────────────────────────────────
function buildMap(arr, key = 'id') {
  const m = {}
  arr.forEach(item => { if (item[key]) m[item[key]] = item })
  return m
}

// ─── Category Badge helper ──────────────────────────────────────────────────
function CategoryBadge({ category, type }) {
  const isIncome = type === 'Income'
  const fuelCats = ['Fuel', 'Petrol', 'Diesel', 'CNG', 'Fastag']
  const tollCats = ['Toll', 'Parking']
  const maintCats = ['Vehicle Service', 'Vehicle Repair', 'Maintenance', 'Tyres']
  const driverCats = ['Driver Payment', 'Driver Salary', 'Driver Allowance']

  let bg = 'bg-slate-100 text-slate-700 border-slate-200'
  if (isIncome) bg = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  else if (fuelCats.includes(category)) bg = 'bg-amber-50 text-amber-700 border-amber-200'
  else if (tollCats.includes(category)) bg = 'bg-sky-50 text-sky-700 border-sky-200'
  else if (maintCats.includes(category)) bg = 'bg-purple-50 text-purple-700 border-purple-200'
  else if (driverCats.includes(category)) bg = 'bg-indigo-50 text-indigo-700 border-indigo-200'
  else if (category === 'Insurance' || category === 'Tax') bg = 'bg-rose-50 text-rose-700 border-rose-200'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${bg}`}>
      {category}
    </span>
  )
}

export default function FinancePage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Data Store States
  const [transactions, setTransactions] = useState([...liveTransactions])
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [trips, setTrips] = useState([...liveTrips])

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('ledger')

  // Date Filter States
  const [selectedPreset, setSelectedPreset] = useState('This Month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('')
  const [appliedCustomTo, setAppliedCustomTo] = useState('')
  const [showDatePanel, setShowDatePanel] = useState(true)

  // Search & Filter States
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [driverFilter, setDriverFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Modals & Drawers
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [showRecordIncome, setShowRecordIncome] = useState(false)
  const [showRecordExpense, setShowRecordExpense] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deletingTxn, setDeletingTxn] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast Banner State
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

  // Lookup Maps
  const customerMap = useMemo(() => buildMap(liveCustomers), [])
  const vehicleMap = useMemo(() => buildMap(liveVehicles), [])
  const driverMap = useMemo(() => buildMap(liveDrivers), [])
  const tripMap = useMemo(() => buildMap(trips), [trips])
  const invoiceMap = useMemo(() => buildMap(invoices), [invoices])

  // Date Range Bounds
  const dateBounds = useMemo(() => {
    return getDateRangeBounds(selectedPreset, appliedCustomFrom, appliedCustomTo)
  }, [selectedPreset, appliedCustomFrom, appliedCustomTo])

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return filterAndSortTransactions(transactions, {
      search,
      type: typeFilter,
      category: categoryFilter,
      paymentMethod: methodFilter,
      vehicleId: vehicleFilter,
      driverId: driverFilter,
      startDate: dateBounds.startDate,
      endDate: dateBounds.endDate,
      sortBy,
      customerMap,
      vehicleMap,
      driverMap,
      tripMap,
      invoiceMap,
    })
  }, [transactions, search, typeFilter, categoryFilter, methodFilter, vehicleFilter, driverFilter, dateBounds, sortBy, customerMap, vehicleMap, driverMap, tripMap, invoiceMap])

  // Financial Period Summary
  const summaryStats = useMemo(() => {
    return computeFilteredFinancialSummary(transactions, invoices, trips, dateBounds)
  }, [transactions, invoices, trips, dateBounds])

  // Expense Category Breakdown Calculation
  const categoryBreakdown = useMemo(() => {
    const expenseTxns = filteredTransactions.filter(t => t.type === 'Expense')
    const totalExp = expenseTxns.reduce((sum, t) => sum + t.amount, 0)

    const catMap = {}
    expenseTxns.forEach(t => {
      const cat = t.category || 'Miscellaneous'
      catMap[cat] = (catMap[cat] || 0) + t.amount
    })

    return Object.entries(catMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filteredTransactions])

  // Outstanding Receivables
  const receivables = useMemo(() => {
    return invoices.filter(inv => inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled')
  }, [invoices])

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (typeFilter !== 'All') count++
    if (categoryFilter !== 'All') count++
    if (methodFilter !== 'All') count++
    if (vehicleFilter !== 'All') count++
    if (driverFilter !== 'All') count++
    return count
  }, [typeFilter, categoryFilter, methodFilter, vehicleFilter, driverFilter])

  // Date Range Controls
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
    setDriverFilter('All')
    setSortBy('Newest')
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for selected range.', 'error')
      return
    }
    const headers = ['Transaction ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount (INR)', 'Payment Method', 'Description', 'Customer Name', 'Trip ID', 'Invoice Number', 'Vehicle', 'Driver', 'Vendor', 'Vendor Phone', 'Bill/Reference No', 'Recorded By', 'Notes']
    const rows = filteredTransactions.map(t => [
      `"${t.id || ''}"`,
      `"${t.date || ''}"`,
      `"${t.time || ''}"`,
      `"${t.type || ''}"`,
      `"${t.category || ''}"`,
      `"${t.subcategory || ''}"`,
      `"${t.amount || 0}"`,
      `"${t.paymentMethod || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${customerMap[t.customerId]?.name || ''}"`,
      `"${t.tripId || ''}"`,
      `"${invoiceMap[t.invoiceId]?.invoiceNumber || t.invoiceId || ''}"`,
      `"${vehicleMap[t.vehicleId]?.name || t.vehicleId || ''}"`,
      `"${driverMap[t.driverId]?.name || t.driverId || ''}"`,
      `"${(t.vendor || '').replace(/"/g, '""')}"`,
      `"${t.vendorPhone || ''}"`,
      `"${t.billNumber || t.reference || ''}"`,
      `"${t.createdBy || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
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
    showToast(`Exported ${filteredTransactions.length} transaction records to CSV.`)
  }

  // Export PDF Statement
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for selected range.', 'error')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const rows = filteredTransactions.map(t => `
      <tr>
        <td>${t.date}${t.time ? '<br/><span style="color:#64748b;font-size:10px">' + t.time + '</span>' : ''}</td>
        <td><b>${t.description || '—'}</b><br/><span style="font-size:10px;color:#64748b">${t.category}${t.subcategory ? ' / ' + t.subcategory : ''}</span></td>
        <td>${customerMap[t.customerId]?.name || (t.invoiceId ? invoiceMap[t.invoiceId]?.customerName || '' : '') || '—'}</td>
        <td>${vehicleMap[t.vehicleId]?.name || t.vehicleId || '—'}</td>
        <td>${t.paymentMethod}<br/><span style="font-size:10px;color:#64748b">${t.billNumber || t.reference || ''}</span></td>
        <td style="text-align:right;font-weight:800;color:${t.type === 'Income' ? '#047857' : '#be123c'}">
          ${t.type === 'Income' ? '+' : '–'}₹${Number(t.amount).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html><html>
        <head>
          <title>Navexa Finance Statement — ${summaryStats.periodLabel}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; font-size: 12px; }
            .header { border-bottom: 2px solid #172554; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo { font-size: 20px; font-weight: 800; color: #172554; }
            .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
            .card-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
            .card-val { font-size: 14px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f1f5f9; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; }
            td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><div class="logo">NAVEXA 2.0</div><p style="margin:2px 0 0;color:#64748b;font-size:11px">Financial Statement Statement</p></div>
            <div style="text-align:right;font-size:11px;color:#64748b">
              <p style="font-weight:bold;color:#0f172a;margin:0">Period: ${summaryStats.periodLabel}</p>
              <p style="margin:2px 0 0">Generated: ${new Date().toLocaleString()}</p>
              <p style="margin:2px 0 0">Records: ${filteredTransactions.length}</p>
            </div>
          </div>
          <div class="grid">
            <div class="card"><div class="card-label">Total Revenue</div><div class="card-val" style="color:#047857">₹${summaryStats.totalIncome.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Total Expenses</div><div class="card-val" style="color:#be123c">₹${summaryStats.totalExpenses.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Net Result</div><div class="card-val" style="color:#172554">₹${summaryStats.netProfit.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Outstanding Receivables</div><div class="card-val" style="color:#b45309">₹${summaryStats.outstandingPayments.toLocaleString('en-IN')}</div></div>
          </div>
          <h3 style="font-size:12px;font-weight:bold;margin-bottom:6px">Transaction Activity (${filteredTransactions.length} records)</h3>
          <table>
            <thead><tr><th>Date / Time</th><th>Description / Category</th><th>Customer / Vendor</th><th>Vehicle</th><th>Payment Method</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Delete Transaction
  const handleDeleteConfirm = async () => {
    if (!deletingTxn || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteTransaction(deletingTxn.id)
      await logAuditEvent({
        action: 'DELETE',
        entityType: 'Finance',
        entityId: deletingTxn.id,
        entityLabel: deletingTxn.description || deletingTxn.id,
        description: `Transaction deleted: ${deletingTxn.type} of ₹${deletingTxn.amount} — ${deletingTxn.description}`,
        user,
      })
      showToast('Transaction entry removed from ledger.')
      setDeletingTxn(null)
      if (selectedTxn?.id === deletingTxn.id) setSelectedTxn(null)
    } catch (err) {
      console.error('Error deleting transaction:', err)
      showToast('Failed to delete transaction.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenDetail = (txn) => setSelectedTxn(txn)
  const handleRequestDelete = (txn) => setDeletingTxn(txn)

  // Enriched text getters
  const getCustomerName = (txn) => {
    if (customerMap[txn.customerId]?.name) return customerMap[txn.customerId].name
    if (txn.invoiceId && invoiceMap[txn.invoiceId]?.customerName) return invoiceMap[txn.invoiceId].customerName
    return null
  }
  const getVehicleName = (txn) => vehicleMap[txn.vehicleId]?.name || null
  const getDriverName = (txn) => driverMap[txn.driverId]?.name || null

  return (
    <div className="page-container space-y-5 lg:space-y-6">

      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed right-4 top-16 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-pop animate-slideDown ${
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* 1. Finance Header & Primary Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Finance & Accounting</h1>
          <p className="text-xs text-ink-soft mt-0.5">Financial command center, cash flow, expense breakdown, and transaction ledger.</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setShowRecordIncome(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <TrendingUp size={15} /> Record Income
            </button>
            <button
              onClick={() => setShowRecordExpense(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
            >
              <TrendingDown size={15} /> Record Expense
            </button>
          </div>
        )}
      </div>

      {/* 2. Unified Period Selector & Export Bar */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-bg">
          <button
            onClick={() => setShowDatePanel(v => !v)}
            className="flex items-center gap-2 text-xs font-extrabold text-ink cursor-pointer hover:text-primary transition-colors"
          >
            <Calendar size={15} className="text-primary" />
            <span className="uppercase tracking-wider">Accounting Period: {summaryStats.periodLabel}</span>
            {showDatePanel ? <ChevronUp size={14} className="text-ink-soft" /> : <ChevronDown size={14} className="text-ink-soft" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={13} className="text-emerald-700" /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <Printer size={13} /> Statement PDF
            </button>
          </div>
        </div>

        {showDatePanel && (
          <div className="p-4 space-y-3">
            {/* Preset Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
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
                      : 'border border-line bg-surface text-ink-soft hover:bg-slate-100 hover:text-ink'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Range Picker */}
            {selectedPreset === 'Custom' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2.5 border-t border-line/60 bg-primary-50/40 p-3 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-ink whitespace-nowrap">Custom Date Range:</span>
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
                <button
                  onClick={handleApplyCustomRange}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer"
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Primary Financial Summary Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={Wallet}
          title="Revenue / Income"
          value={summaryStats.totalIncome}
          infoText={summaryStats.periodLabel}
          direction="neutral"
          sentiment="positive"
        />
        <StatCard
          icon={TrendingDown}
          title="Expenses"
          value={summaryStats.totalExpenses}
          infoText={summaryStats.periodLabel}
          direction="neutral"
          sentiment="warning"
        />
        <StatCard
          icon={Scale}
          title="Net Result"
          value={summaryStats.netProfit}
          infoText={summaryStats.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
          direction={summaryStats.netProfit >= 0 ? 'up' : 'down'}
          sentiment={summaryStats.netProfit >= 0 ? 'positive' : 'negative'}
          highlighted
        />
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Outstanding</span>
          <p className="text-lg sm:text-xl font-extrabold text-amber-800 num mt-1">{formatINR(summaryStats.outstandingPayments)}</p>
          <p className="text-[10px] text-ink-soft font-semibold">{receivables.length} Unpaid Invoices</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Daily Net Avg</span>
          <p className={`text-lg sm:text-xl font-extrabold num mt-1 ${summaryStats.avgDailyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(summaryStats.avgDailyProfit)} / day
          </p>
          <p className="text-[10px] text-ink-soft font-semibold">{summaryStats.totalDays} Days in range</p>
        </div>
      </div>

      {/* 4. Cash Flow & Financial Trends Chart */}
      <div className="w-full">
        <IncomeExpenseChart transactions={filteredTransactions} dateBounds={dateBounds} />
      </div>

      {/* 5. Expense Category Breakdown Section */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-primary" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink">Expense Category Breakdown</h3>
          </div>
          <span className="text-xs font-bold text-ink-soft num">
            Total Expenses: <strong className="text-rose-700">{formatINR(summaryStats.totalExpenses)}</strong>
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-ink-soft italic py-2">No expense entries recorded for this period.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map(({ category, amount, percentage }) => (
              <div key={category} className="rounded-xl border border-line bg-bg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">{category}</span>
                  <span className="font-extrabold text-ink num">{formatINR(amount)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-ink-soft">
                  <span>Share of expenses</span>
                  <span className="font-bold text-primary num">{percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Transaction Ledger ({filteredTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'receivables' ? 'border-primary text-primary' : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          Outstanding Receivables ({receivables.length})
        </button>
      </div>

      {/* 7. TAB 1: TRANSACTION LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Search, Filter & Sort Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
            {/* Instant Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by customer, driver, vehicle, invoice #, trip ID, bill no, vendor..."
                className="w-full rounded-xl border border-line bg-bg pl-9.5 pr-8 py-2 text-xs sm:text-sm font-medium text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex items-center gap-2">
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

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-bold text-ink outline-none cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="Oldest">Oldest First</option>
                <option value="Highest Amount">Highest Amount</option>
                <option value="Lowest Amount">Lowest Amount</option>
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

          {/* 📱 Mobile Filter Sheet Modal */}
          {mobileFilterOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-xs animate-fadeIn"
              onClick={e => { if (e.target === e.currentTarget) setMobileFilterOpen(false) }}
            >
              <div className="w-full rounded-t-3xl border-t border-line bg-surface p-5 shadow-pop animate-slideUp space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-primary" />
                    <h3 className="text-sm font-bold text-ink">Filter Ledger Transactions</h3>
                  </div>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Transaction Type */}
                  <div>
                    <label className="label-text">Transaction Type</label>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-select">
                      <option value="All">All Types (Income & Expenses)</option>
                      <option value="Income">Income Only (+)</option>
                      <option value="Expense">Expenses Only (-)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="label-text">Category</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="form-select">
                      <option value="All">All Categories</option>
                      <optgroup label="— Expenses —">
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="— Income —">
                        {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="label-text">Payment Method</label>
                    <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="form-select">
                      <option value="All">All Payment Methods</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Vehicle */}
                  <div>
                    <label className="label-text">Vehicle</label>
                    <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="form-select">
                      <option value="All">All Vehicles</option>
                      {liveVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                  {/* Driver */}
                  <div>
                    <label className="label-text">Driver</label>
                    <select value={driverFilter} onChange={e => setDriverFilter(e.target.value)} className="form-select">
                      <option value="All">All Drivers</option>
                      {liveDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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

          {/* Ledger Table / Cards */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No financial transactions found"
              description={`No financial record matches the selected range (${summaryStats.periodLabel}) or search criteria.`}
              actionLabel="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              {/* DESKTOP ACCOUNTING TABLE VIEW */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="px-4 py-3 w-[100px]">Date</th>
                      <th className="px-4 py-3">Description & Category</th>
                      <th className="px-4 py-3">Customer / Vendor</th>
                      <th className="px-4 py-3">Vehicle / Driver</th>
                      <th className="px-4 py-3">Method & Ref</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium text-ink">
                    {filteredTransactions.map((txn) => {
                      const customerName = getCustomerName(txn)
                      const vehicleName = getVehicleName(txn)
                      const driverName = getDriverName(txn)
                      const invoice = invoiceMap[txn.invoiceId]
                      const isIncome = txn.type === 'Income'

                      return (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          onClick={() => handleOpenDetail(txn)}
                        >
                          {/* Date */}
                          <td className="px-4 py-3.5">
                            <p className="text-ink-soft num font-medium text-xs">{txn.date}</p>
                            {txn.time && <p className="text-[10px] text-ink-soft/70 num">{txn.time}</p>}
                          </td>

                          {/* Description & Category */}
                          <td className="px-4 py-3.5 max-w-[220px]">
                            <p className="font-bold text-ink text-xs leading-snug truncate">{txn.description || '—'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <CategoryBadge category={txn.category} type={txn.type} />
                              {txn.subcategory && (
                                <span className="text-[10px] text-ink-soft">/ {txn.subcategory}</span>
                              )}
                            </div>
                          </td>

                          {/* Customer / Vendor */}
                          <td className="px-4 py-3.5 max-w-[160px]">
                            {isIncome ? (
                              customerName ? (
                                <div>
                                  <div className="flex items-center gap-1">
                                    <User size={11} className="text-ink-soft shrink-0" />
                                    <p className="font-semibold text-ink text-xs truncate">{customerName}</p>
                                  </div>
                                  {invoice && (
                                    <p className="text-[10px] text-primary font-bold num mt-0.5">
                                      {invoice.invoiceNumber}
                                    </p>
                                  )}
                                  {txn.tripId && (
                                    <p className="text-[10px] text-ink-soft num">Trip: {txn.tripId}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-ink-soft text-[11px]">—</span>
                              )
                            ) : (
                              txn.vendor ? (
                                <div>
                                  <div className="flex items-center gap-1">
                                    <Building2 size={11} className="text-ink-soft shrink-0" />
                                    <p className="font-semibold text-ink text-xs truncate">{txn.vendor}</p>
                                  </div>
                                  {txn.vendorPhone && <p className="text-[10px] text-ink-soft num">{txn.vendorPhone}</p>}
                                </div>
                              ) : (
                                <span className="text-ink-soft text-[11px]">—</span>
                              )
                            )}
                          </td>

                          {/* Vehicle / Driver */}
                          <td className="px-4 py-3.5 max-w-[140px]">
                            {vehicleName ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <Car size={11} className="text-ink-soft shrink-0" />
                                  <p className="font-semibold text-ink text-xs truncate">{vehicleName}</p>
                                </div>
                                {driverName && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <UserCheck size={11} className="text-ink-soft/70 shrink-0" />
                                    <p className="text-[10px] text-ink-soft truncate">{driverName}</p>
                                  </div>
                                )}
                              </div>
                            ) : driverName ? (
                              <div className="flex items-center gap-1">
                                <UserCheck size={11} className="text-ink-soft shrink-0" />
                                <p className="font-semibold text-ink text-xs truncate">{driverName}</p>
                              </div>
                            ) : (
                              <span className="text-ink-soft text-[11px]">—</span>
                            )}
                          </td>

                          {/* Method & Ref */}
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-ink text-xs">{txn.paymentMethod}</p>
                            {(txn.billNumber || txn.reference) && (
                              <p className="text-[10px] text-ink-soft num mt-0.5 font-medium">{txn.billNumber || txn.reference}</p>
                            )}
                          </td>

                          {/* Amount with + for Income and - for Expense */}
                          <td className="px-4 py-3.5 text-right font-extrabold num">
                            <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                              {isIncome ? '+' : '–'}{formatINR(txn.amount)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenDetail(txn)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-primary-50 hover:text-primary transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleRequestDelete(txn)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete Transaction"
                                >
                                  <Trash2 size={14} />
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
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {filteredTransactions.map((txn) => {
                  const customerName = getCustomerName(txn)
                  const vehicleName = getVehicleName(txn)
                  const driverName = getDriverName(txn)
                  const isIncome = txn.type === 'Income'

                  return (
                    <div
                      key={txn.id}
                      onClick={() => handleOpenDetail(txn)}
                      className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.99]"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-ink text-sm leading-snug">{txn.description || '—'}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <CategoryBadge category={txn.category} type={txn.type} />
                            <span className="text-[10px] text-ink-soft num">{txn.date}{txn.time ? ` ${txn.time}` : ''}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-extrabold num ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isIncome ? '+' : '–'}{formatINR(txn.amount)}
                          </p>
                          <p className="text-[10px] text-ink-soft font-semibold mt-0.5">{txn.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Info Row */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-line/60 text-[11px] text-ink-soft">
                        {isIncome && customerName && (
                          <div className="flex items-center gap-1">
                            <User size={11} />
                            <span className="font-semibold text-ink">{customerName}</span>
                          </div>
                        )}
                        {!isIncome && txn.vendor && (
                          <div className="flex items-center gap-1">
                            <Building2 size={11} />
                            <span className="font-semibold text-ink">{txn.vendor}</span>
                          </div>
                        )}
                        {vehicleName && (
                          <div className="flex items-center gap-1">
                            <Car size={11} />
                            <span className="font-semibold text-ink">{vehicleName}</span>
                          </div>
                        )}
                        {driverName && (
                          <div className="flex items-center gap-1">
                            <UserCheck size={11} />
                            <span>{driverName}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-line/40" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-ink-soft num font-bold">{txn.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(txn)}
                            className="flex items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye size={12} /> Details
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleRequestDelete(txn)}
                              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete
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
        </div>
      )}

      {/* 8. TAB 2: OUTSTANDING RECEIVABLES */}
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
                    <th className="px-4 py-3">Invoice #</th>
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
                        <StatusBadge status={inv.paymentStatus} size="sm" />
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

      {/* Slide-over Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTxn}
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        onDelete={(txn) => {
          setSelectedTxn(null)
          setDeletingTxn(txn)
        }}
        isAdmin={isAdmin}
        customerMap={customerMap}
        vehicleMap={vehicleMap}
        driverMap={driverMap}
        tripMap={tripMap}
        invoiceMap={invoiceMap}
      />

      {/* Record Income Modal */}
      <RecordIncomeModal
        isOpen={showRecordIncome}
        onClose={() => setShowRecordIncome(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Record Expense Modal */}
      <RecordExpenseModal
        isOpen={showRecordExpense}
        onClose={() => setShowRecordExpense(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Record Invoice Payment Modal */}
      <RecordInvoicePaymentModal
        invoice={paymentInvoice}
        isOpen={Boolean(paymentInvoice)}
        onClose={() => setPaymentInvoice(null)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={viewingInvoice}
        isOpen={Boolean(viewingInvoice)}
        onClose={() => setViewingInvoice(null)}
        onRecordPayment={(inv) => setPaymentInvoice(inv)}
        isAdmin={isAdmin}
      />

      {/* Delete Transaction Confirmation Dialog */}
      {deletingTxn && (
        <ConfirmDialog
          title="Delete Transaction Record?"
          body={`Are you sure you want to delete transaction "${deletingTxn.description || deletingTxn.id}" (${formatINR(deletingTxn.amount)})? This will adjust period financial totals.`}
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
