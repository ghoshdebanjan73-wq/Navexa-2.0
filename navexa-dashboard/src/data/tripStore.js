/**
 * tripStore.js
 * ONE centralized reactive store for ALL Navexa trip data with localStorage persistence.
 *
 * Storage Key: navexa_trips
 * Used by: Dashboard UpcomingTrips, Dashboard summary.trips,
 *          Trips page, Trip detail, Add Trip, Edit Trip.
 *
 * Independent data module — ZERO imports from customerStore to prevent circular dependencies.
 */

import { upcomingTrips as seedTrips } from './mockData.js'
import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_trips'

const SEED_CUSTOMER_IDS = {}

// Seed enriched trip records
const seedEnriched = []

/** Safe load trips from localStorage with fallback */
function loadTripsFromStorage() {
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
    console.error('Error loading navexa_trips from storage:', err)
  }
  return []
}

/** Safe save trips to localStorage */
function persistTrips() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveTrips))
  } catch (err) {
    console.error('Error saving navexa_trips to storage:', err)
  }
}

/** @type {TripRecord[]} Central reactive array */
export const liveTrips = loadTripsFromStorage()

export async function syncTrips(userId) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        customerId: item.customer_id,
        customer: item.customer,
        pickupLocation: item.pickup_location,
        destination: item.destination,
        tripDate: item.trip_date,
        tripTime: item.trip_time,
        vehicle: item.vehicle,
        vehicleId: item.vehicle_id,
        vehicleReg: item.vehicle_reg || '',
        fare: Number(item.fare) || 0,
        paymentStatus: item.payment_status,
        status: item.status,
        notes: item.notes || '',
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedBy: item.updated_by,
        updatedAt: item.updated_at,
      }))

      liveTrips.length = 0
      liveTrips.push(...mapped)
      persistTrips()

      const snap = [...liveTrips]
      listeners.forEach(fn => fn(snap))
    } else {
      // Empty database, keep local store empty
      liveTrips.length = 0
      persistTrips()

      const snap = [...liveTrips]
      listeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing trips:', err)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
const listeners = new Set()

export function subscribeTrips(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistTrips()
  const snap = [...liveTrips]
  listeners.forEach(fn => fn(snap))
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Add a new trip */
export function addTrip(record, userName = 'Banjo') {
  const newTrip = {
    id:             `TRP-${Date.now()}`,
    customerId:     record.customerId || SEED_CUSTOMER_IDS[record.customer] || '',
    customer:       record.customer || '',
    pickupLocation: record.pickupLocation || '',
    destination:    record.destination || '',
    tripDate:       record.tripDate || '',
    tripTime:       record.tripTime || '',
    vehicle:        record.vehicle || '',
    vehicleReg:     record.vehicleReg || '',
    vehicleId:      record.vehicleId || '',
    fare:           Number(record.fare) || 0,
    paymentStatus:  record.paymentStatus || 'Unpaid',
    status:         'Upcoming',
    notes:          record.notes || '',
    createdBy:      record.createdBy || 'U-01',
    createdAt:      new Date().toISOString(),
    updatedBy:      null,
    updatedAt:      null,
    _session:       true,
  }

  liveTrips.unshift(newTrip)

  addActivity({
    id:          Date.now(),
    type:        'trip',
    text:        `Trip added: ${record.pickupLocation} → ${record.destination} for ${record.customer}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('trips')
        .insert({
          id: newTrip.id,
          user_id: user.id,
          customer: newTrip.customer,
          customer_id: newTrip.customerId || null,
          pickup_location: newTrip.pickupLocation,
          destination: newTrip.destination,
          trip_date: newTrip.tripDate,
          trip_time: newTrip.tripTime,
          vehicle: newTrip.vehicle,
          vehicle_id: newTrip.vehicleId || null,
          vehicle_reg: newTrip.vehicleReg || null,
          fare: newTrip.fare,
          status: newTrip.status,
          payment_status: newTrip.paymentStatus,
          notes: newTrip.notes || null,
          created_at: newTrip.createdAt,
          created_by: newTrip.createdBy,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting trip into Supabase:', error)
        })
    }
  })

  return newTrip
}

/** Edit an existing trip by id */
export function editTrip(id, updates, userName = 'Banjo') {
  const idx = liveTrips.findIndex(t => t.id === id)
  if (idx === -1) return null

  liveTrips[idx] = {
    ...liveTrips[idx],
    ...updates,
    updatedBy:  'U-01',
    updatedAt:  new Date().toISOString(),
  }

  addActivity({
    id:          Date.now(),
    type:        'trip',
    text:        `Trip updated: ${liveTrips[idx].pickupLocation} → ${liveTrips[idx].destination}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase
    .from('trips')
    .update({
      customer: liveTrips[idx].customer,
      customer_id: liveTrips[idx].customerId || null,
      pickup_location: liveTrips[idx].pickupLocation,
      destination: liveTrips[idx].destination,
      trip_date: liveTrips[idx].tripDate,
      trip_time: liveTrips[idx].tripTime,
      vehicle: liveTrips[idx].vehicle,
      vehicle_id: liveTrips[idx].vehicleId || null,
      vehicle_reg: liveTrips[idx].vehicleReg || null,
      fare: liveTrips[idx].fare,
      status: liveTrips[idx].status,
      payment_status: liveTrips[idx].paymentStatus,
      notes: liveTrips[idx].notes || null,
      updated_at: liveTrips[idx].updatedAt,
      updated_by: liveTrips[idx].updatedBy,
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('Error updating trip in Supabase:', error)
    })

  return liveTrips[idx]
}

/** Update only trip status */
export function updateTripStatus(id, newStatus, userName = 'Banjo') {
  const idx = liveTrips.findIndex(t => t.id === id)
  if (idx === -1) return null

  liveTrips[idx] = {
    ...liveTrips[idx],
    status:    newStatus,
    updatedBy: 'U-01',
    updatedAt: new Date().toISOString(),
  }

  const actionVerb = {
    Ongoing:   'started',
    Completed: 'completed',
    Cancelled: 'cancelled',
    Upcoming:  'reset to Upcoming',
  }[newStatus] || 'updated'

  addActivity({
    id:          Date.now(),
    type:        'trip',
    text:        `Trip ${actionVerb}: ${liveTrips[idx].pickupLocation} → ${liveTrips[idx].destination}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase
    .from('trips')
    .update({
      status: newStatus,
      updated_at: liveTrips[idx].updatedAt,
      updated_by: liveTrips[idx].updatedBy,
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('Error updating trip status in Supabase:', error)
    })

  return liveTrips[idx]
}

/** Update trip payment status */
export function updatePaymentStatus(id, paymentStatus, userName = 'Banjo') {
  return editTrip(id, { paymentStatus }, userName)
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function getTripCounts() {
  const total     = liveTrips.length
  const upcoming  = liveTrips.filter(t => t.status === 'Upcoming').length
  const ongoing   = liveTrips.filter(t => t.status === 'Ongoing').length
  const completed = liveTrips.filter(t => t.status === 'Completed').length
  const cancelled = liveTrips.filter(t => t.status === 'Cancelled').length
  return { total, upcoming, ongoing, completed, cancelled }
}

/** Dashboard-compatible snapshot: only Upcoming trips */
export function getUpcomingForDashboard(limit = 5) {
  return liveTrips
    .filter(t => t.status === 'Upcoming')
    .slice(0, limit)
    .map(t => ({
      id:       t.id,
      customer: t.customer,
      route:    `${t.pickupLocation} → ${t.destination}`,
      dateTime: `${t.tripDate}, ${t.tripTime}`,
      vehicle:  t.vehicle,
      fare:     t.fare,
      payment:  t.paymentStatus,
      status:   t.status,
    }))
}

// ─── Search & filter ──────────────────────────────────────────────────────────

export function filterTrips({ search = '', status = 'All', vehicle = '', paymentStatus = '' }) {
  const q = search.toLowerCase()
  return liveTrips.filter(t => {
    if (status !== 'All' && t.status !== status) return false
    if (vehicle && t.vehicle !== vehicle) return false
    if (paymentStatus && t.paymentStatus !== paymentStatus) return false
    if (q) {
      const haystack = [
        t.customer, t.pickupLocation, t.destination, t.vehicle, t.vehicleReg
      ].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export const formatINR = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const TRIP_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled']
export const PAYMENT_STATUSES = ['Unpaid', 'Partial', 'Paid']

/** Valid next statuses given current status */
export function getNextStatuses(current) {
  const map = {
    Upcoming:  ['Ongoing', 'Cancelled'],
    Ongoing:   ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
  }
  return map[current] || []
}
