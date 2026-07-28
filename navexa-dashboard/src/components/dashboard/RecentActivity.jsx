import { useState, useEffect } from 'react'
import { Route, TrendingUp, TrendingDown, Users, Car, UserCheck, FileText, Settings, ArrowRight, History } from 'lucide-react'
import { liveAuditLogs, subscribeAuditLogs } from '../../data/auditStore'
import { useRouter } from '../../context/RouterContext'

export default function RecentActivity() {
  const { navigate } = useRouter()
  const [logs, setLogs] = useState(() => liveAuditLogs.slice(0, 5))

  useEffect(() => {
    const unsub = subscribeAuditLogs((updatedLogs) => {
      setLogs(updatedLogs.slice(0, 5))
    })
    return unsub
  }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'Customer': return { Icon: Users, style: 'bg-primary-50 text-primary' }
      case 'Trip': return { Icon: Route, style: 'bg-primary-50 text-primary' }
      case 'Driver': return { Icon: UserCheck, style: 'bg-primary-50 text-primary' }
      case 'Vehicle': return { Icon: Car, style: 'bg-primary-50 text-primary' }
      case 'Invoice': return { Icon: FileText, style: 'bg-amber-50 text-amber-700' }
      case 'Finance': return { Icon: TrendingUp, style: 'bg-emerald-50 text-emerald-700' }
      case 'Settings': return { Icon: Settings, style: 'bg-sky-50 text-sky-700' }
      default: return { Icon: History, style: 'bg-slate-100 text-slate-700' }
    }
  }

  const getTimeAgo = (isoStr) => {
    if (!isoStr) return 'Recently'
    try {
      const diffMs = Date.now() - new Date(isoStr).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return `${Math.floor(diffHours / 24)}d ago`
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all h-full">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <h3 className="text-sm font-bold text-ink tracking-tight flex items-center gap-1.5">
          <History size={16} className="text-primary" /> Recent Activity
        </h3>
        <button
          onClick={() => navigate('Activity')}
          className="text-xs font-bold text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5"
        >
          View All <ArrowRight size={13} />
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-ink-soft py-6 text-center">No recent activity</p>
      ) : (
        <div className="space-y-3.5">
          {logs.map((item) => {
            const { Icon, style } = getIcon(item.entity_type)
            return (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style}`}>
                  <Icon size={14} strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink leading-snug">{item.description}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">
                    {getTimeAgo(item.created_at)} • by {item.user_name} ({item.user_role})
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
