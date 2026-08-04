import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display right now.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-surface/50 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-soft mb-3">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-soft max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
        >
          {ActionIcon && <ActionIcon size={15} />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  )
}
