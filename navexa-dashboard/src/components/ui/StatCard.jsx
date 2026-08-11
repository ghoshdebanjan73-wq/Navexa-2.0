import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'

const formatINR = (n) => {
  if (n === null || n === undefined) return '₹0'
  if (typeof n === 'string' && (n.includes('₹') || n.includes('Rs'))) return n
  const num = Number(n)
  if (isNaN(num)) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  delta,
  direction,
  sentiment = 'positive',
  infoText,
  highlighted = false,
  format = 'currency',
  periodText = 'vs prev month'
}) {
  const isUp = direction === 'up'
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''))

  // Card container hierarchy styling
  const cardStyle = highlighted
    ? 'border border-primary/30 bg-primary-50/50 hover:border-primary/50'
    : 'border border-line bg-surface hover:border-slate-300'

  // Icon container accent styling based on title / metric type
  const getIconStyle = () => {
    if (title === 'Income') return 'bg-emerald-50 text-emerald-700'
    if (title === 'Expenses') return 'bg-rose-50 text-rose-700'
    if (title === 'Balance') return 'bg-primary-100 text-primary'
    return 'bg-primary-50 text-primary'
  }

  // Semantic trend badge styling
  const getBadgeStyle = () => {
    if (sentiment === 'warning' || sentiment === 'negative') {
      return 'bg-rose-50 text-rose-700 border border-rose-200/60'
    }
    if (sentiment === 'info' || infoText) {
      return 'bg-slate-100 text-slate-700 border border-slate-200/60'
    }
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
  }

  return (
    <div
      className={`group relative w-full h-full flex flex-col justify-between rounded-2xl p-4 sm:p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${cardStyle}`}
    >
      {/* Top Row: Label & Icon Container */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">{title}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${getIconStyle()}`}>
          <Icon size={17} strokeWidth={2.25} />
        </div>
      </div>

      {/* Middle Row: Main Metric Value */}
      <div className="my-2.5">
        <p className="num text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
          {!isNaN(numericVal) && typeof value !== 'string' ? (
            <AnimatedNumber
              value={numericVal}
              prefix={format === 'currency' ? '₹' : ''}
              formatter={format === 'currency' ? formatINR : undefined}
            />
          ) : (
            format === 'currency' ? formatINR(value) : value
          )}
        </p>
      </div>

      {/* Bottom Row: Secondary Context & Trend Badge */}
      <div className="flex items-center gap-1.5 pt-0.5">
        {infoText ? (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBadgeStyle()}`}>
            {infoText}
          </span>
        ) : delta !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getBadgeStyle()}`}>
              {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {delta}%
            </span>
            <span className="text-[10px] font-semibold text-ink-soft/80">{periodText}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
