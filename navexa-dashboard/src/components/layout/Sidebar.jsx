import { useState } from 'react'
import {
  LayoutGrid,
  Route,
  Receipt,
  Users,
  Car,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react'
import { useUser } from '../../context/UserContext'

import { useRouter } from '../../context/RouterContext'

export default function Sidebar({ activeRoute: propActiveRoute, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, initials } = useUser()
  const { activeRoute: contextActiveRoute, navigate } = useRouter()

  const activeRoute = propActiveRoute || contextActiveRoute

  const isStaff = user?.role === 'Staff'

  const mainNav = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'Trips', label: 'Trips', icon: Route },
    ...(!isStaff ? [
      { id: 'Finance', label: 'Finance', icon: Receipt },
      { id: 'Customers', label: 'Customers', icon: Users }
    ] : []),
    { id: 'Vehicles', label: 'Vehicles', icon: Car },
  ]

  const managementNav = isStaff ? [] : [
    { id: 'Users', label: 'Users', icon: Shield },
    { id: 'CompanyProfile', label: 'Company Profile', icon: Building2 },
  ]

  const handleNavClick = (id) => {
    if (onNavigate) {
      onNavigate(id)
    } else {
      navigate(id)
    }
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-line bg-surface sticky top-0 h-screen shrink-0 transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Branding Section */}
      <div className="flex h-14 items-center justify-between border-b border-line px-3.5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
            <Route size={16} strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="text-base font-extrabold tracking-tight text-ink whitespace-nowrap">
              Navexa
            </span>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* MAIN SECTION */}
        <div>
          {!collapsed && (
            <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft/80">
              Main
            </p>
          )}
          <nav className="space-y-1">
            {mainNav.map(({ id, label, icon: Icon }) => {
              const isActive = activeRoute === id
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary font-bold'
                      : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
                  }`}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}

                  {collapsed && (
                    <div className="absolute left-full ml-2 hidden rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-md group-hover:block z-50 whitespace-nowrap">
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* MANAGEMENT SECTION */}
        {managementNav.length > 0 && (
          <div>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft/80">
                Management
              </p>
            )}
            <nav className="space-y-1">
              {managementNav.map(({ id, label, icon: Icon }) => {
                const isActive = activeRoute === id
                return (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary-50 text-primary font-bold'
                        : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}

                    {collapsed && (
                      <div className="absolute left-full ml-2 hidden rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-md group-hover:block z-50 whitespace-nowrap">
                        {label}
                      </div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* BOTTOM AREA (Settings & Centralized Profile Footer) */}
      <div className="border-t border-line p-2 space-y-1">
        {/* Settings Button */}
        {!isStaff && (
          <button
            onClick={() => handleNavClick('Settings')}
            className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
              activeRoute === 'Settings'
                ? 'bg-primary-50 text-primary font-bold'
                : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18} strokeWidth={activeRoute === 'Settings' ? 2.5 : 2} className="shrink-0" />
            {!collapsed && <span className="truncate">Settings</span>}

            {collapsed && (
              <div className="absolute left-full ml-2 hidden rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-md group-hover:block z-50 whitespace-nowrap">
                Settings
              </div>
            )}
          </button>
        )}

        {/* Dynamic Profile Footer Card */}
        <button
          onClick={() => handleNavClick('Profile')}
          className={`group relative flex w-full items-center gap-2.5 rounded-lg p-1.5 transition-colors ${
            activeRoute === 'Profile' ? 'bg-primary-50' : 'hover:bg-slate-100'
          }`}
          title={collapsed ? `Profile (${user?.name || 'User'})` : undefined}
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-xs">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-xs font-bold text-ink leading-tight">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] font-medium text-ink-soft">{user?.email || 'user@navexa.io'}</p>
            </div>
          )}

          {collapsed && (
            <div className="absolute left-full ml-2 hidden rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white shadow-md group-hover:block z-50 whitespace-nowrap">
              Profile
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
