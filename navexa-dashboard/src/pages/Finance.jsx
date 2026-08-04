import { useState, useEffect, useMemo } from 'react'
import {
  Wallet, TrendingDown, Scale, TrendingUp, CheckCircle2, Search,
  X, Filter, Calendar, Car, AlertTriangle, CreditCard, RotateCcw,
  Fuel, Wrench, Receipt, UserCheck, Layers, FileSpreadsheet, Printer,
  ChevronRight, Eye, Trash2, Hash, User, Building2, Route, ArrowDownUp,
  SlidersHorizontal, ChevronDown, ChevronUp
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import RecordIncomeModal from '../components/finance/RecordIncomeModal'
import RecordExpenseModal from '../components/finance/RecordExpenseModal'
import RecordInvoicePaymentModal from '../components/invoices/RecordInvoicePaymentModal'
import InvoiceDetailModal from '../components/invoices/InvoiceDetailModal'
import ConfirmDialog from '../components/trips/ConfirmDialog'
import TransactionDetailDrawer from '../components/finance/TransactionDetailDrawer'
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
import EmptyState from '../components/ui/EmptyState'
import { QUICK_DATE_PRESETS, getDateRangeBounds } from '../utils/dateFilterUtils'

// ─── Lookup map helpers ────────────────────────────────────────────────────────
function buildMap(arr, key = 'id') {
  const m = {}
  arr.forEach(item => { if (item[key]) m[item[key]] = item })
  return m
}

// ─── Category Icon helper ──────────────────────────────────────────────────────
function CategoryBadge({ category, type }) {
  const isIncome = type === 'Income'
  const fuelCats = ['Fuel', 'Petrol', 'Diesel', 'CNG', 'Fastag']
  const tollCats = ['Toll', 'Parking']
  const maintCats = ['Vehicle Service', 'Vehicle Repair', 'Maintenance', 'Tyres']
  const driverCats = ['Driver Payment', 'Driver Salary', 'Driver Allowance']

  let bg = 'bg-slate-100 text-slate-700'
  if (isIncome) bg = 'bg-emerald-50 text-emerald-700'
  else if (fuelCats.includes(category)) bg = 'bg-amber-50 text-amber-700'
  else if (tollCats.includes(category)) bg = 'bg-sky-50 text-sky-700'
  else if (maintCats.includes(category)) bg = 'bg-purple-50 text-purple-700'
  else if (driverCats.includes(category)) bg = 'bg-indigo-50 text-indigo-700'
  else if (category === 'Insurance' || category === 'Tax') bg = 'bg-rose-50 text-rose-700'
  else bg = 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${bg}`}>
      {category}
    </span>
  )
}

export default function FinancePage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // ─── Data Store States ───────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([...liveTransactions])
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [trips, setTrips] = useState([...liveTrips])

  // ─── Tab State ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('ledger')

  // ─── Advanced Date Filter States ─────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState('This Month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('')
  const [appliedCustomTo, setAppliedCustomTo] = useState('')
  const [showDatePanel, setShowDatePanel] = useState(true)

  // ─── Search & Ledger Filters ─────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [methodFilter, setMethodFilter] = useState('All')
  const [vehicleFilter, setVehicleFilter] = useState('All')
  const [driverFilter, setDriverFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [showFilters, setShowFilters] = useState(false)

  // ─── Drawer & Modal States ───────────────────────────────────────────────────
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [showRecordIncome, setShowRecordIncome] = useState(false)
  const [showRecordExpense, setShowRecordExpense] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState(null)
  const [viewingInvoice, setViewingInvoice] = useState(null)
  const [deletingTxn, setDeletingTxn] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ─── Toast ───────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)

  // ─── Subscribe to stores ─────────────────────────────────────────────────────
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

  // ─── Lookup Maps (memoized) ──────────────────────────────────────────────────
  const customerMap = useMemo(() => buildMap(liveCustomers), [])
  const vehicleMap = useMemo(() => buildMap(liveVehicles), [])
  const driverMap = useMemo(() => buildMap(liveDrivers), [])
  const tripMap = useMemo(() => buildMap(trips), [trips])
  const invoiceMap = useMemo(() => buildMap(invoices), [invoices])

  // ─── Date Range Bounds ───────────────────────────────────────────────────────
  const dateBounds = useMemo(() => {
    return getDateRangeBounds(selectedPreset, appliedCustomFrom, appliedCustomTo)
  }, [selectedPreset, appliedCustomFrom, appliedCustomTo])

  // ─── Filtered Ledger Transactions ────────────────────────────────────────────
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

  // ─── Period Financial Summary ─────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    return computeFilteredFinancialSummary(transactions, invoices, trips, dateBounds)
  }, [transactions, invoices, trips, dateBounds])

  // ─── Receivables list ────────────────────────────────────────────────────────
  const receivables = useMemo(() => {
    return invoices.filter(inv => inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled')
  }, [invoices])

  // ─── Custom Range Apply & Reset ──────────────────────────────────────────────
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

  // ─── Export CSV ───────────────────────────────────────────────────────────────
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
    link.setAttribute('download', `Navexa_Transactions_${selectedPreset.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('CSV exported successfully.')
  }

  // ─── Export Excel (CSV with BOM + .xlsx) ─────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export for selected range.', 'error')
      return
    }
    const headers = ['Transaction ID\tDate\tTime\tType\tCategory\tAmount\tPayment Method\tDescription\tCustomer\tTrip ID\tInvoice #\tVehicle\tDriver\tVendor\tBill No\tRecorded By\tNotes']
    const rows = filteredTransactions.map(t =>
      [t.id, t.date, t.time || '', t.type, t.category, t.amount, t.paymentMethod,
        t.description, customerMap[t.customerId]?.name || '', t.tripId || '',
        invoiceMap[t.invoiceId]?.invoiceNumber || t.invoiceId || '',
        vehicleMap[t.vehicleId]?.name || t.vehicleId || '',
        driverMap[t.driverId]?.name || t.driverId || '',
        t.vendor || '', t.billNumber || t.reference || '', t.createdBy || '', t.notes || ''
      ].join('\t')
    )
    const content = '\uFEFF' + [headers, ...rows].join('\n')
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Navexa_Transactions_${selectedPreset.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Excel export downloaded.')
  }

  // ─── Export PDF ───────────────────────────────────────────────────────────────
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
            <div><div class="logo">NAVEXA 2.0</div><p style="margin:2px 0 0;color:#64748b;font-size:11px">Professional Finance Statement</p></div>
            <div style="text-align:right;font-size:11px;color:#64748b">
              <p style="font-weight:bold;color:#0f172a;margin:0">Period: ${summaryStats.periodLabel}</p>
              <p style="margin:2px 0 0">Generated: ${new Date().toLocaleString()}</p>
              <p style="margin:2px 0 0">Transactions: ${filteredTransactions.length}</p>
            </div>
          </div>
          <div class="grid">
            <div class="card"><div class="card-label">Total Income</div><div class="card-val" style="color:#047857">₹${summaryStats.totalIncome.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Total Expenses</div><div class="card-val" style="color:#be123c">₹${summaryStats.totalExpenses.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Net Profit</div><div class="card-val" style="color:#172554">₹${summaryStats.netProfit.toLocaleString('en-IN')}</div></div>
            <div class="card"><div class="card-label">Avg Daily Profit</div><div class="card-val" style="color:#0284c7">₹${summaryStats.avgDailyProfit.toLocaleString('en-IN')}/day</div></div>
          </div>
          <h3 style="font-size:12px;font-weight:bold;margin-bottom:6px">Transaction History (${filteredTransactions.length} records)</h3>
          <table>
            <thead><tr><th>Date / Time</th><th>Description / Category</th><th>Customer</th><th>Vehicle</th><th>Payment Method / Ref</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // ─── Delete Transaction ───────────────────────────────────────────────────────
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

  // ─── Computed enriched data for display ──────────────────────────────────────
  const getCustomerName = (txn) => {
    if (customerMap[txn.customerId]?.name) return customerMap[txn.customerId].name
    if (txn.invoiceId && invoiceMap[txn.invoiceId]?.customerName) return invoiceMap[txn.invoiceId].customerName
    return null
  }
  const getVehicleName = (txn) => vehicleMap[txn.vehicleId]?.name || null
  const getDriverName = (txn) => driverMap[txn.driverId]?.name || null

  return (
    <div className="page-container space-y-6">

      {/* ─── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed right-6 top-16 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-pop animate-slideDown ${
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* ─── Page Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Finance & Accounting Dashboard</h1>
          <p className="text-xs text-ink-soft mt-0.5">Professional transaction ledger with advanced date filtering, export, and full record details.</p>
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

      {/* ─── ADVANCED DATE FILTERS TOOLBAR ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <button
            onClick={() => setShowDatePanel(v => !v)}
            className="flex items-center gap-2 text-xs font-extrabold text-ink cursor-pointer hover:text-primary transition-colors"
          >
            <Calendar size={15} className="text-primary" />
            <span className="uppercase tracking-wider">Date Filters & Accounting Range</span>
            {showDatePanel ? <ChevronUp size={14} className="text-ink-soft" /> : <ChevronDown size={14} className="text-ink-soft" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={handleExportExcel}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={13} className="text-emerald-700" /> Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={13} className="text-blue-700" /> CSV
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
            {/* Quick Preset Pills */}
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
                      : 'border border-line bg-bg text-ink-soft hover:bg-slate-100 hover:text-ink'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Date Range Inputs */}
            <div className={`flex flex-col sm:flex-row sm:items-center gap-3 pt-2.5 border-t border-line/60 ${selectedPreset === 'Custom' ? 'bg-primary-50/40 p-3 rounded-xl border border-primary/20 -mt-1' : ''}`}>
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
              <button
                onClick={handleApplyCustomRange}
                className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── ACCOUNTING PERIOD SUMMARY BAR ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-primary-50/40 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Selected Accounting Period</span>
            <h3 className="text-base font-extrabold text-ink">{summaryStats.periodLabel}</h3>
          </div>
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary border border-primary/20">
            {summaryStats.totalDays} Days
          </span>
        </div>
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

      {/* ─── PRIMARY FINANCIAL METRICS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Wallet} title="Total Income" value={summaryStats.totalIncome} delta={0} direction="up" sentiment="positive" />
        <StatCard icon={TrendingDown} title="Total Expenses" value={summaryStats.totalExpenses} delta={0} direction="up" sentiment="warning" />
        <StatCard icon={Scale} title="Net Profit" value={summaryStats.netProfit} delta={0} direction={summaryStats.netProfit >= 0 ? 'up' : 'down'} sentiment={summaryStats.netProfit >= 0 ? 'positive' : 'negative'} highlighted />
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Outstanding</p>
          <p className="text-lg font-extrabold text-amber-800 num mt-1">{formatINR(summaryStats.outstandingPayments)}</p>
          <p className="text-[10px] text-ink-soft font-semibold">{receivables.length} Unpaid</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Total Trips</p>
          <p className="text-lg font-extrabold text-ink num mt-1">{summaryStats.totalTrips}</p>
          <p className="text-[10px] text-ink-soft font-semibold">Bookings in range</p>
        </div>
      </div>

      {/* ─── EXPENSE CATEGORY BREAKDOWNS ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-ink-soft">Expense Breakdown (Selected Range)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: Fuel, label: 'Fuel Expenses', value: summaryStats.fuelExpenses, accent: 'bg-amber-50 text-amber-700' },
            { icon: Receipt, label: 'Toll Expenses', value: summaryStats.tollExpenses, accent: 'bg-sky-50 text-sky-700' },
            { icon: Wrench, label: 'Maintenance', value: summaryStats.maintenanceExpenses, accent: 'bg-purple-50 text-purple-700' },
            { icon: UserCheck, label: 'Driver Payments', value: summaryStats.driverExpenses, accent: 'bg-indigo-50 text-indigo-700' },
            { icon: Layers, label: 'Other Expenses', value: summaryStats.otherExpenses, accent: 'bg-slate-100 text-slate-700' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="rounded-2xl border border-line bg-surface p-3.5 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
                  <Icon size={15} />
                </div>
                <p className="text-xs font-bold text-ink">{label}</p>
              </div>
              <p className="text-base font-extrabold text-ink num">{formatINR(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CASH FLOW CHART ─────────────────────────────────────────────────────── */}
      <div className="w-full">
        <IncomeExpenseChart transactions={filteredTransactions} dateBounds={dateBounds} />
      </div>

      {/* ─── NAVIGATION TABS ─────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PROFESSIONAL TRANSACTION LEDGER                                      */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">

          {/* Search, Filters & Sort Controls */}
          <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
            {/* Search Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by customer, driver, vehicle, invoice #, trip ID, bill no, vendor, transaction ID..."
                  className="w-full rounded-xl border border-line bg-bg pl-9 pr-8 py-2 text-xs text-ink outline-none transition-all focus:bg-surface focus:border-primary"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  showFilters ? 'border-primary bg-primary-50 text-primary' : 'border-line bg-bg text-ink hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filters</span>
                {(typeFilter !== 'All' || categoryFilter !== 'All' || methodFilter !== 'All' || vehicleFilter !== 'All' || driverFilter !== 'All') && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                    {[typeFilter, categoryFilter, methodFilter, vehicleFilter, driverFilter].filter(f => f !== 'All').length}
                  </span>
                )}
              </button>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
              <div className="px-4 py-3 bg-bg border-b border-line">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type Filter */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <Filter size={12} className="text-ink-soft" />
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="All">All Types</option>
                      <option value="Income">Income Only</option>
                      <option value="Expense">Expense Only</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="All">All Categories</option>
                      <optgroup label="— Expenses —">
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                      <optgroup label="— Income —">
                        {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <CreditCard size={12} className="text-ink-soft" />
                    <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="All">All Methods</option>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Vehicle Filter */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <Car size={12} className="text-ink-soft" />
                    <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="All">All Vehicles</option>
                      {liveVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>

                  {/* Driver Filter */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <UserCheck size={12} className="text-ink-soft" />
                    <select value={driverFilter} onChange={e => setDriverFilter(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="All">All Drivers</option>
                      {liveDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <ArrowDownUp size={12} className="text-ink-soft" />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-transparent font-semibold text-ink outline-none cursor-pointer">
                      <option value="Newest">Newest First</option>
                      <option value="Oldest">Oldest First</option>
                      <option value="Highest Amount">Highest Amount</option>
                      <option value="Lowest Amount">Lowest Amount</option>
                      <option value="Customer Name">Customer Name</option>
                      <option value="Vehicle">Vehicle</option>
                    </select>
                  </div>

                  {/* Clear Filters shortcut */}
                  {(typeFilter !== 'All' || categoryFilter !== 'All' || methodFilter !== 'All' || vehicleFilter !== 'All' || driverFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setTypeFilter('All')
                        setCategoryFilter('All')
                        setMethodFilter('All')
                        setVehicleFilter('All')
                        setDriverFilter('All')
                      }}
                      className="flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <X size={12} /> Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results Count & Sort Info */}
          <div className="flex items-center justify-between px-0.5">
            <p className="text-xs text-ink-soft font-semibold">
              <span className="text-ink font-extrabold num">{filteredTransactions.length}</span> transactions{search ? ` matching "${search}"` : ''}
              {' '}in <span className="text-primary font-bold">{summaryStats.periodLabel}</span>
            </p>
            {filteredTransactions.length > 0 && (
              <p className="text-xs text-ink-soft">
                Sorted: <span className="font-bold text-ink">{sortBy}</span>
              </p>
            )}
          </div>

          {/* ─── DESKTOP PROFESSIONAL ACCOUNTING TABLE ─── */}
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No financial records found"
              description={`No transaction records match the selected date range (${summaryStats.periodLabel}) or search/filter criteria.`}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-bg text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="px-4 py-3 w-[100px]">Date</th>
                      <th className="px-4 py-3">Description & Category</th>
                      <th className="px-4 py-3">Customer / Vendor</th>
                      <th className="px-4 py-3">Vehicle / Driver</th>
                      <th className="px-4 py-3">Method / Ref</th>
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
                              ) : txn.invoiceId ? (
                                <p className="text-[10px] text-primary font-bold num">{txn.invoiceId}</p>
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

                          {/* Method / Reference */}
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-ink text-xs">{txn.paymentMethod}</p>
                            {(txn.billNumber || txn.reference) && (
                              <p className="text-[10px] text-ink-soft num mt-0.5 font-medium">{txn.billNumber || txn.reference}</p>
                            )}
                          </td>

                          {/* Amount */}
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

              {/* ─── TABLET / MOBILE CARD VIEW ─── */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {filteredTransactions.map((txn) => {
                  const customerName = getCustomerName(txn)
                  const vehicleName = getVehicleName(txn)
                  const driverName = getDriverName(txn)
                  const invoice = invoiceMap[txn.invoiceId]
                  const isIncome = txn.type === 'Income'

                  return (
                    <div
                      key={txn.id}
                      className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-3 cursor-pointer hover:border-primary/30 hover:shadow-card transition-all active:scale-[0.99]"
                      onClick={() => handleOpenDetail(txn)}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink text-sm leading-snug">{txn.description || '—'}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <CategoryBadge category={txn.category} type={txn.type} />
                            {txn.subcategory && <span className="text-[10px] text-ink-soft">/ {txn.subcategory}</span>}
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
                        {(txn.billNumber || txn.reference) && (
                          <div className="flex items-center gap-1">
                            <Hash size={11} />
                            <span className="num">{txn.billNumber || txn.reference}</span>
                          </div>
                        )}
                        {invoice && (
                          <div className="flex items-center gap-1">
                            <Receipt size={11} />
                            <span className="text-primary font-bold num">{invoice.invoiceNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-1" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-ink-soft num">{txn.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); handleOpenDetail(txn) }}
                            className="flex items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye size={12} /> Details
                          </button>
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); handleRequestDelete(txn) }}
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

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: OUTSTANDING RECEIVABLES                                               */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
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

      {/* ─── TRANSACTION DETAIL DRAWER ────────────────────────────────────────────── */}
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

      {/* ─── MODALS ───────────────────────────────────────────────────────────────── */}
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
