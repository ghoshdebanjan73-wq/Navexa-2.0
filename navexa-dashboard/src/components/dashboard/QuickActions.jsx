import { Route, TrendingUp, TrendingDown, UserPlus, FileText } from 'lucide-react'

/**
 * Standardized Level 3 Quick Actions Bar for Dashboard
 * Prioritizes high-frequency actions (Add Trip, Record Income, Record Expense, Add Customer, Create Invoice).
 * Emphasizes Add Trip as primary action on mobile and desktop.
 */
export default function QuickActions({ onActionClick }) {
  return (
    <section className="w-full space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
        {/* 1. Primary Action: Add Trip */}
        <button
          onClick={() => onActionClick && onActionClick('trip')}
          className="group flex items-center gap-3 rounded-2xl bg-primary px-3.5 py-3 text-white shadow-xs transition-all hover:bg-primary-600 active:scale-[0.98] cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <Route size={18} strokeWidth={2.25} />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs sm:text-sm font-extrabold leading-snug">Add Trip</span>
            <span className="block text-[10px] text-white/80 font-medium truncate">Create new booking</span>
          </div>
        </button>

        {/* 2. Record Income */}
        <button
          onClick={() => onActionClick && onActionClick('income')}
          className="group flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-emerald-950 shadow-2xs transition-all hover:bg-emerald-100/80 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <TrendingUp size={16} strokeWidth={2.25} />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold leading-tight">Add Income</span>
            <span className="block text-[10px] text-emerald-700 font-medium">Record revenue</span>
          </div>
        </button>

        {/* 3. Record Expense */}
        <button
          onClick={() => onActionClick && onActionClick('expense')}
          className="group flex items-center gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3 text-rose-950 shadow-2xs transition-all hover:bg-rose-100/80 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <TrendingDown size={16} strokeWidth={2.25} />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold leading-tight">Add Expense</span>
            <span className="block text-[10px] text-rose-700 font-medium">Record cost</span>
          </div>
        </button>

        {/* 4. Add Customer */}
        <button
          onClick={() => onActionClick && onActionClick('customer')}
          className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 text-ink shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <UserPlus size={16} strokeWidth={2.25} />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold leading-tight">Add Customer</span>
            <span className="block text-[10px] text-ink-soft font-medium">New client</span>
          </div>
        </button>

        {/* 5. Create Invoice */}
        <button
          onClick={() => onActionClick && onActionClick('invoice')}
          className="group flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 text-ink shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <FileText size={16} strokeWidth={2.25} />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-bold leading-tight">Create Invoice</span>
            <span className="block text-[10px] text-ink-soft font-medium">Billing</span>
          </div>
        </button>
      </div>
    </section>
  )
}
