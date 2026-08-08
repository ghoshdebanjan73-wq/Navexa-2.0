/**
 * customerStore.js
 * Centralized reactive store for Navexa customer CRM with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_customers
 */

import { liveTrips } from './tripStore.js'
import { liveInvoices } from './invoiceStore.js'
import { livePayments } from './paymentStore.js'
import { addActivity } from './transactionStore.js'
import { logAuditEvent } from './auditStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_customers'

/** Normalise phone string for duplicate comparison */
export function normalisePhone(raw) {
  if (!raw) return ''
  return raw.replace(/\s+/g, '').replace(/^(\+91|0)/, '')
}

/** Safe load customers from localStorage */
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

/** Safe save customers to localStorage */
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

/** Cloud synchronization from Supabase */
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
        companyName: item.company_name || '',
        preferredContactMethod: item.preferred_contact_method || 'Phone',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        country: item.country || '',
        postalCode: item.postal_code || '',
        status: item.status || 'Active',
        notes: item.notes || '',
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedBy: item.updated_by,
        updatedAt: item.updated_at,
      }))

      liveCustomers.length = 0
      liveCustomers.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing customers:', err)
  }
}

/** Query helpers */
export function getCustomerNames() {
  return liveCustomers.map(c => c.name)
}

export function getCustomerByName(nameStr) {
  if (!nameStr) return null
  return liveCustomers.find(c => c.name.toLowerCase() === nameStr.toLowerCase()) || null
}

export function findByPhone(phoneStr) {
  const norm = normalisePhone(phoneStr)
  if (!norm) return null
  return liveCustomers.find(c => normalisePhone(c.phone) === norm) || null
}

export function getInitials(name = '') {
  if (!name) return 'C'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

/**
 * Customer 360° Profile Stats & Analytics
 */
export function getCustomer360Stats(customerName, customerId = null) {
  const customerTrips = liveTrips.filter(t => {
    if (customerId && t.customerId === customerId) return true
    if (customerName && t.customer?.toLowerCase() === customerName.toLowerCase()) return true
    return false
  })

  const totalTrips = customerTrips.length
  const completedTripsList = customerTrips.filter(t => t.status === 'Completed')
  const completedTrips = completedTripsList.length
  const cancelledTrips = customerTrips.filter(t => t.status === 'Cancelled').length
  const upcomingTrips = customerTrips.filter(t => ['Booked', 'Confirmed', 'Driver Assigned', 'Vehicle Assigned', 'Started', 'Passenger Picked Up'].includes(t.status)).length

  // Revenue & Fare
  const lifetimeRevenue = completedTripsList.reduce((sum, t) => sum + (t.actualFare || t.fare || 0), 0)
  const totalDistance = completedTripsList.reduce((sum, t) => sum + (t.estimatedDistance || 0), 0)
  const avgTripValue = completedTrips > 0 ? Math.round(lifetimeRevenue / completedTrips) : 0

  // Payment & Invoice Stats
  const customerInvoices = liveInvoices.filter(inv => {
    if (customerId && inv.customerId === customerId) return true
    if (customerName && inv.customerName?.toLowerCase() === customerName.toLowerCase()) return true
    return false
  })

  const customerPayments = livePayments.filter(p => {
    if (customerId && p.customerId === customerId) return true
    if (customerInvoices.some(inv => inv.id === p.invoiceId)) return true
    return false
  }).sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))

  const totalInvoiceAmount = customerInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0)
  const totalPaid = customerInvoices.length > 0 
    ? customerInvoices.reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0)
    : customerTrips.filter(t => t.paymentStatus === 'Paid').reduce((sum, t) => sum + (t.actualFare || t.fare || 0), 0)

  const pendingAmount = customerInvoices.length > 0
    ? customerInvoices.filter(inv => inv.paymentStatus !== 'Cancelled').reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0)
    : customerTrips.filter(t => t.paymentStatus !== 'Paid' && t.status !== 'Cancelled').reduce((sum, t) => sum + (t.actualFare || t.fare || 0), 0)

  const paymentProgress = totalInvoiceAmount > 0 
    ? Math.min(100, Math.round((totalPaid / totalInvoiceAmount) * 100))
    : (totalPaid > 0 ? 100 : 0)

  // Last trip & payment date
  const sortedByDate = [...customerTrips].sort((a, b) => new Date(b.createdAt || b.tripDate) - new Date(a.createdAt || a.tripDate))
  const lastTrip = sortedByDate[0] || null

  // Favorite Locations Analysis
  const pickupCounts = {}
  const dropCounts = {}
  customerTrips.forEach(t => {
    if (t.pickupLocation) {
      pickupCounts[t.pickupLocation] = (pickupCounts[t.pickupLocation] || 0) + 1
    }
    if (t.destination) {
      dropCounts[t.destination] = (dropCounts[t.destination] || 0) + 1
    }
  })

  const topPickup = Object.entries(pickupCounts).sort((a, b) => b[1] - a[1])[0]
  const topDrop = Object.entries(dropCounts).sort((a, b) => b[1] - a[1])[0]

  const favoritePickup = topPickup ? `${topPickup[0]} (${topPickup[1]} trip${topPickup[1] > 1 ? 's' : ''})` : 'None logged yet'
  const favoriteDrop = topDrop ? `${topDrop[0]} (${topDrop[1]} trip${topDrop[1] > 1 ? 's' : ''})` : 'None logged yet'

  return {
    customerTrips,
    customerInvoices,
    customerPayments,
    totalTrips,
    completedTrips,
    cancelledTrips,
    upcomingTrips,
    totalDistance,
    lifetimeRevenue,
    avgTripValue,
    totalPaid,
    pendingAmount,
    totalInvoiceAmount,
    paymentProgress,
    lastTrip,
    favoritePickup,
    favoriteDrop,
  }
}

