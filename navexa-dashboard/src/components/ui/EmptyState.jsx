import React from 'react'
import { Inbox, Search, Filter, AlertTriangle, RefreshCw, X } from 'lucide-react'

/** General Contextual Empty State (First-Use) */
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

/** Search Empty State (0 Query Matches) */
export function SearchEmptyState({ query = '', onClearSearch, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-surface/50 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-3">
        <Search size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-ink mb-1">No results found</h3>
      <p className="text-xs text-ink-soft max-w-sm mb-4 leading-relaxed">
        {query ? `We couldn't find anything matching “${query}”.` : 'No items match your search query.'}
      </p>
      {onClearSearch && (
        <button
          onClick={onClearSearch}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <X size={14} />
          <span>Clear Search</span>
        </button>
      )}
    </div>
  )
}

/** Filter Empty State (0 Filter Matches) */
export function FilterEmptyState({ onClearFilters, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-line bg-surface/50 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-3">
        <Filter size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-ink mb-1">No matching records</h3>
      <p className="text-xs text-ink-soft max-w-sm mb-4 leading-relaxed">
        Try adjusting your active filters or date range to see results.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <X size={14} />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  )
}

/** Server/Database Error State */
export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this information right now. Please try again.",
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-rose-200 bg-rose-50/40 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 mb-3">
        <AlertTriangle size={24} strokeWidth={1.75} />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-ink mb-1">{title}</h3>
      <p className="text-xs text-rose-800 max-w-sm mb-4 leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  )
}
