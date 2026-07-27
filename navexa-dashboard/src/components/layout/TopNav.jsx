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
  Receipt
} from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useRouter } from '../../context/RouterContext'
import ConfirmDialog from '../trips/ConfirmDialog'

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

  // Notifications mock items
  const sampleNotifications = [
    {
      id: 1,
      icon: Clock,
      iconBg: 'bg-sky-50 text-sky-600',
      title: 'Upcoming Trip',
      desc: 'Trip to Kolkata starts tomorrow at 10:30 AM',
      time: '10 min ago',
      unread: true,
    },
    {
      id: 2,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'Payment Received',
      desc: '₹3,500 received for Kolkata Trip',
      time: '42 min ago',
      unread: true,
    },
    {
      id: 3,
      icon: Receipt,
      iconBg: 'bg-rose-50 text-rose-600',
      title: 'Expense Added',
      desc: 'Fuel expense of ₹2,000 was recorded',
      time: '1 hr ago',
      unread: false,
    },
  ]

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
          {/* Mobile Search Icon Button & Overlay */}
          <div className="sm:hidden flex justify-end">
            {mobileSearchOpen ? (
              <div className="absolute inset-x-0 top-0 z-40 flex h-14 items-center bg-surface px-4 shadow-sm border-b border-line gap-2 animate-fadeIn">
                <Search size={16} className="text-ink-soft shrink-0" />
                <input
                  type="text"
                  placeholder="Search trips, customers, transactions..."
                  className="w-full bg-transparent text-xs sm:text-sm text-ink outline-none placeholder:text-ink-soft"
                  autoFocus
                />
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-1 text-ink-soft hover:text-ink"
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

          {/* Desktop & Laptop Search Input */}
          <div className="relative hidden sm:block w-full">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              aria-label="Global search"
              placeholder="Search trips, customers, transactions..."
              className="h-9 w-full rounded-lg border border-line bg-bg pl-8.5 pr-8 text-xs font-medium text-ink placeholder:text-ink-soft/80 transition-all focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
              ⌘K
            </kbd>
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
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
            </button>

            {/* Notification Dropdown Popover */}
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-line bg-surface p-2 shadow-lg animate-scaleUp z-50">
                <div className="flex items-center justify-between border-b border-line px-2 py-1.5 pb-2">
                  <p className="text-xs font-bold text-ink">Notifications</p>
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                    2 unread
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto mt-1 space-y-1">
                  {sampleNotifications.map((n) => {
                    const Icon = n.icon
                    return (
                      <div
                        key={n.id}
                        className="flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-50 cursor-pointer"
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${n.iconBg}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-ink truncate">{n.title}</p>
                            {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                          </div>
                          <p className="text-[11px] text-ink-soft leading-tight mt-0.5">{n.desc}</p>
                          <p className="text-[10px] text-ink-soft/70 mt-1">{n.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-line mt-1 pt-1.5 text-center">
                  <button className="text-[11px] font-bold text-accent hover:underline">
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
    </header>
  )
}
