import { useState, useEffect } from 'react'
import { Wallet, TrendingDown, Scale, Route, CheckCircle2, FileText } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import WelcomeSection from '../components/dashboard/WelcomeSection'
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

  // Render dedicated staff dashboard if role is Staff
  if (currentUser?.role === 'Staff') {
    return <StaffDashboard onNavigate={onNavigate} />
  }

  return (
    <div className="relative mx-auto max-w-[1440px] w-full space-y-5 lg:space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8">
      {/* Success Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 shadow-lg animate-slideDown">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Welcome / Business Context */}
      <WelcomeSection />

      {/* 2. Quick Actions */}
      <QuickActions onActionClick={(type) => setModalType(type)} />

      {/* 3. Business Summary Cards — driven by reactive store */}
      <section className="w-full">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
          Business Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5 w-full">
          <StatCard icon={Wallet}      title="Income"         {...summary.income} />
          <StatCard icon={TrendingDown} title="Expenses"      {...summary.expenses} />
          <StatCard icon={Scale}        title="Balance"       {...summary.balance} highlighted />
          <div onClick={handleGoToTrips} className="cursor-pointer">
            <StatCard icon={Route} title="Upcoming Trips" value={upcomingCount} trend="Schedule" direction="neutral" format="plain" />
          </div>
          <div onClick={() => onNavigate && onNavigate('Invoices')} className="cursor-pointer">
            <StatCard icon={FileText} title="Total Invoices" value={invoiceStats.total} trend={`${invoiceStats.paidCount} Paid`} direction="up" format="plain" />
          </div>
        </div>
      </section>

      {/* 4. Operational Grid: Upcoming Trips (70%) + Recent Activity (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full items-start">
        <div className="lg:col-span-2">
          <UpcomingTrips onViewAll={handleGoToTrips} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>


      {/* 5. Financial Overview */}
      <div className="w-full">
        <IncomeExpenseChart />
      </div>

      {/* 6. Recent Transactions */}
      <div className="w-full">
        <TransactionsTable />
      </div>

      {/* 7. Secondary Snapshots: Vehicle + Customer Overview */}
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
