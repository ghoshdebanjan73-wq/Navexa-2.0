import { Route, TrendingUp, TrendingDown, UserPlus } from 'lucide-react'

// Reusable QuickAction Button Primitive
function QuickActionButton({ label, icon: Icon, iconBg, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs transition-all duration-150 hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 cursor-pointer"
    >
      <div className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconBg}`}>
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <span className="text-xs sm:text-sm font-bold text-ink tracking-tight truncate">{label}</span>
    </button>
  )
}

export default function QuickActions({ onActionClick }) {
  const actions = [
    {
      type: 'trip',
      label: 'Add Trip',
      icon: Route,
      iconBg: 'bg-primary-50 text-primary',
    },
    {
      type: 'income',
      label: 'Add Income',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
    {
      type: 'expense',
      label: 'Add Expense',
      icon: TrendingDown,
      iconBg: 'bg-rose-50 text-rose-700',
    },
    {
      type: 'customer',
      label: 'Add Customer',
      icon: UserPlus,
      iconBg: 'bg-primary-50 text-primary',
    },
  ]

  return (
    <section className="w-full">
      {/* Clean Section Header */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
        Quick Actions
      </h3>

      {/* Grid: 4 in 1 row on Desktop & Tablet, 2x2 grid on Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full">
        {actions.map(({ type, label, icon, iconBg }) => (
          <QuickActionButton
            key={type}
            label={label}
            icon={icon}
            iconBg={iconBg}
            onClick={() => onActionClick && onActionClick(type)}
          />
        ))}
      </div>
    </section>
  )
}
