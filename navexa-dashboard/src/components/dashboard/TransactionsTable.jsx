import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { liveTransactions, subscribeTxn } from '../../data/transactionStore'

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function TransactionsTable() {
  const [txns, setTxns] = useState([...liveTransactions])

  useEffect(() => {
    const unsub = subscribeTxn(setTxns)
    return unsub
  }, [])

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all">
      {/* Header Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h3 className="text-sm font-bold text-ink tracking-tight">Recent Transactions</h3>
        <button className="text-xs font-semibold text-primary hover:underline transition-all">
          View All
        </button>
      </div>

      {/* 🖥️ Desktop & Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              <th className="py-2.5 px-3">Transaction</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-center">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60 font-medium text-ink">
            {txns.map((t) => {
              const isIncome = t.type === 'Income'
              return (
                <tr
                  key={t.id}
                  className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                >
                  <td className="py-3 px-3 font-semibold text-ink">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isIncome ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      </div>
                      <span className="truncate max-w-[140px]">{t.transaction}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-ink-soft group-hover:text-ink">{t.category}</td>
                  <td className="py-3 px-3 text-ink-soft whitespace-nowrap">{t.date}</td>
                  <td className={`py-3 px-3 text-right font-bold num whitespace-nowrap ${
                    isIncome ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isIncome ? `+${formatINR(t.amount)}` : `-${formatINR(t.amount)}`}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border-rose-200/60'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile Responsive Cards */}
      <div className="sm:hidden space-y-2.5">
        {txns.map((t) => {
          const isIncome = t.type === 'Income'
          return (
            <div
              key={t.id}
              className="w-full rounded-xl border border-line bg-bg p-3 space-y-1.5 transition-all hover:border-slate-300 active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {isIncome ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  </div>
                  <span className="text-xs font-bold text-ink truncate max-w-[140px]">{t.transaction}</span>
                </div>
                <span className={`text-xs font-bold num shrink-0 ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isIncome ? `+${formatINR(t.amount)}` : `-${formatINR(t.amount)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1 border-t border-line/50">
                <span>{t.category} · {t.date}</span>
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                  isIncome ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'
                }`}>
                  {t.type}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
