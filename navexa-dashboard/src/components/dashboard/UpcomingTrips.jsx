import { useState, useEffect } from 'react'
import { subscribeTrips, getUpcomingForDashboard, formatINR } from '../../data/tripStore'

export default function UpcomingTrips({ onViewAll }) {
  const [trips, setTrips] = useState(getUpcomingForDashboard(5))

  useEffect(() => {
    const unsub = subscribeTrips(() => {
      setTrips(getUpcomingForDashboard(5))
    })
    return unsub
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-200/60'
      case 'Ongoing':   return 'bg-amber-50 text-amber-700 border-amber-200/60'
      default:          return 'bg-sky-50 text-sky-700 border-sky-200/60'
    }
  }

  const getPaymentBadge = (payment) => {
    switch (payment) {
      case 'Paid':    return 'bg-emerald-50 text-emerald-700'
      case 'Partial': return 'bg-amber-50 text-amber-700'
      default:        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all">
      {/* Section Header */}
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h3 className="text-sm font-bold text-ink tracking-tight">Upcoming Trips</h3>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-primary hover:underline transition-all"
        >
          View All
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-ink-soft font-medium">No upcoming trips.</p>
          <p className="text-xs text-ink-soft mt-1">Add a trip to see it here.</p>
        </div>
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
                  <tr key={trip.id} className="group transition-colors hover:bg-slate-50/80 cursor-pointer"
                    onClick={onViewAll}>
                    <td className="py-3 px-3 font-semibold text-ink">{trip.customer}</td>
                    <td className="py-3 px-3 text-ink-soft group-hover:text-ink">{trip.route}</td>
                    <td className="py-3 px-3 text-ink-soft whitespace-nowrap">{trip.dateTime}</td>
                    <td className="hidden lg:table-cell py-3 px-3 text-ink-soft">{trip.vehicle}</td>
                    <td className="py-3 px-3 text-right font-bold text-ink num">{formatINR(trip.fare)}</td>
                    <td className="hidden md:table-cell py-3 px-3 text-center">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${getPaymentBadge(trip.payment)}`}>
                        {trip.payment}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📱 Mobile Responsive Cards List */}
          <div className="sm:hidden space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} onClick={onViewAll}
                className="w-full rounded-xl border border-line bg-bg p-3.5 space-y-2 transition-all hover:border-slate-300 active:scale-[0.99] cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{trip.customer}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-ink-soft">{trip.route}</div>
                <div className="flex items-center justify-between text-[11px] text-ink-soft pt-0.5 border-t border-line/50">
                  <span>{trip.dateTime} · {trip.vehicle}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink num">{formatINR(trip.fare)}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getPaymentBadge(trip.payment)}`}>
                      {trip.payment}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
