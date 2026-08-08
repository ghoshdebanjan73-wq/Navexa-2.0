import { useState, useEffect } from 'react'
import { Route, ChevronRight, ArrowRight } from 'lucide-react'
import { subscribeTrips, getUpcomingForDashboard, formatINR } from '../../data/tripStore'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from '../ui/EmptyState'

export default function UpcomingTrips({ onViewAll }) {
  const [trips, setTrips] = useState(getUpcomingForDashboard(5))

  useEffect(() => {
    const unsub = subscribeTrips(() => {
      setTrips(getUpcomingForDashboard(5))
    })
    return unsub
  }, [])

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all h-full flex flex-col justify-between">
      {/* Section Header */}
      <div>
        <div className="mb-3.5 flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink tracking-tight">Today & Upcoming Operations</h3>
            {trips.length > 0 && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                {trips.length}
              </span>
            )}
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-primary hover:underline transition-all cursor-pointer inline-flex items-center gap-0.5"
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        {trips.length === 0 ? (
          <EmptyState
            icon={Route}
            title="No upcoming trips scheduled"
            description="Book new customer trips to dispatch drivers and track operations."
            actionLabel="Schedule Trip"
            onAction={onViewAll}
            className="py-6 border-0 bg-transparent"
          />
        ) : (
          <>
            {/* 🖥️ Desktop & Tablet Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="hidden lg:table-cell py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3 text-right">Fare</th>
                    <th className="hidden md:table-cell py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium text-ink">
                  {trips.map((trip) => (
                    <tr
                      key={trip.id}
                      className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                      onClick={onViewAll}
                    >
                      <td className="py-3 px-3 font-semibold text-ink">{trip.customer}</td>
                      <td className="py-3 px-3 text-ink-soft group-hover:text-ink">{trip.route}</td>
                      <td className="py-3 px-3 text-ink-soft whitespace-nowrap num">{trip.dateTime}</td>
                      <td className="hidden lg:table-cell py-3 px-3 text-ink-soft">{trip.vehicle}</td>
                      <td className="py-3 px-3 text-right font-bold text-ink num">{formatINR(trip.fare)}</td>
                      <td className="hidden md:table-cell py-3 px-3 text-center">
                        <StatusBadge status={trip.payment} showDot={false} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={trip.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 📱 Mobile Responsive Cards List */}
            <div className="sm:hidden space-y-2.5">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={onViewAll}
                  className="w-full rounded-xl border border-line bg-bg p-3.5 space-y-2 transition-all hover:border-slate-300 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink truncate max-w-[160px]">{trip.customer}</span>
                    <StatusBadge status={trip.status} size="sm" />
                  </div>
                  <div className="text-xs font-semibold text-ink-soft">{trip.route}</div>
                  <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1 border-t border-line/50">
                    <span className="num">{trip.dateTime} · {trip.vehicle}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink num">{formatINR(trip.fare)}</span>
                      <StatusBadge status={trip.payment} showDot={false} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {trips.length > 0 && (
        <div className="pt-3 border-t border-line mt-3 text-right">
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Go to Trips Console <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