/** Legacy support helper */
export function getCustomerStats(customerName) {
  const stats = getCustomer360Stats(customerName)
  return {
    totalTrips: stats.totalTrips,
    completedTrips: stats.completedTrips,
    upcomingTrips: stats.upcomingTrips,
    lifetimeRevenue: stats.lifetimeRevenue,
    lastTripDate: stats.lastTrip ? stats.lastTrip.tripDate : null,
  }
}

export function computeCustomerSummary() {
  const total = liveCustomers.length
  const active = liveCustomers.filter(c => c.status === 'Active').length
  const inactive = liveCustomers.filter(c => c.status === 'Inactive').length
  const recent = liveCustomers.slice(0, 3).map(c => ({
    name: c.name,
    phone: c.phone,
    activity: c.companyName || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Customer'),
  }))
  return { total, active, inactive, recent }
}

/** Advanced Filter & Sort Customers */
export function filterAndSortCustomers(customersList, { search = '', statusTab = 'All', filterType = 'All', sortBy = 'Newest' }) {
  let result = customersList.map(c => {
    const stats = getCustomer360Stats(c.name, c.id)
    return {
      ...c,
      stats,
    }
  })

  // Status Filter
  if (statusTab !== 'All') {
    result = result.filter(c => c.status === statusTab)
  }

  // Filter Type: Pending Payments / Upcoming Trips
  if (filterType === 'Pending Payments') {
    result = result.filter(c => c.stats.pendingAmount > 0)
  } else if (filterType === 'Upcoming Trips') {
    result = result.filter(c => c.stats.upcomingTrips > 0)
  }

  // Instant Search: Name, Phone, Email, Business Name
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(c => {
      const haystack = `${c.name} ${c.phone} ${c.email || ''} ${c.companyName || ''} ${c.address || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sorting
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  } else if (sortBy === 'Name A-Z' || sortBy === 'Customer Name') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === 'Name Z-A') {
    result.sort((a, b) => b.name.localeCompare(a.name))
  } else if (sortBy === 'Highest Revenue') {
    result.sort((a, b) => b.stats.lifetimeRevenue - a.stats.lifetimeRevenue)
  } else if (sortBy === 'Highest Outstanding') {
    result.sort((a, b) => b.stats.pendingAmount - a.stats.pendingAmount)
  } else if (sortBy === 'Most Trips') {
    result.sort((a, b) => b.stats.totalTrips - a.stats.totalTrips)
  } else {
    // Newest
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addCustomer(record, userId) {
  const normPhone = normalisePhone(record.phone)
  const isDuplicate = liveCustomers.some(c => normalisePhone(c.phone) === normPhone)
  if (isDuplicate) {
    throw new Error(`Customer with phone number "${record.phone}" already exists.`)
  }

  const id = `CUST-${Date.now()}`
  const now = new Date().toISOString()

  const newCustomer = {
    id,
    name: record.name.trim(),
    phone: record.phone.trim(),
    email: record.email ? record.email.trim() : '',
    companyName: record.companyName ? record.companyName.trim() : '',
    preferredContactMethod: record.preferredContactMethod || 'Phone',
    address: record.address ? record.address.trim() : '',
    city: record.city ? record.city.trim() : '',
    state: record.state ? record.state.trim() : '',
    country: record.country ? record.country.trim() : '',
    postalCode: record.postalCode ? record.postalCode.trim() : '',
    status: record.status || 'Active',
    notes: record.notes ? record.notes.trim() : '',
    createdBy: 'Dispatcher',
    createdAt: now,
    updatedAt: now,
  }

  liveCustomers.unshift(newCustomer)

  addActivity({
    id: Date.now(),
    type: 'customer',
    text: `Customer profile created — ${newCustomer.name} (${newCustomer.phone})`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  logAuditEvent({
    action: 'CREATE',
    entityType: 'Customer',
    entityId: newCustomer.id,
    entityLabel: newCustomer.name,
    description: `Created customer profile for ${newCustomer.name} (${newCustomer.phone}).`,
    newValues: { name: newCustomer.name, phone: newCustomer.phone, company: newCustomer.companyName },
  })

  notify()

  try {
    const { error } = await supabase.from('customers').insert({
      id: newCustomer.id,
      user_id: userId,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email || null,
      company_name: newCustomer.companyName || null,
      preferred_contact_method: newCustomer.preferredContactMethod,
      address: newCustomer.address || null,
      city: newCustomer.city || null,
      state: newCustomer.state || null,
      country: newCustomer.country || null,
      postal_code: newCustomer.postalCode || null,
      status: newCustomer.status,
      notes: newCustomer.notes || null,
      created_at: newCustomer.createdAt,
    })

    if (error) console.error('Error inserting customer into Supabase:', error)
  } catch (err) {
    console.error('Failed to save customer to cloud:', err)
  }

  return newCustomer
}

export async function editCustomer(id, updates) {
  const idx = liveCustomers.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Customer not found')

  if (updates.phone) {
    const normPhone = normalisePhone(updates.phone)
    const isDuplicate = liveCustomers.some(c => c.id !== id && normalisePhone(c.phone) === normPhone)
    if (isDuplicate) {
      throw new Error(`Phone number "${updates.phone}" is already registered to another customer.`)
    }
  }

  const now = new Date().toISOString()
  const updated = {
    ...liveCustomers[idx],
    ...updates,
    updatedAt: now,
  }

  liveCustomers[idx] = updated

  addActivity({
    id: Date.now(),
    type: 'customer',
    text: `Customer profile updated — ${updated.name}`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase
      .from('customers')
      .update({
        name: updated.name,
        phone: updated.phone,
        email: updated.email || null,
        company_name: updated.companyName || null,
        preferred_contact_method: updated.preferredContactMethod,
        address: updated.address || null,
        city: updated.city || null,
        state: updated.state || null,
        country: updated.country || null,
        postal_code: updated.postalCode || null,
        status: updated.status,
        notes: updated.notes || null,
        updated_at: now,
      })
      .eq('id', id)

    if (error) console.error('Error updating customer in Supabase:', error)
  } catch (err) {
    console.error('Failed to update customer in cloud:', err)
  }

  return updated
}

export async function deleteCustomer(id) {
  const idx = liveCustomers.findIndex(c => c.id === id)
  if (idx === -1) return false

  const removed = liveCustomers[idx]
  liveCustomers.splice(idx, 1)

  addActivity({
    id: Date.now(),
    type: 'customer',
    text: `Customer deleted — ${removed.name}`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) console.error('Error deleting customer from Supabase:', error)
  } catch (err) {
    console.error('Failed to delete customer from cloud:', err)
  }

  return true
}
