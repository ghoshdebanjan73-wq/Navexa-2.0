const STYLES = {
  Confirmed: 'bg-success-bg text-success',
  Completed: 'bg-success-bg text-success',
  Available: 'bg-success-bg text-success',
  Pending: 'bg-warning-bg text-warning',
  'On Trip': 'bg-accent-50 text-accent-700',
  Failed: 'bg-danger-bg text-danger',
  Inactive: 'bg-slate-100 text-ink-soft',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-ink-soft'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
