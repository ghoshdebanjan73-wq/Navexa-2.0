export default function PageHeader({
  title,
  description,
  badge,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionDisabled = false,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
          {badge !== undefined && badge !== null && (
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-extrabold text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-ink-soft leading-relaxed mt-0.5">{description}</p>
        )}
      </div>

      {(actionLabel && onAction) || children ? (
        <div className="flex items-center gap-2.5 shrink-0">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              disabled={actionDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {ActionIcon && <ActionIcon size={16} strokeWidth={2.25} />}
              <span>{actionLabel}</span>
            </button>
          )}
          {children}
        </div>
      ) : null}
    </div>
  )
}
