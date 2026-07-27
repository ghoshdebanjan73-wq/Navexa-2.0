import { useState } from 'react'
import {
  LayoutGrid,
  Route,
  Receipt,
  Users,
  Menu,
  Car,
  Shield,
  User,
  Settings,
  X,
  LogOut
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
  const isMoreActive = moreOpen || ['Vehicles', 'Users', 'Profile', 'Settings'].includes(activeRoute)

  return (
    <>
      {/* 📱 Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch justify-around border-t border-line bg-surface/95 px-1 backdrop-blur-md shadow-lg"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNav('Dashboard')}
          aria-label="Dashboard"
          className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeRoute === 'Dashboard' ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <LayoutGrid size={18} strokeWidth={activeRoute === 'Dashboard' ? 2.5 : 2} />
          <span>Dashboard</span>
        </button>

        {/* 2. Trips */}
        <button
          type="button"
          onClick={() => handleNav('Trips')}
          aria-label="Trips"
          className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
            activeRoute === 'Trips' ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Route size={18} strokeWidth={activeRoute === 'Trips' ? 2.5 : 2} />
          <span>Trips</span>
        </button>

        {/* 3. Finance / Vehicles for Staff */}
        {!isStaff ? (
          <button
            type="button"
            onClick={() => handleNav('Finance')}
            aria-label="Finance"
            className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeRoute === 'Finance' ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Receipt size={18} strokeWidth={activeRoute === 'Finance' ? 2.5 : 2} />
            <span>Finance</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleNav('Vehicles')}
            aria-label="Vehicles"
            className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeRoute === 'Vehicles' ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Car size={18} strokeWidth={activeRoute === 'Vehicles' ? 2.5 : 2} />
            <span>Vehicles</span>
          </button>
        )}

        {/* 4. Customers (Hide for Staff) */}
        {!isStaff && (
          <button
            type="button"
            onClick={() => handleNav('Customers')}
            aria-label="Customers"
            className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeRoute === 'Customers' ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <Users size={18} strokeWidth={activeRoute === 'Customers' ? 2.5 : 2} />
            <span>Customers</span>
          </button>
        )}

        {/* 5. More Drawer Trigger */}
        <button
          type="button"
          onClick={() => setMoreOpen(v => !v)}
          aria-label="More navigation"
          aria-expanded={moreOpen}
          className={`flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
            isMoreActive ? 'text-primary font-bold' : 'text-ink-soft hover:text-ink'
          }`}
        >
          <Menu size={18} strokeWidth={isMoreActive ? 2.5 : 2} />
          <span>More</span>
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
              {/* Vehicles (Hide in More for Staff because it is in main BottomNav bar) */}
              {!isStaff && (
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
              )}

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
