import { useState, useEffect } from 'react'
import { Route, TrendingUp, TrendingDown, UserPlus } from 'lucide-react'
import { liveActivity, subscribeActivity } from '../../data/transactionStore'

const ICONS = {
  trip:     { icon: Route,        style: 'bg-primary-50 text-primary' },
  income:   { icon: TrendingUp,   style: 'bg-emerald-50 text-emerald-700' },
  expense:  { icon: TrendingDown, style: 'bg-rose-50 text-rose-700' },
  customer: { icon: UserPlus,     style: 'bg-primary-50 text-primary' },
}

export default function RecentActivity() {
  const [activity, setActivity] = useState([...liveActivity])

  useEffect(() => {
    const unsub = subscribeActivity(setActivity)
    return unsub
  }, [])

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all h-full">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h3 className="text-sm font-bold text-ink tracking-tight">Recent Activity</h3>
      </div>
      {activity.length === 0 ? (
        <p className="text-xs text-ink-soft py-6 text-center">No recent activity</p>
      ) : (
        <div className="space-y-3.5">
          {activity.map((item) => {
            const { icon: Icon, style } = ICONS[item.type] || ICONS.trip
            return (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style}`}>
                  <Icon size={14} strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink leading-snug">{item.text}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {item.time}{item.performedBy && ` • by ${item.performedBy}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
