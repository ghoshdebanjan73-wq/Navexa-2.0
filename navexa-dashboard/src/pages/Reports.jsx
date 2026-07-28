import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3, Calendar, Download, Printer, Filter, X, TrendingUp, TrendingDown,
  Scale, Route, Users, CreditCard, Car, UserCheck, ArrowRight, Eye, CheckCircle2,
  PieChart, FileText, ChevronDown
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import ReportPrintModal from '../components/reports/ReportPrintModal'
import {
  DATE_RANGES, getFilteredReportData, computeBusinessOverview,
  computeFinancialPerformance, computeTripPerformance, computeCustomerPerformance,
  computeVehiclePerformance, computeExpenseBreakdown, computeDriverPerformance,
  exportToCSV
} from '../data/reportsStore'
import { formatINR } from '../data/tripStore'
import { subscribeTxn } from '../data/transactionStore'
import { subscribeTrips } from '../data/tripStore'
import { subscribeInvoices } from '../data/invoiceStore'
import { subscribeCustomers } from '../data/customerStore'
import { useUser } from '../context/UserContext'

export default function ReportsPage() {
  const { user } = useUser()
  const isAdmin = user?.role !== 'Staff'

  // Date Filter State
  const [dateRange, setDateRange] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Detail Modal Drawer State
  const [activeDetailModal, setActiveDetailModal] = useState(null) // 'revenue' | 'expenses' | 'trips' | 'receivables'
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)

  // Subscription refresh state
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const unsub1 = subscribeTxn(() => setRefreshTrigger(prev => prev + 1))
    const unsub2 = subscribeTrips(() => setRefreshTrigger(prev => prev + 1))
    const unsub3 = subscribeInvoices(() => setRefreshTrigger(prev => prev + 1))
    const unsub4 = subscribeCustomers(() => setRefreshTrigger(prev => prev + 1))
    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
    }
  }, [])

  // Filtered Raw Data
  const filtered = useMemo(() => {
    return getFilteredReportData({ dateRange, customStart, customEnd })
  }, [dateRange, customStart, customEnd, refreshTrigger])

  // Derived Analytics Reports
  const overview = useMemo(() => computeBusinessOverview(filtered), [filtered])
  const financial = useMemo(() => computeFinancialPerformance(filtered), [filtered])
  const tripPerf = useMemo(() => computeTripPerformance(filtered), [filtered])
  const customerPerf = useMemo(() => computeCustomerPerformance(filtered), [filtered])
  const vehiclePerf = useMemo(() => computeVehiclePerformance(filtered), [filtered])
  const expenseBreakdown = useMemo(() => computeExpenseBreakdown(filtered), [filtered])
  const driverPerf = useMemo(() => computeDriverPerformance(filtered), [filtered])

  const dateLabel = dateRange === 'Custom Range' && customStart && customEnd
    ? `${customStart} to ${customEnd}`
    : dateRange

  return (
    <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 space-y-6">
      
      {/* Top Header & Global Date Range Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Reports & Business Analytics</h1>
          <p className="text-xs text-ink-soft mt-0.5">Track business performance, fleet profitability, and financial activity for Navexa.</p>
        </div>

        {/* Controls: Date Range & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink shadow-xs">
            <Calendar size={15} className="text-primary" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent font-bold text-ink outline-none cursor-pointer"
            >
              {DATE_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Pickers */}
          {dateRange === 'Custom Range' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 font-bold text-ink num"
              />
              <span className="text-ink-soft font-bold">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-line bg-surface px-3 py-1.5 font-bold text-ink num"
              />
            </div>
          )}

          {/* Export CSV Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <Download size={15} /> Export CSV <ChevronDown size={13} />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-pop text-xs font-medium space-y-1 animate-scaleUp">
                <button
                  onClick={() => { exportToCSV('Financial_Transactions', filtered.transactions, dateLabel); setExportDropdownOpen(false) }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Financial Transactions CSV
                </button>
                <button
                  onClick={() => { exportToCSV('Trips', filtered.trips, dateLabel); setExportDropdownOpen(false) }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Trips Performance CSV
                </button>
                <button
                  onClick={() => { exportToCSV('Customers', customerPerf.topCustomers, dateLabel); setExportDropdownOpen(false) }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Customers Report CSV
                </button>
                <button
                  onClick={() => { exportToCSV('Vehicle_Performance', vehiclePerf, dateLabel); setExportDropdownOpen(false) }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Vehicle Performance CSV
                </button>
                <button
                  onClick={() => { exportToCSV('Outstanding_Payments', filtered.invoices.filter(i => i.paymentStatus !== 'Paid'), dateLabel); setExportDropdownOpen(false) }}
                  className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Outstanding Receivables CSV
                </button>
              </div>
            )}
          </div>

          {/* Print PDF Report Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
          >
            <Printer size={15} /> Print PDF Summary
          </button>
        </div>
      </div>

      {/* SECTION 1: BUSINESS OVERVIEW SUMMARY */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            Business Overview — ({dateLabel})
          </h3>
          <span className="text-[10px] text-ink-soft italic">Click any metric card to inspect detail records</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div onClick={() => setActiveDetailModal('revenue')} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <StatCard icon={TrendingUp} title="Total Revenue" value={overview.totalRevenue} sentiment="positive" />
          </div>

          <div onClick={() => setActiveDetailModal('expenses')} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <StatCard icon={TrendingDown} title="Total Expenses" value={overview.totalExpenses} sentiment="warning" />
          </div>

          <div className="cursor-pointer">
            <StatCard icon={Scale} title="Net Profit" value={overview.netProfit} highlighted sentiment={overview.netProfit >= 0 ? 'positive' : 'negative'} />
          </div>

          <div onClick={() => setActiveDetailModal('trips')} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <StatCard icon={Route} title="Completed Trips" value={overview.completedTrips} format="plain" sentiment="info" />
          </div>

          <div onClick={() => setActiveDetailModal('receivables')} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <StatCard icon={CreditCard} title="Receivables" value={overview.outstandingReceivables} sentiment="warning" />
          </div>

          <div>
            <StatCard icon={Users} title="Total Customers" value={overview.totalCustomers} format="plain" sentiment="neutral" />
          </div>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL PERFORMANCE & VEHICLE COMPARISON (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Financial Performance Breakdown */}
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Financial Performance</h3>
              <p className="text-xs text-ink-soft">Revenue vs Expenses over time</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800">
              Net Profit: {formatINR(overview.netProfit)}
            </span>
          </div>

          {financial.trend.length === 0 ? (
            <p className="text-xs text-ink-soft italic py-8 text-center">No financial activity for this selected period.</p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {financial.trend.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-bg p-3 border border-line text-xs">
                    <span className="font-bold text-ink num">{f.period}</span>
                    <div className="flex items-center gap-4 text-right num">
                      <span className="text-emerald-700 font-bold">+{formatINR(f.income)}</span>
                      <span className="text-rose-700 font-bold">-{formatINR(f.expenses)}</span>
                      <span className={`font-extrabold ${f.profit >= 0 ? 'text-primary' : 'text-rose-700'}`}>{formatINR(f.profit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fleet Vehicle Performance (2-Car Micro Fleet Comparison) */}
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Vehicle Fleet Performance</h3>
              <p className="text-xs text-ink-soft">Comparative revenue & expense attribution (2 Cars)</p>
            </div>
            <Car size={18} className="text-primary" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {vehiclePerf.map(veh => (
              <div key={veh.id} className="rounded-xl border border-line bg-bg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-ink">{veh.name}</h4>
                    <p className="text-[10px] text-ink-soft num font-semibold">{veh.registration}</p>
                  </div>
                  <span className="rounded-full bg-surface border border-line px-2 py-0.5 text-[10px] font-bold text-ink">
                    {veh.completedTrips} Trips
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">Trip Revenue:</span>
                    <span className="font-bold text-emerald-700 num">{formatINR(veh.tripRevenue)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ink-soft">Vehicle Expenses:</span>
                    <span className="font-bold text-rose-700 num">{formatINR(veh.recordedExpenses)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-line/50 font-extrabold text-ink">
                    <span>Net Contribution:</span>
                    <span className={`num ${veh.estimatedProfit >= 0 ? 'text-primary' : 'text-rose-700'}`}>{formatINR(veh.estimatedProfit)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 3: TOP CUSTOMERS & EXPENSE BREAKDOWN (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Top Customers Performance */}
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Top Customer Performance</h3>
              <p className="text-xs text-ink-soft">Highest revenue generating clients</p>
            </div>
            <Users size={18} className="text-primary" />
          </div>

          {customerPerf.topCustomers.length === 0 ? (
            <p className="text-xs text-ink-soft italic py-6 text-center">No customer activity recorded for this period.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                  <tr>
                    <th className="px-3.5 py-2.5">Customer Name</th>
                    <th className="px-3.5 py-2.5 text-center">Completed Trips</th>
                    <th className="px-3.5 py-2.5 text-right">Total Revenue</th>
                    <th className="px-3.5 py-2.5 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-ink">
                  {customerPerf.topCustomers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-3.5 py-2.5 font-bold">{c.name}</td>
                      <td className="px-3.5 py-2.5 text-center num">{c.completedTrips}</td>
                      <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold num">{formatINR(c.revenue)}</td>
                      <td className="px-3.5 py-2.5 text-right text-rose-700 font-bold num">{formatINR(c.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Category Breakdown */}
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Expense Category Breakdown</h3>
              <p className="text-xs text-ink-soft">Operational expense distribution</p>
            </div>
            <PieChart size={18} className="text-primary" />
          </div>

          {expenseBreakdown.breakdown.length === 0 ? (
            <p className="text-xs text-ink-soft italic py-6 text-center">No expenses recorded for this period.</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {expenseBreakdown.breakdown.map((item, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span>{item.category} ({item.percentage}%)</span>
                    <span className="num text-rose-700">{formatINR(item.amount)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 4: OUTSTANDING RECEIVABLES LEDGER */}
      <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-ink">Outstanding Receivables ({filtered.invoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled').length})</h3>
            <p className="text-xs text-ink-soft">Unpaid and overdue invoices requiring follow up</p>
          </div>
          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800">
            Total Due: {formatINR(overview.outstandingReceivables)}
          </span>
        </div>

        {filtered.invoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled').length === 0 ? (
          <p className="text-xs text-ink-soft italic py-4 text-center">No outstanding receivables for this period.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {filtered.invoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled').map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-extrabold text-primary num">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-bold text-ink">{inv.customerName}</td>
                    <td className="px-4 py-3 text-ink-soft num">{inv.dueDate}</td>
                    <td className="px-4 py-3 text-right font-bold num">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-bold num">{formatINR(inv.amountPaid)}</td>
                    <td className="px-4 py-3 text-right text-rose-700 font-extrabold num">{formatINR(inv.balanceDue)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                        inv.paymentStatus === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INTERACTIVE DETAIL TABLE DRAWER MODAL */}
      {activeDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveDetailModal(null) }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-extrabold text-ink capitalize">
                Underlying Records — {activeDetailModal} ({dateLabel})
              </h3>
              <button
                onClick={() => setActiveDetailModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Description</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-ink">
                  {(activeDetailModal === 'revenue'
                    ? filtered.transactions.filter(t => t.type === 'Income')
                    : activeDetailModal === 'expenses'
                    ? filtered.transactions.filter(t => t.type === 'Expense')
                    : filtered.transactions
                  ).map(t => (
                    <tr key={t.id}>
                      <td className="px-3.5 py-2 text-ink-soft num">{t.date}</td>
                      <td className="px-3.5 py-2 font-bold">{t.description}</td>
                      <td className="px-3.5 py-2">{t.category}</td>
                      <td className={`px-3.5 py-2 text-right font-extrabold num ${t.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatINR(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE PDF REPORT MODAL */}
      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        overview={overview}
        vehicles={vehiclePerf}
        receivables={filtered.invoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled')}
        dateRangeLabel={dateLabel}
      />

    </div>
  )
}
