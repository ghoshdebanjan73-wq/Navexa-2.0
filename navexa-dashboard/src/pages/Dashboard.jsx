import { useState, useEffect } from 'react'
import { Wallet, TrendingDown, Scale, Route, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import WelcomeSection from '../components/dashboard/WelcomeSection'
import AttentionAlerts from '../components/dashboard/AttentionAlerts'
import QuickActions from '../components/dashboard/QuickActions'
import QuickActionModal from '../components/ui/QuickActionModal'
import UpcomingTrips from '../components/dashboard/UpcomingTrips'
import RecentActivity from '../components/dashboard/RecentActivity'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import TransactionsTable from '../components/dashboard/TransactionsTable'
import VehicleOverview from '../components/dashboard/VehicleOverview'
import CustomersOverview from '../components/dashboard/CustomersOverview'
import StaffDashboard from '../components/dashboard/StaffDashboard'
import { useUser } from '../context/UserContext'
import { computeSummary, subscribeSummary } from '../data/transactionStore'
import { subscribeTrips, getTripCounts } from '../data/tripStore'
import { getInvoiceStats, subscribeInvoices } from '../data/invoiceStore'
import { formatINR } from '../data/tripStore'

/**
 * NAVEXA DASHBOARD — PREMIUM BUSINESS COMMAND CENTER
 * Information Hierarchy:
 * LEVEL 1 — What requires attention now (Overdue invoices, pending trip assignments, fleet alerts)
 * LEVEL 2 — Business & Financial KPI Overview
 * LEVEL 3 — Quick Actions (Add Trip, Record Income, Record Expense, Add Customer, Create Invoice)
 * LEVEL 4 — Today's / Upcoming Operations + Recent Activity Timeline
 * LEVEL 5 — Financial Cash Flow Trends, Transactions Table & Fleet/Customer Snapshots
 */
export default function Dashboard({ onNavigate }) {
  const [modalType, setModalType] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [summary, setSummary] = useState(computeSummary())
  const [upcomingCount, setUpcomingCount] = useState(getTripCounts().upcoming)
  const [invoiceStats, setInvoiceStats] = useState(getInvoiceStats())
  const { currentUser } = useUser()

  useEffect(() => {
    const unsubSummary = subscribeSummary(setSummary)
    const unsubTrips = subscribeTrips(() => {
      setUpcomingCount(getTripCounts().upcoming)
    })
    const unsubInvoices = subscribeInvoices(() => {
      setInvoiceStats(getInvoiceStats())
    })
    return () => {
      unsubSummary()
      unsubTrips()
      unsubInvoices()
    }
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleGoToTrips = () => {
    if (onNavigate) onNavigate('Trips')
  }

  const handleGoToInvoices = () => {
    if (onNavigate) onNavigate('Invoices')
  }

  // Render dedicated staff dashboard if role is Staff
  if (currentUser?.role === 'Staff') {
    return <StaffDashboard onNavigate={onNavigate} />
  }

  return (
    <div className="page-container relative space-y-5 lg:space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 shadow-lg animate-slideDown">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD HEADER */}
      <WelcomeSection />

      {/* LEVEL 1 — WHAT REQUIRES ATTENTION NOW */}
      <AttentionAlerts onNavigate={onNavigate} />

      {/* LEVEL 2 — PRIMARY BUSINESS & FINANCIAL KPI OVERVIEW */}
      <section className="w-full space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            Business & Financial Overview
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
          <StatCard icon={Wallet} title="Income" {...summary.income} />
          <StatCard icon={TrendingDown} title="Expenses" {...summary.expenses} />
          <StatCard icon={Scale} title="Balance" {...summary.balance} highlighted />
          
          <div onClick={handleGoToTrips} className="cursor-pointer">
            <StatCard
              icon={Route}
              title="Upcoming Trips"
              value={upcomingCount}
              infoText={upcomingCount > 0 ? `${upcomingCount} Scheduled` : 'No Trips'}
              direction="neutral"
              format="plain"
            />
          </div>

          <div onClick={handleGoToInvoices} className="cursor-pointer">
            {(() => {
              const unpaidCount = (invoiceStats?.pendingCount || 0) + (invoiceStats?.overdueCount || 0)
              const unpaidAmount = Number(invoiceStats?.totalPendingReceivables || 0)
              return (
                <StatCard
                  icon={FileText}
                  title="Receivables"
                  value={unpaidCount > 0 ? unpaidAmount : (invoiceStats?.total || 0)}
                  infoText={unpaidCount > 0 ? `${unpaidCount} Unpaid Invoice${unpaidCount > 1 ? 's' : ''}` : 'All Invoices Paid'}
                  sentiment={unpaidCount > 0 ? 'warning' : 'positive'}
                  direction="neutral"
                  format={unpaidCount > 0 ? 'currency' : 'plain'}
                />
              )
            })()}
          </div>
        </div>
      </section>

      {/* LEVEL 3 — QUICK ACTIONS */}
      <QuickActions onActionClick={(type) => setModalType(type)} />

      {/* LEVEL 4 — OPERATIONS & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full items-stretch">
        <div className="lg:col-span-2">
          <UpcomingTrips onViewAll={handleGoToTrips} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* LEVEL 5 — FINANCIAL TRENDS & RECENT TRANSACTIONS */}
      <div className="w-full space-y-5">
        <IncomeExpenseChart />
        <TransactionsTable />
      </div>

      {/* LEVEL 5 — SECONDARY SNAPSHOTS: FLEET & CUSTOMERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 w-full">
        <VehicleOverview />
        <CustomersOverview onViewAll={() => onNavigate && onNavigate('Customers')} />
      </div>

      {/* Interactive Quick Action Popup Modal */}
      <QuickActionModal
        isOpen={Boolean(modalType)}
        type={modalType}
        onClose={() => setModalType(null)}
        onToast={showToast}
      />
    </div>
  )
}
