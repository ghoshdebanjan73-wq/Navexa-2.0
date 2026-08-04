const STYLES = {
  // Operational & Trip Stages
  Booked: 'bg-slate-100 text-slate-700 border-slate-200',
  Confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  'Driver Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Vehicle Assigned': 'bg-purple-50 text-purple-700 border-purple-200',
  Started: 'bg-amber-50 text-amber-700 border-amber-200',
  'Passenger Picked Up': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Ongoing: 'bg-amber-50 text-amber-700 border-amber-200',

  // Vehicle & Driver Statuses
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-accent-50 text-accent-700 border-accent-100',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',

  // Financial & Payment Statuses
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
  Partial: 'bg-amber-50 text-amber-700 border-amber-200',
  'Partially Paid': 'bg-amber-50 text-amber-700 border-amber-200',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Pending: 'bg-warning-bg text-warning border-warning/20',
  Failed: 'bg-danger-bg text-danger border-danger/20',
}

export default function StatusBadge({ status, showDot = true, size = 'md', className = '' }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold whitespace-nowrap ${sizeClasses} ${style} ${className}`}
    >
      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />}
      {status || 'Unknown'}
    </span>
  )
}
