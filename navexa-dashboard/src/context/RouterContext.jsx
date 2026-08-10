import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ROUTE_PATHS = {
  SignIn:    '/signin',
  SignUp:    '/signup',
  Dashboard: '/',
  Trips:     '/trips',
  Invoices:  '/invoices',
  Finance:   '/finance',
  Reports:   '/reports',
  Notifications: '/notifications',
  Search:    '/search',
  Activity:  '/activity',
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
  '/invoices':  'Invoices',
  '/finance':   'Finance',
  '/reports':   'Reports',
  '/notifications': 'Notifications',
  '/search':    'Search',
  '/activity':  'Activity',
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
    if (hash === 'reports') return 'Reports'
    if (hash === 'notifications') return 'Notifications'
    if (hash === 'search') return 'Search'
    if (hash === 'activity' || hash === 'audit-logs') return 'Activity'
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
  if (pathname.endsWith('/reports')) return 'Reports'
  if (pathname.endsWith('/notifications')) return 'Notifications'
  if (pathname.endsWith('/search')) return 'Search'
  if (pathname.endsWith('/activity')) return 'Activity'
  if (pathname.endsWith('/invoices')) return 'Invoices'
  if (pathname.endsWith('/customers')) return 'Customers'
  if (pathname.endsWith('/vehicles')) return 'Vehicles'
  if (pathname.endsWith('/users')) return 'Users'
  if (pathname.endsWith('/profile')) return 'Profile'
  if (pathname.endsWith('/settings')) return 'Settings'
  if (pathname.endsWith('/company-profile')) return 'CompanyProfile'
  if (pathname.endsWith('/drivers')) return 'Drivers'

  return 'Dashboard'
}

/** Parse route parameters from URL search or hash for browser refresh & back/forward persistence */
export function getRouteParamsFromLocation() {
  if (typeof window === 'undefined') return {}
  const search = window.location.search || ''
  const hash = window.location.hash || ''
  
  const searchParams = new URLSearchParams(search)
  let hashQuery = ''
  if (hash.includes('?')) {
    hashQuery = hash.substring(hash.indexOf('?'))
  }
  const hashParams = new URLSearchParams(hashQuery)

  const filterVal = searchParams.get('filter') || hashParams.get('filter') || searchParams.get('statusFilter') || hashParams.get('statusFilter')
  
  const params = {}
  if (filterVal && (filterVal.toLowerCase() === 'needs-assignment' || filterVal === 'Needs Assignment')) {
    params.Trips = { statusFilter: 'Needs Assignment' }
  }
  return params
}

const RouterContext = createContext(null)

export function RouterProvider({ children }) {
  const [activeRoute, setActiveRoute] = useState(() => getRouteFromLocation())
  const [routeParams, setRouteParams] = useState(() => getRouteParamsFromLocation())

  // Update URL & document title
  const syncUrl = useCallback((routeId, params = {}, replace = false) => {
    if (typeof window === 'undefined') return
    const isFileProtocol = window.location.protocol === 'file:'
    const baseTarget = ROUTE_PATHS[routeId] || '/'
    const hasNeedsAssignment = params?.statusFilter === 'Needs Assignment' || routeParams?.[routeId]?.statusFilter === 'Needs Assignment'
    const queryString = hasNeedsAssignment ? '?filter=needs-assignment' : ''

    if (isFileProtocol) {
      const targetHash = `#/${routeId.toLowerCase()}${queryString}`
      if (window.location.hash !== targetHash) {
        if (replace) window.location.replace(targetHash)
        else window.location.hash = targetHash
      }
    } else {
      const fullPath = `${baseTarget}${queryString}`
      if (window.location.pathname + window.location.search !== fullPath) {
        if (replace) {
          window.history.replaceState({ route: routeId, params }, '', fullPath)
        } else {
          window.history.pushState({ route: routeId, params }, '', fullPath)
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
  }, [routeParams])

  // Public navigate function with optional params (e.g. { statusFilter: 'Needs Assignment' })
  const navigate = useCallback((routeId, params = {}, replace = false) => {
    if (typeof params === 'boolean') {
      replace = params
      params = {}
    }
    const newParams = params || {}
    setRouteParams(prev => ({
      ...prev,
      [routeId]: newParams,
    }))
    setActiveRoute(routeId)
    syncUrl(routeId, newParams, replace)
  }, [syncUrl])

  const clearRouteParams = useCallback((routeId) => {
    setRouteParams(prev => {
      const next = { ...prev }
      if (routeId) delete next[routeId]
      else return {}
      return next
    })
    if (typeof window !== 'undefined') {
      const targetPath = ROUTE_PATHS[routeId || activeRoute] || '/'
      const isFileProtocol = window.location.protocol === 'file:'
      if (isFileProtocol) {
        window.location.hash = `#/${(routeId || activeRoute).toLowerCase()}`
      } else {
        window.history.replaceState({ route: routeId || activeRoute }, '', targetPath)
      }
    }
  }, [activeRoute])

  // Sync on initial load & listen to popstate / hashchange (Browser Back/Forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const currentRoute = getRouteFromLocation()
      const currentParams = getRouteParamsFromLocation()
      setActiveRoute(currentRoute)
      if (currentParams.Trips) {
        setRouteParams(prev => ({ ...prev, ...currentParams }))
      }
      
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
    syncUrl(activeRoute, routeParams[activeRoute], true)

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [activeRoute, routeParams, syncUrl])

  return (
    <RouterContext.Provider value={{ activeRoute, routeParams, navigate, setRouteParams, clearRouteParams }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    return { activeRoute: 'Dashboard', routeParams: {}, navigate: () => {}, clearRouteParams: () => {} }
  }
  return context
}
