import { useState, useEffect } from 'react'
import { Wallet, TrendingDown, Scale, Plus, TrendingUp, CheckCircle2 } from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import TransactionsTable from '../components/dashboard/TransactionsTable'
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart'
import QuickActionModal from '../components/ui/QuickActionModal'
import { computeSummary, subscribeSummary } from '../data/transactionStore'

export default function FinancePage() {
  const [modalType, setModalType] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)
  const [summary, setSummary] = useState(computeSummary())

  useEffect(() => {
    const unsub = subscribeSummary(setSummary)
    return unsub
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 space-y-5 lg:space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 shadow-lg animate-fadeUp">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Finance</h1>
          <p className="text-xs text-ink-soft mt-0.5">Track revenue, expenses, and financial health.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setModalType('income')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          >
            <TrendingUp size={14} /> Record Income
          </button>
          <button
            onClick={() => setModalType('expense')}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
          >
            <TrendingDown size={14} /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 w-full">
        <StatCard icon={Wallet} title="Total Income" {...summary.income} />
        <StatCard icon={TrendingDown} title="Total Expenses" {...summary.expenses} />
        <StatCard icon={Scale} title="Net Balance" {...summary.balance} highlighted />
      </div>

      {/* Financial Overview Chart */}
      <div className="w-full">
        <IncomeExpenseChart />
      </div>

      {/* Transactions Table */}
      <div className="w-full">
        <TransactionsTable />
      </div>

      {/* Quick Action Popup Modal */}
      <QuickActionModal
        isOpen={Boolean(modalType)}
        type={modalType}
        onClose={() => setModalType(null)}
        onToast={showToast}
      />
    </div>
  )
}
