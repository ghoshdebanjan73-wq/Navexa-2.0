/**
 * customerStore.js
 * ONE Centralized reactive mock store with localStorage persistence for Navexa customer data.
 *
 * Storage Key: navexa_customers
 */

import { liveTrips } from './tripStore.js'
import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_customers'

/** Normalise phone string for duplicate comparison */
export function normalisePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\s+/g, '').replace(/^(\+91|0)/, '')
}

// Initial canonical seed customer records
const initialSeedCustomers = []

/** Load customers from localStorage or fallback to initialSeedCustomers */
function loadCustomersFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Error loading navexa_customers from storage:', err)
  }
  return []
}

/** Save customers to localStorage */
function persistCustomers() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveCustomers))
  } catch (err) {
    console.error('Error saving navexa_customers to storage:', err)
  }
}

/** @type {CustomerRecord[]} Central reactive array */
export const liveCustomers = loadCustomersFromStorage()

export async function syncCustomers(userId) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email || '',
        address: item.address || '',
        notes: item.notes || '',
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedBy: item.updated_by,
        updatedAt: item.updated_at,
      }))
      liveCustomers.length = 0
      liveCustomers.push(...mapped)
      persistCustomers()
      
      // Let listeners know
      const snap = [...liveCustomers]
      listeners.forEach(fn => fn(snap))
    } else {
      // Empty data in database, keep local store empty
      liveCustomers.length = 0
      persistCustomers()
      
      const snap = [...liveCustomers]
      listeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing customers:', err)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
const listeners = new Set()

export function subscribeCustomers(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistCustomers()
  const snap = [...liveCustomers]
  listeners.forEach(fn => fn(snap))
}

// ─── Queries & Helpers ────────────────────────────────────────────────────────

/** Find customer by phone number, optionally excluding a specific customer ID */
export function findByPhone(rawPhone, excludeId = null) {
  const needle = normalisePhone(rawPhone)
  if (!needle) return null
  return liveCustomers.find(c => c.id !== excludeId && normalisePhone(c.phone) === needle) || null
}

/** Find customer by ID */
export function getCustomerById(id) {
  return liveCustomers.find(c => c.id === id) || null
}

/** Find customer by Name */
export function getCustomerByName(name) {
  if (!name) return null
  return liveCustomers.find(c => c.name.toLowerCase() === name.toLowerCase()) || null
}

/** Get array of customer names for selectors */
export function getCustomerNames() {
  return liveCustomers.map(c => c.name)
}

/** Get initials for avatar display */
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ─── Customer Stats & Relationships ──────────────────────────────────────────

/** Calculate stats for a given customer from liveTrips */
export function getCustomerStats(customerNameOrId) {
  if (!customerNameOrId) {
    return { totalTrips: 0, upcomingTrips: 0, completedTrips: 0, totalTripValue: 0, lastTripDate: null, trips: [] }
  }
  const needle = customerNameOrId.toLowerCase()
  const customerTrips = liveTrips.filter(
    t => (t.customerId && t.customerId.toLowerCase() === needle) ||
         (t.customer && t.customer.toLowerCase() === needle)
  )

  const upcomingTrips = customerTrips.filter(t => t.status === 'Upcoming').length
  const completedTrips = customerTrips.filter(t => t.status === 'Completed').length
  const totalTripValue = customerTrips.reduce((sum, t) => sum + (t.fare || 0), 0)

  let lastTripDate = null
  if (customerTrips.length > 0) {
    const sorted = [...customerTrips].sort((a, b) => (b.tripDate || '').localeCompare(a.tripDate || ''))
    lastTripDate = sorted[0].tripDate || null
  }

  return {
    totalTrips: customerTrips.length,
    upcomingTrips,
    completedTrips,
    totalTripValue,
    lastTripDate,
    trips: customerTrips,
  }
}

/** Compute page summary metrics */
export function computeCustomerSummary() {
  const total = liveCustomers.length
  const uniqueUpcomingCustomers = new Set(
    liveTrips.filter(t => t.status === 'Upcoming').map(t => t.customer?.toLowerCase())
  )
  const customersWithUpcoming = liveCustomers.filter(c => uniqueUpcomingCustomers.has(c.name.toLowerCase())).length
  const newThisMonth = liveCustomers.filter(c => c._session || c.createdAt >= '2026-07-01').length

  const recent = liveCustomers.slice(0, 4).map(c => ({
    name:     c.name,
    phone:    c.phone,
    activity: c.notes || 'Customer profile active',
  }))

  return {
    total,
    newThisMonth,
    customersWithUpcoming,
    recent,
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Add a validated customer record */
export function addCustomer(record, userName = 'Banjo') {
  const newCustomer = {
    id:        `C-${Date.now()}`,
    name:      record.name.trim(),
    phone:     record.phone.trim(),
    email:     record.email?.trim() || '',
    address:   record.address?.trim() || '',
    notes:     record.notes?.trim() || '',
    createdBy: record.createdBy || 'U-01',
    createdAt: new Date().toISOString(),
    updatedBy: null,
    updatedAt: null,
    _session:  true,
  }
  
  liveCustomers.unshift(newCustomer)
  addActivity({
    id:          Date.now(),
    type:        'customer',
    text:        `Customer added — ${newCustomer.name}`,
    performedBy: userName,
    time:        'Just now',
  })
  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('customers')
        .insert({
          id: newCustomer.id,
          user_id: user.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
          address: newCustomer.address || null,
          notes: newCustomer.notes || null,
          created_at: newCustomer.createdAt,
          created_by: newCustomer.createdBy,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting customer into Supabase:', error)
        })
    }
  })

  return newCustomer
}

