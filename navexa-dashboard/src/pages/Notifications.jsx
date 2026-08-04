import { useState, useEffect, useMemo } from 'react'
import {
  Bell, CheckCircle2, Trash2, Filter, Route, Receipt, Car, UserCheck,
  AlertTriangle, Info, AlertCircle, ArrowUpRight, Clock, Check
} from 'lucide-react'
import {
  liveNotifications, subscribeNotifications, markAsRead,
  markAllAsRead, dismissNotification, syncNotifications, getUnreadCount
} from '../data/notificationStore'
import { liveTrips } from '../data/tripStore'
import { useRouter } from '../context/RouterContext'
import { useUser } from '../context/UserContext'
import TripDetailPanel from '../components/trips/TripDetailPanel'
import EmptyState from '../components/ui/EmptyState'

export default function NotificationsPage() {
  const { user } = useUser()
  const { navigate } = useRouter()
  const [notifications, setNotifications] = useState([...liveNotifications])
  const [filterTab, setFilterTab] = useState('All') // 'All' | 'Unread' | 'Trips' | 'Payments' | 'Vehicles' | 'Drivers'
  const [selectedTripForModal, setSelectedTripForModal] = useState(null)

  useEffect(() => {
    syncNotifications(user?.id)
    const unsub = subscribeNotifications((updated) => setNotifications([...updated]))
    return () => unsub()
  }, [user?.id])

  const isStaff = user?.role === 'Staff'

  // Filtered Notifications List
  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      if (n.isDismissed) return false
      if (isStaff && n.type === 'payment') return false

      if (filterTab === 'Unread') return !n.isRead
      if (filterTab === 'Trips') return n.type === 'trip'
      if (filterTab === 'Payments') return n.type === 'payment'
      if (filterTab === 'Vehicles') return n.type === 'vehicle'
      if (filterTab === 'Drivers') return n.type === 'driver'

      return true
    })
  }, [notifications, filterTab, isStaff])

  const unreadCount = getUnreadCount(user?.role)

  const handleItemClick = (n) => {
    markAsRead(n.id)

    if (n.tripId) {
      const match = liveTrips.find(t => t.id === n.tripId)
      if (match) {
        setSelectedTripForModal(match)
        return
      }
      navigate('Trips')
    } else if (n.invoiceId) {
      navigate('Invoices')
    } else if (n.vehicleId) {
      navigate('Vehicles')
    } else if (n.driverId) {
      navigate('Drivers')
    }
  }

  const handleDismissAll = () => {
    filteredNotifs.forEach(n => dismissNotification(n.id))
  }

  return (
    <div className="page-container">
      
      {/* Page Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-extrabold text-rose-700">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-0.5">Trips, payments, vehicle documents, and operational reminders.</p>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 size={15} className="text-emerald-600" /> Mark All as Read
            </button>
          )}

          {filteredNotifs.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
            >
              <Trash2 size={15} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {['All', 'Unread', 'Trips', ...(!isStaff ? ['Payments'] : []), 'Vehicles', 'Drivers'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Notifications List */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="You're all caught up! 🎉"
            description="No notifications found for the selected filter tab right now."
            className="border-0 bg-transparent py-16"
          />
        ) : (
          <div className="divide-y divide-line">
            {filteredNotifs.map(n => {
              const IconComponent = n.type === 'trip' ? Route : n.type === 'payment' ? Receipt : n.type === 'vehicle' ? Car : n.type === 'driver' ? UserCheck : Bell
              const iconBg = n.severity === 'critical' ? 'bg-rose-50 text-rose-600' : n.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'

              return (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors ${!n.isRead ? 'bg-primary-50/15 font-medium' : 'hover:bg-slate-50/80'}`}
                >
                  <div
                    onClick={() => handleItemClick(n)}
                    className="flex items-start gap-3.5 flex-1 cursor-pointer"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                      <IconComponent size={18} />
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-extrabold text-ink">{n.title}</h4>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          n.severity === 'critical' ? 'bg-rose-100 text-rose-800' : n.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">{n.message}</p>
                      <p className="text-[10px] text-ink-soft/70 num pt-0.5">
                        {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Check size={13} /> Mark Read
                      </button>
                    )}

                    <button
                      onClick={() => handleItemClick(n)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      View Record <ArrowUpRight size={13} />
                    </button>

                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Dismiss notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Trip Details Modal (Triggered by Notification Click) */}
      {selectedTripForModal && (
        <TripDetailPanel
          trip={selectedTripForModal}
          isOpen={!!selectedTripForModal}
          onClose={() => setSelectedTripForModal(null)}
        />
      )}

    </div>
  )
}
