import React from 'react'

/** Base shimmer line element */
export function SkeletonLine({ className = 'h-4 w-full', rounded = 'rounded-md' }) {
  return (
    <div className={`bg-slate-200/80 animate-pulse ${rounded} ${className}`} />
  )
}

/** Skeleton Header for Page Headers */
export function SkeletonHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 mb-5 space-y-3 sm:space-y-0">
      <div className="space-y-2">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-3 w-80" />
      </div>
      <SkeletonLine className="h-9 w-32 rounded-xl" />
    </div>
  )
}

/** Skeleton Summary Metric Cards Grid */
export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton Table Rows for Desktop Tables */
export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs mb-5">
      <div className="bg-bg border-b border-line p-3 flex justify-between">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-4 w-24" />
      </div>
      <div className="divide-y divide-line p-2 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center justify-between p-3 gap-4">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonLine className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1 flex-1">
                <SkeletonLine className="h-3.5 w-1/3" />
                <SkeletonLine className="h-3 w-1/4" />
              </div>
            </div>
            <SkeletonLine className="h-4 w-20" />
            <SkeletonLine className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton Grid of Cards (for Mobile or Cards Grid Views) */
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonLine className="h-3.5 w-full" />
          <SkeletonLine className="h-3 w-2/3" />
          <div className="pt-2 border-t border-line/60 flex justify-between items-center">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-7 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton Chart Box */
export function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs mb-5 space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonLine className="h-4 w-36" />
        <SkeletonLine className="h-7 w-28 rounded-xl" />
      </div>
      <div className="h-48 w-full bg-slate-100/60 rounded-xl flex items-end justify-between p-4 gap-3 animate-pulse">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-300/80 rounded-t-sm w-full"
            style={{ height: `${Math.max(20, Math.floor(Math.sin(i + 1) * 40 + 50))}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function LoadingSkeleton({ variant = 'page' }) {
  if (variant === 'stats') return <SkeletonStats />
  if (variant === 'table') return <SkeletonTable />
  if (variant === 'grid') return <SkeletonGrid />
  if (variant === 'chart') return <SkeletonChart />

  return (
    <div className="space-y-5 animate-fadeIn">
      <SkeletonHeader />
      <SkeletonStats />
      <SkeletonGrid />
    </div>
  )
}
