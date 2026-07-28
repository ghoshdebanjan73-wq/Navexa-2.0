import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ROUTE_PATHS = {
  SignIn:    '/signin',
  SignUp:    '/signup',
  Dashboard: '/',
  Trips:     '/trips',
  Finance:   '/finance',
  Customers: '/customers',
  Vehicles:  '/vehicles',
  Users:     '/users',
  Profile:   '/profile',
  Settings:  '/settings',
  CompanyProfile: '/company-profile',
  Drivers:   '/drivers',
}

const PATH_TO_ROUTE = {
  '/signin':    'SignIn',
  '/signup':    'SignUp',
  '/':          'Dashboard',
  '/dashboard': 'Dashboard',
  '/trips':     'Trips',
  '/finance':   'Finance',
  '/customers': 'Customers',
  '/vehicles':  'Vehicles',
  '/users':     'Users',
  '/profile':   'Profile',
  '/settings':  'Settings',
  '/company-profile': 'CompanyProfile',
  '/drivers':   'Drivers',
}

/** Get route ID from window.location.pathname or hash */
export function getRouteFromLocation() {
  if (typeof window === 'undefined') return 'Dashboard'
  
  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase()

  // Match Hash first if present
  if (hash) {
    if (hash === 'signin') return 'SignIn'
    if (hash === 'signup') return 'SignUp'
    if (hash === 'trips') return 'Trips'
    if (hash === 'finance') return 'Finance'
    if (hash === 'customers') return 'Customers'
    if (hash === 'vehicles') return 'Vehicles'
    if (hash === 'users') return 'Users'
    if (hash === 'profile') return 'Profile'
    if (hash === 'settings') return 'Settings'
    if (hash === 'companyprofile' || hash === 'company-profile') return 'CompanyProfile'
    if (hash === 'drivers') return 'Drivers'
    if (hash === 'dashboard' || hash === '') return 'Dashboard'
  }

  // Match Pathname
  if (PATH_TO_ROUTE[pathname]) {
    return PATH_TO_ROUTE[pathname]
  }

  // Check path endsWith for Vite singlefile / nested routes
  if (pathname.endsWith('/signin')) return 'SignIn'
  if (pathname.endsWith('/signup')) return 'SignUp'
  if (pathname.endsWith('/trips')) return 'Trips'
  if (pathname.endsWith('/finance')) return 'Finance'
  if (pathname.endsWith('/customers')) return 'Customers'
  if (pathname.endsWith('/vehicles')) return 'Vehicles'
  if (pathname.endsWith('/users')) return 'Users'
  if (pathname.endsWith('/profile')) return 'Profile'
  if (pathname.endsWith('/settings')) return 'Settings'
  if (pathname.endsWith('/company-profile')) return 'CompanyProfile'
  if (pathname.endsWith('/drivers')) return 'Drivers'

  return 'Dashboard'
}

const RouterContext = createContext(null)

export function RouterProvider({ children }) {
  const [activeRoute, setActiveRoute] = useState(() => getRouteFromLocation())

  // Update URL & document title
  const syncUrl = useCallback((routeId, replace = false) => {
    if (typeof window === 'undefined') return
    const targetPath = ROUTE_PATHS[routeId] || '/'
    const isFileProtocol = window.location.protocol === 'file:'

    if (isFileProtocol) {
      const targetHash = `#/${routeId.toLowerCase()}`
      if (window.location.hash !== targetHash) {
        if (replace) window.location.replace(targetHash)
        else window.location.hash = targetHash
      }
    } else {
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ route: routeId }, '', targetPath)
        } else {
          window.history.pushState({ route: routeId }, '', targetPath)
        }
      }
    }

    const getTitleForRoute = (rId) => {
      if (rId === 'SignIn') return 'Navexa — Sign In'
      if (rId === 'SignUp') return 'Navexa — Sign Up'
      if (rId === 'CompanyProfile') return 'Navexa — Company Profile'
      if (rId === 'Drivers') return 'Navexa — Drivers'
      if (rId === 'Dashboard') return 'Navexa — Dashboard'
      return `Navexa — ${rId}`
    }

    document.title = getTitleForRoute(routeId)
  }, [])

  // Public navigate function
  const navigate = useCallback((routeId, replace = false) => {
    setActiveRoute(routeId)
    syncUrl(routeId, replace)
  }, [syncUrl])

  // Sync on initial load & listen to popstate / hashchange (Browser Back/Forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const currentRoute = getRouteFromLocation()
      setActiveRoute(currentRoute)
      
      const getTitleForRoute = (rId) => {
        if (rId === 'SignIn') return 'Navexa — Sign In'
        if (rId === 'SignUp') return 'Navexa — Sign Up'
        if (rId === 'CompanyProfile') return 'Navexa — Company Profile'
        if (rId === 'Drivers') return 'Navexa — Drivers'
        if (rId === 'Dashboard') return 'Navexa — Dashboard'
        return `Navexa — ${rId}`
      }
      document.title = getTitleForRoute(currentRoute)
    }

    // Replace current state so initial page has valid history entry
    syncUrl(activeRoute, true)

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [activeRoute, syncUrl])

  return (
    <RouterContext.Provider value={{ activeRoute, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    return { activeRoute: 'Dashboard', navigate: () => {} }
  }
  return context
}
