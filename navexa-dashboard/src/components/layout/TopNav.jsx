import { useState, useRef, useEffect } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  Clock,
  CheckCircle2,
  Receipt,
  Route,
  Car,
  UserCheck,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useRouter } from '../../context/RouterContext'
import ConfirmDialog from '../trips/ConfirmDialog'
import {
  liveNotifications, subscribeNotifications, markAsRead,
  markAllAsRead, getUnreadCount, syncNotifications
} from '../../data/notificationStore'
import { liveTrips } from '../../data/tripStore'
import GlobalSearchDropdown from '../search/GlobalSearchDropdown'

export default function TopNav({ pageTitle = 'Dashboard' }) {
  const { user, initials, signOut } = useUser()
  const { navigate } = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const [notifications, setNotifications] = useState([...liveNotifications])
  const [selectedTripForModal, setSelectedTripForModal] = useState(null)

  useEffect(() => {
    syncNotifications(user?.id)
    const unsub = subscribeNotifications((updated) => setNotifications([...updated]))
    return () => unsub()
  }, [user?.id])

  const unreadCount = getUnreadCount(user?.role)
  const isStaff = user?.role === 'Staff'

  const activeNotifs = notifications
    .filter(n => !n.isDismissed && (!isStaff || n.type !== 'payment'))
    .slice(0, 5)

  const handleNotifClick = (n) => {
    markAsRead(n.id)
    setNotifOpen(false)

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
    } else {
      navigate('Notifications')
    }
  }

  // Outside click & Escape key listeners
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setNotifOpen(false)
        setProfileOpen(false)
        setMobileSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSignOut = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError('')
    const { success, error } = await signOut()
    if (success) {
      setProfileOpen(false)
      setShowConfirmLogout(false)
      setIsLoggingOut(false)
      navigate('SignIn', true) // Replace history entry
    } else {
      setLogoutError(error || 'Unable to sign out. Please try again.')
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-surface/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        
        {/* LEFT: Dynamic Page Title */}
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-ink">
            {pageTitle}
          </h1>
        </div>

        {/* CENTER / AVAILABLE SPACE: Compact & Responsive Global Search */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2">
          {/* Mobile Search Overlay */}
          <div className="sm:hidden w-full">
            {mobileSearchOpen ? (
              <div className="flex items-center gap-2 w-full">
                <GlobalSearchDropdown isMobileOpen={true} onCloseMobile={() => setMobileSearchOpen(false)} />
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-1 text-ink-soft hover:text-ink shrink-0"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/20"
                aria-label="Search trips, customers, transactions..."
              >
                <Search size={17} />
              </button>
            )}
          </div>

          {/* Desktop & Laptop Global Search Input */}
          <div className="hidden sm:block w-full">
            <GlobalSearchDropdown />
          </div>
        </div>

        {/* RIGHT: Notifications & Centralized User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 🔔 Notifications Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              className={`relative flex h-8.5 w-8.5 items-center justify-center rounded-lg text-ink-soft transition-all hover:bg-slate-100 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/20 ${
                notifOpen ? 'bg-slate-100 text-ink' : ''
              }`}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-line bg-surface p-2.5 shadow-pop animate-scaleUp z-50">
                <div className="flex items-center justify-between border-b border-line px-2 pb-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-ink">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto mt-1 divide-y divide-line/60">
                  {activeNotifs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-ink-soft space-y-1">
                      <p className="font-bold text-ink">You're all caught up! 🎉</p>
                      <p className="text-[11px]">No new notifications right now.</p>
                    </div>
                  ) : (
                    activeNotifs.map((n) => {
                      const IconComponent = n.type === 'trip' ? Route : n.type === 'payment' ? Receipt : n.type === 'vehicle' ? Car : n.type === 'driver' ? UserCheck : Bell
                      const iconBg = n.severity === 'critical' ? 'bg-rose-50 text-rose-600' : n.severity === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`flex items-start gap-3 p-2.5 transition-colors hover:bg-slate-50 cursor-pointer rounded-lg ${!n.isRead ? 'bg-primary-50/20' : ''}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 ${iconBg}`}>
                            <IconComponent size={15} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-ink truncate">{n.title}</p>
                              {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            <p className="text-[11px] text-ink-soft leading-tight mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-ink-soft/70 num">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                n.severity === 'critical' ? 'bg-rose-100 text-rose-800' : n.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {n.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="border-t border-line mt-1.5 pt-2 text-center">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('Notifications') }}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 👤 Dynamic User Avatar & Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
              className={`flex items-center gap-2 rounded-lg p-1 transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-accent/20 ${
                profileOpen ? 'bg-slate-100' : ''
              }`}
              aria-label="User profile menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-xs">
                {initials}
              </div>
              <span className="hidden text-xs font-semibold text-ink md:block">{user?.name || 'User'}</span>
              <ChevronDown size={13} className="hidden text-ink-soft md:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lg animate-scaleUp z-50">
                <div className="border-b border-line px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-ink truncate">{user?.name || 'User'}</p>
                    <span className="rounded-full bg-primary-50 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                      {user?.role || 'Admin'}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft truncate mt-0.5">{user?.email || 'user@navexa.io'}</p>
                </div>

                <div className="py-1">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-slate-50">
                    <User size={15} className="text-ink-soft" /> Profile
                  </button>
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-slate-50">
                    <Settings size={15} className="text-ink-soft" /> Settings
                  </button>
                </div>

                <div className="border-t border-line pt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      setShowConfirmLogout(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-bg cursor-pointer border-0"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {showConfirmLogout && (
        <ConfirmDialog
          title="Sign out?"
          body={logoutError || "Are you sure you want to sign out of Navexa?"}
          confirmLabel={isLoggingOut ? "Signing out..." : "Sign Out"}
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={handleSignOut}
          onCancel={() => {
            if (!isLoggingOut) {
              setShowConfirmLogout(false)
              setLogoutError('')
            }
          }}
        />
      )}

      {/* Trip Details Modal (Triggered by Notification Click) */}
      {selectedTripForModal && (
        <TripDetailPanel
          trip={selectedTripForModal}
          isOpen={!!selectedTripForModal}
          onClose={() => setSelectedTripForModal(null)}
        />
      )}
    </header>
  )
}
