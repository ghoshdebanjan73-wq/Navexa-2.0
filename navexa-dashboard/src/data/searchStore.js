/**
 * searchStore.js
 * Multi-module Global Search Engine for Navexa.
 * Searches real-time data stores for Customers, Trips, Drivers, Vehicles, and Invoices.
 * Enforces role security for Staff users.
 */

import { liveCustomers } from './customerStore'
import { liveTrips } from './tripStore'
import { liveDrivers } from './driverStore'
import { liveVehicles } from './vehicleStore'
import { liveInvoices } from './invoiceStore'

const RECENT_SEARCHES_KEY = 'navexa_recent_searches'

/**
 * Get up to 5 recent search queries
 */
export function getRecentSearches() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Error reading recent searches:', err)
  }
  return []
}

/**
 * Add a query to recent searches
 */
export function addRecentSearch(query) {
  if (!query || query.trim().length < 2) return
  try {
    const term = query.trim()
    let list = getRecentSearches()
    list = list.filter(item => item.toLowerCase() !== term.toLowerCase())
    list.unshift(term)
    if (list.length > 5) list = list.slice(0, 5)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list))
  } catch (err) {
    console.error('Error saving recent search:', err)
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (err) {
    console.error('Error clearing recent searches:', err)
  }
}

/**
 * Main Global Search Function
 */
export function performGlobalSearch({ query = '', role = 'Admin', limitPerCategory = 5 }) {
  const q = (query || '').trim().toLowerCase()

  if (q.length < 2) {
    return {
      customers: [],
      trips: [],
      drivers: [],
      vehicles: [],
      invoices: [],
      totalCount: 0,
    }
  }

  const isMatch = (str) => {
    if (!str) return false
    return String(str).toLowerCase().includes(q)
  }

  // 1. CUSTOMERS SEARCH
  const matchedCustomers = liveCustomers.filter(c =>
    isMatch(c.name) || isMatch(c.phone) || isMatch(c.email) || isMatch(c.companyName)
  )

  // 2. TRIPS SEARCH
  const matchedTrips = liveTrips.filter(t =>
    isMatch(t.id) ||
    isMatch(t.customer) ||
    isMatch(t.pickupLocation) ||
    isMatch(t.destination) ||
    isMatch(t.driverName) ||
    isMatch(t.vehicle)
  )

  // 3. DRIVERS SEARCH
  const matchedDrivers = liveDrivers.filter(d =>
    isMatch(d.fullName) || isMatch(d.phone) || isMatch(d.licenseNumber)
  )

  // 4. VEHICLES SEARCH
  const matchedVehicles = liveVehicles.filter(v =>
    isMatch(v.name) || isMatch(v.registration) || isMatch(v.brand) || isMatch(v.model)
  )

  // 5. INVOICES SEARCH (Restricted for Staff role)
  const isStaff = role === 'Staff'
  const matchedInvoices = isStaff
    ? []
    : liveInvoices.filter(i =>
        isMatch(i.invoiceNumber) || isMatch(i.customerName) || isMatch(i.tripId)
      )

  const totalCount =
    matchedCustomers.length +
    matchedTrips.length +
    matchedDrivers.length +
    matchedVehicles.length +
    matchedInvoices.length

  return {
    customers: matchedCustomers.slice(0, limitPerCategory),
    trips: matchedTrips.slice(0, limitPerCategory),
    drivers: matchedDrivers.slice(0, limitPerCategory),
    vehicles: matchedVehicles.slice(0, limitPerCategory),
    invoices: matchedInvoices.slice(0, limitPerCategory),
    totalCustomersCount: matchedCustomers.length,
    totalTripsCount: matchedTrips.length,
    totalDriversCount: matchedDrivers.length,
    totalVehiclesCount: matchedVehicles.length,
    totalInvoicesCount: matchedInvoices.length,
    totalCount,
  }
}
