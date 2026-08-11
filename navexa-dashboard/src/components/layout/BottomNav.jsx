import { useState } from 'react'
import {
  LayoutGrid,
  Route,
  FileText,
  Receipt,
  Users,
  Menu,
  Car,
  Shield,
  User,
  Settings,
  X,
  LogOut,
  Building2,
  UserCheck
} from 'lucide-react'
import { useRouter } from '../../context/RouterContext'
import { useUser } from '../../context/UserContext'
import ConfirmDialog from '../trips/ConfirmDialog'

export default function BottomNav() {
  const { activeRoute, navigate } = useRouter()
  const { user, signOut } = useUser()
  const [moreOpen, setMoreOpen] = useState(false)
  const isStaff = user?.role === 'Staff'

  const [showConfirmLogout, setShowConfirmLogout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const handleSignOut = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError('')
    const { success, error } = await signOut()
    if (success) {
      setMoreOpen(false)
      setShowConfirmLogout(false)
      setIsLoggingOut(false)
      navigate('SignIn', true) // Replace history entry
    } else {
      setLogoutError(error || 'Unable to sign out. Please try again.')
      setIsLoggingOut(false)
    }
  }

  const handleNav = (routeId) => {
    setMoreOpen(false)
    navigate(routeId)
  }

  // Check if More is active (when current route is a secondary route or drawer is open)
  const isMoreActive = moreOpen || ['Vehicles', 'Drivers', 'Users', 'Profile', 'Settings', 'CompanyProfile'].includes(activeRoute)

  return (
    <>
      {/* 📱 Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex min-h-[56px] items-stretch justify-around border-t border-line bg-surface/95 px-1 pb-safe backdrop-blur-md shadow-lg"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNav('Dashboard')}
          aria-label="Dashboard"
          className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
        >
          <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
            activeRoute === 'Dashboard' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`} />
          <LayoutGrid size={18} strokeWidth={activeRoute === 'Dashboard' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
            activeRoute === 'Dashboard' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
          }`} />
          <span className={`relative z-10 transition-colors duration-200 ${
            activeRoute === 'Dashboard' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
          }`}>Dashboard</span>
        </button>

        {/* 2. Trips */}
        <button
          type="button"
          onClick={() => handleNav('Trips')}
          aria-label="Trips"
          className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
        >
          <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
            activeRoute === 'Trips' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`} />
          <Route size={18} strokeWidth={activeRoute === 'Trips' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
            activeRoute === 'Trips' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
          }`} />
          <span className={`relative z-10 transition-colors duration-200 ${
            activeRoute === 'Trips' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
          }`}>Trips</span>
        </button>

        {/* 3. Invoices */}
        <button
          type="button"
          onClick={() => handleNav('Invoices')}
          aria-label="Invoices"
          className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
        >
          <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
            activeRoute === 'Invoices' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`} />
          <FileText size={18} strokeWidth={activeRoute === 'Invoices' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
            activeRoute === 'Invoices' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
          }`} />
          <span className={`relative z-10 transition-colors duration-200 ${
            activeRoute === 'Invoices' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
          }`}>Invoices</span>
        </button>

        {/* 3. Finance / Vehicles for Staff */}
        {!isStaff ? (
          <button
            type="button"
            onClick={() => handleNav('Finance')}
            aria-label="Finance"
            className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
          >
            <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
              activeRoute === 'Finance' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`} />
            <Receipt size={18} strokeWidth={activeRoute === 'Finance' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
              activeRoute === 'Finance' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
            }`} />
            <span className={`relative z-10 transition-colors duration-200 ${
              activeRoute === 'Finance' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
            }`}>Finance</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleNav('Vehicles')}
            aria-label="Vehicles"
            className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
          >
            <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
              activeRoute === 'Vehicles' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`} />
            <Car size={18} strokeWidth={activeRoute === 'Vehicles' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
              activeRoute === 'Vehicles' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
            }`} />
            <span className={`relative z-10 transition-colors duration-200 ${
              activeRoute === 'Vehicles' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
            }`}>Vehicles</span>
          </button>
        )}

        {/* 4. Customers (Hide for Staff) */}
        {!isStaff && (
          <button
            type="button"
            onClick={() => handleNav('Customers')}
            aria-label="Customers"
            className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
          >
            <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
              activeRoute === 'Customers' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`} />
            <Users size={18} strokeWidth={activeRoute === 'Customers' ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
              activeRoute === 'Customers' ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
            }`} />
            <span className={`relative z-10 transition-colors duration-200 ${
              activeRoute === 'Customers' ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
            }`}>Customers</span>
          </button>
        )}

        {/* 5. More Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMoreOpen(v => !v)}
          aria-label="More navigation"
          aria-expanded={moreOpen}
          className="relative flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
        >
          <span className={`absolute inset-x-1 top-1 bottom-1 rounded-xl bg-primary-50 transition-all duration-200 ease-out ${
            isMoreActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
          }`} />
          <Menu size={18} strokeWidth={isMoreActive ? 2.5 : 2} className={`relative z-10 transition-all duration-200 ${
            isMoreActive ? 'text-primary scale-110' : 'text-ink-soft hover:text-ink scale-100'
          }`} />
          <span className={`relative z-10 transition-colors duration-200 ${
            isMoreActive ? 'text-primary font-extrabold' : 'text-ink-soft font-semibold'
          }`}>More</span>
        </button>
      </nav>

      {/* 📱 Mobile "More" Drawer Sheet */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm animate-fadeIn"
          onClick={e => { if (e.target === e.currentTarget) setMoreOpen(false) }}
        >
          <div className="w-full rounded-t-3xl border-t border-line bg-surface p-5 shadow-lg animate-slideUp">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink">More Navigation</h3>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {/* Vehicles */}
              <button
                type="button"
                onClick={() => handleNav('Vehicles')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  activeRoute === 'Vehicles' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Car size={18} />
                </div>
                <span className="text-xs font-bold text-ink">Vehicles</span>
              </button>

              {/* Drivers (Available for all) */}
              <button
                type="button"
                onClick={() => handleNav('Drivers')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  activeRoute === 'Drivers' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <UserCheck size={18} />
                </div>
                <span className="text-xs font-bold text-ink">Drivers</span>
              </button>

              {/* Users (Hide for Staff) */}
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => handleNav('Users')}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    activeRoute === 'Users' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Shield size={18} />
                  </div>
                  <span className="text-xs font-bold text-ink">Users</span>
                </button>
              )}

              {/* Company Profile (Hide for Staff) */}
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => handleNav('CompanyProfile')}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    activeRoute === 'CompanyProfile' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Building2 size={18} />
                  </div>
                  <span className="text-xs font-bold text-ink">Company Profile</span>
                </button>
              )}

              {/* Profile (Show for all) */}
              <button
                type="button"
                onClick={() => handleNav('Profile')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  activeRoute === 'Profile' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                } ${isStaff ? 'col-span-2' : ''}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <User size={18} />
                </div>
                <span className="text-xs font-bold text-ink">Profile</span>
              </button>

              {/* Settings (Hide for Staff) */}
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => handleNav('Settings')}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    activeRoute === 'Settings' ? 'border-primary bg-primary-50' : 'border-line bg-bg hover:bg-slate-50'
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    <Settings size={18} />
                  </div>
                  <span className="text-xs font-bold text-ink">Settings</span>
                </button>
              )}
            </div>
            
            {/* Mobile Sign Out Button */}
            <div className="border-t border-line mt-4 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  setShowConfirmLogout(true)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger-bg text-danger font-bold py-2.5 text-xs border border-danger/10 cursor-pointer"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>

          </div>
        </div>
      )}

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
    </>
  )
}