/** Edit an existing customer record */
export function editCustomer(id, updates, userName = 'Banjo') {
  const idx = liveCustomers.findIndex(c => c.id === id)
  if (idx === -1) return null

  const oldName = liveCustomers[idx].name
  const updatedCustomer = {
    ...liveCustomers[idx],
    name:      updates.name.trim(),
    phone:     updates.phone.trim(),
    email:     updates.email?.trim() || '',
    address:   updates.address?.trim() || '',
    notes:     updates.notes?.trim() || '',
    updatedBy: 'U-01',
    updatedAt: new Date().toISOString(),
  }

  liveCustomers[idx] = updatedCustomer

  // Update trip customer names where customerId or customer name matches
  if (oldName !== updatedCustomer.name) {
    liveTrips.forEach(t => {
      if (t.customerId === id || t.customer?.toLowerCase() === oldName.toLowerCase()) {
        t.customer = updatedCustomer.name
        t.customerId = id
      }
    })
  }

  addActivity({
    id:          Date.now(),
    type:        'customer',
    text:        `Customer updated — ${updatedCustomer.name}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase
    .from('customers')
    .update({
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email || null,
      address: updatedCustomer.address || null,
      notes: updatedCustomer.notes || null,
      updated_at: updatedCustomer.updatedAt,
      updated_by: updatedCustomer.updatedBy,
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('Error updating customer in Supabase:', error)
    })

  return updatedCustomer
}

/** Filter customers helper */
export function filterCustomers({ search = '', filterTab = 'All' }) {
  const q = search.toLowerCase()
  const upcomingSet = new Set(
    liveTrips.filter(t => t.status === 'Upcoming').map(t => t.customer?.toLowerCase())
  )

  return liveCustomers.filter(c => {
    if (filterTab === 'With Upcoming Trips' && !upcomingSet.has(c.name.toLowerCase())) {
      return false
    }
    if (filterTab === 'Recently Added' && !c._session && c.createdAt < '2026-07-20') {
      return false
    }
    if (q) {
      const haystack = [c.name, c.phone, c.email, c.address].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
