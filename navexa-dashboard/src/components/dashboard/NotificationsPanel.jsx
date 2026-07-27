import { Route, Wallet, ClipboardCheck, UserCog } from 'lucide-react'
import { notifications } from '../../data/mockData'

const ICONS = {
  trip: { icon: Route, style: 'bg-accent-50 text-accent-700' },
  payment: { icon: Wallet, style: 'bg-success-bg text-success' },
  approval: { icon: ClipboardCheck, style: 'bg-warning-bg text-warning' },
  user: { icon: UserCog, style: 'bg-primary-50 text-primary' },
}

export default function NotificationsPanel() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-ink">Notifications</h3>
      <div className="space-y-2.5">
        {notifications.map((n) => {
          const { icon: Icon, style } = ICONS[n.type]
          return (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-xl border border-line p-3 transition-colors hover:border-slate-300"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style}`}>
                <Icon size={15} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-ink">{n.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{n.desc}</p>
                <p className="mt-0.5 text-[11px] text-ink-soft/80">{n.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
