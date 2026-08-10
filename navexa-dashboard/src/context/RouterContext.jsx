import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

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

/** Extract just the path segment from a hash string (strips query params) */
function getHashPath(hash) {
  // hash looks like: "#/trips?filter=needs-assignment" or "#/trips"
  // strip leading #/ or #
  const stripped = hash.replace(/^#\/?/, '')
  // strip query string
  const qIndex = stripped.indexOf('?')
  return qIndex >= 0 ? stripped.substring(0, qIndex) : stripped
}

/** Get route ID from window.location.pathname or hash */
export function getRouteFromLocation() {
  if (typeof window === 'undefined') return 'Dashboard'

  const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'
  const rawHash = window.location.hash
  const hashPath = getHashPath(rawHash).toLowerCase()

  // Match Hash path first
  if (hashPath) {
    if (hashPath === 'signin') return 'SignIn'
    if (hashPath === 'signup') return 'SignUp'
    if (hashPath === 'trips') return 'Trips'
    if (hashPath === 'finance') return 'Finance'
    if (hashPath === 'reports') return 'Reports'
    if (hashPath === 'notifications') return 'Notifications'
    if (hashPath === 'search') return 'Search'
    if (hashPath === 'activity' || hashPath === 'audit-logs') return 'Activity'
    if (hashPath === 'customers') return 'Customers'
    if (hashPath === 'vehicles') return 'Vehicles'
    if (hashPath === 'users') return 'Users'
    if (hashPath === 'profile') return 'Profile'
    if (hashPath === 'settings') return 'Settings'
    if (hashPath === 'companyprofile' || hashPath === 'company-profile') return 'CompanyProfile'
    if (hashPath === 'drivers') return 'Drivers'
    if (hashPath === 'dashboard' || hashPath === '') return 'Dashboard'
    if (hashPath === 'invoices') return 'Invoices'
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

/** Parse route parameters (filter=needs-assignment) from the current URL */
export function getRouteParamsFromLocation() {
  if (typeof window === 'undefined') return {}

  // Support both search params (/trips?filter=...) and hash params (#/trips?filter=...)
  const rawSearch = window.location.search || ''
  const rawHash = window.location.hash || ''

  let filterVal = null

  // Check search params first
  if (rawSearch) {
    const sp = new URLSearchParams(rawSearch)
    filterVal = sp.get('filter') || sp.get('statusFilter')
  }

  // If not found, check hash query params (e.g. #/trips?filter=needs-assignment)
  if (!filterVal && rawHash.includes('?')) {
    const hashQuery = rawHash.substring(rawHash.indexOf('?'))
    const hp = new URLSearchParams(hashQuery)
    filterVal = hp.get('filter') || hp.get('statusFilter')
  }

  const params = {}
  if (filterVal && (filterVal.toLowerCase() === 'needs-assignment' || filterVal === 'Needs Assignment')) {
    params.Trips = { statusFilter: 'Needs Assignment' }
  }
  return params
}

/** Build the URL string to use for a given route + params */
function buildUrl(routeId, params) {
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:'
  const basePath = ROUTE_PATHS[routeId] || '/'
  const needsAssignment = params?.statusFilter === 'Needs Assignment'
  const query = needsAssignment ? '?filter=needs-assignment' : ''

  if (isFileProtocol) {
    return `#/${routeId.toLowerCase()}${query}`
  }
  return `${basePath}${query}`
}

function getTitle(routeId) {
  if (routeId === 'SignIn') return 'Navexa — Sign In'
  if (routeId === 'SignUp') return 'Navexa — Sign Up'
  if (routeId === 'CompanyProfile') return 'Navexa — Company Profile'
  if (routeId === 'Drivers') return 'Navexa — Drivers'
  if (routeId === 'Dashboard') return 'Navexa — Dashboard'
  return `Navexa — ${routeId}`
}

const RouterContext = createContext(null)

export function RouterProvider({ children }) {
  const [activeRoute, setActiveRoute] = useState(() => getRouteFromLocation())
  // routeParams is keyed by routeId, e.g. { Trips: { statusFilter: 'Needs Assignment' } }
  const [routeParams, setRouteParams] = useState(() => getRouteParamsFromLocation())

  // Use a ref so syncUrl always reads fresh routeParams without being recreated on every param change
  const routeParamsRef = useRef(routeParams)
  useEffect(() => { routeParamsRef.current = routeParams }, [routeParams])

  const activeRouteRef = useRef(activeRoute)
  useEffect(() => { activeRouteRef.current = activeRoute }, [activeRoute])

  /** Push/replace a URL for a given route + params */
  const syncUrl = useCallback((routeId, params, replace = false) => {
    if (typeof window === 'undefined') return
    const isFileProtocol = window.location.protocol === 'file:'
    const url = buildUrl(routeId, params)

    if (isFileProtocol) {
      if (window.location.hash !== url) {
        if (replace) window.location.replace(url)
        else window.location.hash = url
      }
    } else {
      const current = window.location.pathname + window.location.search
      if (current !== url) {
        if (replace) {
          window.history.replaceState({ route: routeId, params }, '', url)
        } else {
          window.history.pushState({ route: routeId, params }, '', url)
        }
      }
    }

    document.title = getTitle(routeId)
  }, []) // no dependencies — reads params directly from argument, never from closure

  /** Navigate to a route with optional params */
  const navigate = useCallback((routeId, params = {}, replace = false) => {
    if (typeof params === 'boolean') {
      replace = params
      params = {}
    }
    const newParams = params || {}
    setRouteParams(prev => ({ ...prev, [routeId]: newParams }))
    setActiveRoute(routeId)
    // Pass params directly — avoids stale-closure reading old routeParams
    syncUrl(routeId, newParams, replace)
  }, [syncUrl])

  /** Clear params for a route (e.g. when user clicks "Clear Filter") */
  const clearRouteParams = useCallback((routeId) => {
    const targetRoute = routeId || activeRouteRef.current
    setRouteParams(prev => {
      const next = { ...prev }
      delete next[targetRoute]
      return next
    })
    // Update URL to clean path without query string
    syncUrl(targetRoute, {}, true)
  }, [syncUrl])

  // Sync URL on initial mount and listen for browser back/forward
  useEffect(() => {
    // Replace initial history entry with a valid state
    syncUrl(activeRoute, routeParams[activeRoute] || {}, true)

    const handleLocationChange = () => {
      const currentRoute = getRouteFromLocation()
      const currentParams = getRouteParamsFromLocation()
      setActiveRoute(currentRoute)
      // Merge any filter params decoded from the URL (handles browser back/forward + refresh)
      if (Object.keys(currentParams).length > 0) {
        setRouteParams(prev => ({ ...prev, ...currentParams }))
      } else if (currentRoute === 'Trips') {
        // Navigated to /trips without filter param → clear the Trips filter
        setRouteParams(prev => {
          const next = { ...prev }
          delete next.Trips
          return next
        })
      }
      document.title = getTitle(currentRoute)
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount only

  return (
    <RouterContext.Provider value={{ activeRoute, routeParams, navigate, setRouteParams, clearRouteParams }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    return { activeRoute: 'Dashboard', routeParams: {}, navigate: () => {}, clearRouteParams: () => {}, setRouteParams: () => {} }
  }
  return context
}
