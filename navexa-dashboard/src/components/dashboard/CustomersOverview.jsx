import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { subscribeCustomers, computeCustomerSummary, getInitials } from '../../data/customerStore'

export default function CustomersOverview({ onViewAll }) {
  const [summary, setSummary] = useState(computeCustomerSummary())

  useEffect(() => {
    const unsub = subscribeCustomers(() => {
      setSummary(computeCustomerSummary())
    })
    return unsub
  }, [])

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h3 className="text-sm font-bold text-ink tracking-tight">Customers Overview</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-primary hover:underline transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Total Customers Stat */}
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary-50 p-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Users size={16} strokeWidth={2.25} />
        </div>
        <div>
          <p className="num text-xl font-extrabold leading-none text-primary">{summary.total}</p>
          <p className="mt-1 text-xs text-ink-soft">Total customers</p>
        </div>
      </div>

      {/* Recently Added */}
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
        Recently Added
      </p>
      <div className="space-y-3">
        {summary.recent.map((c, i) => (
          <div key={`${c.phone}-${i}`} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[11px] font-bold text-primary">
              {getInitials(c.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
              <p className="truncate text-xs text-ink-soft">{c.phone}</p>
            </div>
            <p className="hidden shrink-0 text-[11px] text-ink-soft sm:block">{c.activity}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
