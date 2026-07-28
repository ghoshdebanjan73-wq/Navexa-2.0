/**
 * tripStore.js
 * Centralized reactive store for Navexa trip data with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_trips
 */

import { addActivity } from './transactionStore.js'
import { liveDrivers } from './driverStore.js'
import { liveVehicles } from './vehicleStore.js'
import { logAuditEvent } from './auditStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_trips'

/** Status progression stages in canonical sequence */
export const TRIP_STAGES = [
  'Booked',
  'Confirmed',
  'Driver Assigned',
  'Vehicle Assigned',
  'Started',
  'Passenger Picked Up',
  'Completed',
]

export const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Partial']

export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0'
  return `₹${Number(val).toLocaleString('en-IN')}`
}

export function getUpcomingForDashboard() {
  return liveTrips
    .filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
    .slice(0, 5)
}

export function getTripCounts() {
  const total = liveTrips.length
  const upcoming = liveTrips.filter(t => t.status === 'Booked' || t.status === 'Confirmed' || t.status === 'Driver Assigned').length
  const ongoing = liveTrips.filter(t => t.status === 'Started' || t.status === 'Passenger Picked Up' || t.status === 'Vehicle Assigned').length
  const completed = liveTrips.filter(t => t.status === 'Completed').length

  return { total, upcoming, ongoing, completed }
}

/** Safe load trips from localStorage */
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

/** Cloud synchronization from Supabase */
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
        driverId: item.driver_id || null,
        driverName: item.driver_name || 'Unassigned',
        driverPhone: item.driver_phone || '',
        tripType: item.trip_type || 'One Way',
        estimatedDistance: item.estimated_distance ? Number(item.estimated_distance) : null,
        fare: Number(item.fare) || 0,
        actualFare: item.actual_fare ? Number(item.actual_fare) : null,
        paymentStatus: item.payment_status || 'Unpaid',
        status: item.status || 'Booked',
        timeline: Array.isArray(item.timeline) ? item.timeline : [],
        notes: item.notes || '',
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedBy: item.updated_by,
        updatedAt: item.updated_at,
      }))

      liveTrips.length = 0
      liveTrips.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing trips:', err)
  }
}

/** Check driver and vehicle conflicts before creating or updating a trip */
export function checkTripConflicts({ tripId = null, driverId, vehicleId, tripDate }) {
  const activeStatuses = ['Started', 'Passenger Picked Up', 'Ongoing']

  // 1. Check Driver availability
  if (driverId) {
    const driverObj = liveDrivers.find(d => d.id === driverId)
    if (driverObj && driverObj.status === 'Inactive') {
      return `Driver "${driverObj.fullName}" is marked Inactive.`
    }

    const driverActiveTrip = liveTrips.find(t => {
      if (t.id === tripId) return false
      if (t.driverId !== driverId) return false
      return activeStatuses.includes(t.status)
    })

    if (driverActiveTrip) {
      return `Driver is currently assigned to another active trip (${driverActiveTrip.id} - ${driverActiveTrip.customer}).`
    }
  }

  // 2. Check Vehicle availability
  if (vehicleId) {
    const vehicleObj = liveVehicles.find(v => v.id === vehicleId)
    if (vehicleObj && (vehicleObj.status === 'Inactive' || vehicleObj.status === 'Maintenance')) {
      return `Vehicle "${vehicleObj.name}" is ${vehicleObj.status}.`
    }

    const vehicleActiveTrip = liveTrips.find(t => {
      if (t.id === tripId) return false
      if (t.vehicleId !== vehicleId) return false
      return activeStatuses.includes(t.status)
    })

    if (vehicleActiveTrip) {
      return `Vehicle "${vehicleObj?.name || 'Selected Vehicle'}" is currently on another active trip (${vehicleActiveTrip.id} - ${vehicleActiveTrip.customer}).`
    }
  }

  return null
}

/** Helper to determine next logical stage in status workflow */
export function getNextTripStatus(currentStatus) {
  switch (currentStatus) {
    case 'Booked':
      return { next: 'Confirmed', label: 'Confirm Trip' }
    case 'Confirmed':
      return { next: 'Driver Assigned', label: 'Assign Driver' }
    case 'Driver Assigned':
      return { next: 'Vehicle Assigned', label: 'Assign Vehicle' }
    case 'Vehicle Assigned':
      return { next: 'Started', label: 'Start Trip' }
    case 'Started':
      return { next: 'Passenger Picked Up', label: 'Passenger Picked Up' }
    case 'Passenger Picked Up':
      return { next: 'Completed', label: 'Complete Trip' }
    default:
      return null
  }
}

/** Advanced Filter & Sort Trips */
export function filterAndSortTrips(tripsList, { search = '', status = 'All', driverId = 'All', vehicleId = 'All', tripType = 'All', tripDate = '', sortBy = 'Newest' }) {
  let result = [...tripsList]

  // Status Filter
  if (status !== 'All') {
    if (status === 'Active') {
      result = result.filter(t => ['Started', 'Passenger Picked Up', 'Ongoing', 'Vehicle Assigned'].includes(t.status))
    } else {
      result = result.filter(t => t.status === status)
    }
  }

  // Driver Filter
  if (driverId !== 'All') {
    result = result.filter(t => t.driverId === driverId)
  }

  // Vehicle Filter
  if (vehicleId !== 'All') {
    result = result.filter(t => t.vehicleId === vehicleId)
  }

  // Trip Type Filter
  if (tripType !== 'All') {
    result = result.filter(t => t.tripType === tripType)
  }

  // Date Filter
  if (tripDate) {
    result = result.filter(t => t.tripDate === tripDate)
  }

  // Search by Customer, Driver, Vehicle, Trip ID, Pickup, Drop
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(t => {
      const haystack = `${t.id} ${t.customer} ${t.driverName || ''} ${t.vehicle} ${t.vehicleReg || ''} ${t.pickupLocation} ${t.destination}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sort
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  } else if (sortBy === 'Trip Date') {
    result.sort((a, b) => new Date(b.tripDate || 0) - new Date(a.tripDate || 0))
  } else if (sortBy === 'Customer Name') {
    result.sort((a, b) => a.customer.localeCompare(b.customer))
  } else {
    // Newest
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addTrip(record, userId) {
  // Conflict Check
  const conflictErr = checkTripConflicts({
    driverId: record.driverId,
    vehicleId: record.vehicleId,
    tripDate: record.tripDate,
  })
  if (conflictErr) {
    throw new Error(conflictErr)
  }

  const id = `TRIP-${Date.now()}`
  const now = new Date().toISOString()

  // Initial timeline event
  const initialTimeline = [
    {
      status: record.status || 'Booked',
      label: 'Trip Created',
      timestamp: now,
      performedBy: 'Dispatcher',
    }
  ]

  if (record.driverId) {
    initialTimeline.push({
      status: 'Driver Assigned',
      label: `Driver Assigned — ${record.driverName || 'Driver'}`,
      timestamp: now,
      performedBy: 'Dispatcher',
    })
  }

  if (record.vehicleId) {
    initialTimeline.push({
      status: 'Vehicle Assigned',
      label: `Vehicle Assigned — ${record.vehicle || 'Vehicle'}`,
      timestamp: now,
      performedBy: 'Dispatcher',
    })
  }

  // Determine initial status stage based on assignments
  let initialStatus = record.status || 'Booked'
  if (initialStatus === 'Booked' && record.driverId && record.vehicleId) {
    initialStatus = 'Vehicle Assigned'
  } else if (initialStatus === 'Booked' && record.driverId) {
    initialStatus = 'Driver Assigned'
  }

  const newTrip = {
    id,
    customerId: record.customerId || null,
    customer: record.customer.trim(),
    pickupLocation: record.pickupLocation.trim(),
    destination: record.destination.trim(),
    tripDate: record.tripDate,
    tripTime: record.tripTime,
    vehicle: record.vehicle ? record.vehicle.trim() : 'Unassigned',
    vehicleId: record.vehicleId || null,
    vehicleReg: record.vehicleReg ? record.vehicleReg.trim().toUpperCase() : '',
    driverId: record.driverId || null,
    driverName: record.driverName ? record.driverName.trim() : 'Unassigned',
    driverPhone: record.driverPhone ? record.driverPhone.trim() : '',
    tripType: record.tripType || 'One Way',
    estimatedDistance: record.estimatedDistance ? Number(record.estimatedDistance) : null,
    fare: Number(record.fare) || 0,
    actualFare: record.actualFare ? Number(record.actualFare) : null,
    paymentStatus: record.paymentStatus || 'Unpaid',
    status: initialStatus,
    timeline: initialTimeline,
    notes: record.notes ? record.notes.trim() : '',
    createdBy: 'Dispatcher',
    createdAt: now,
    updatedAt: now,
  }

  liveTrips.unshift(newTrip)

  addActivity({
    id: Date.now(),
    type: 'trip',
    text: `Trip created — ${newTrip.customer} (${newTrip.pickupLocation} ➔ ${newTrip.destination})`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  logAuditEvent({
    action: 'CREATE',
    entityType: 'Trip',
    entityId: newTrip.id,
    entityLabel: `Trip #${newTrip.id}`,
    description: `Created trip #${newTrip.id} for ${newTrip.customer} (${newTrip.pickupLocation} ➔ ${newTrip.destination}).`,
    newValues: { customer: newTrip.customer, fare: newTrip.fare, status: newTrip.status },
  })

  notify()

  try {
    const { error } = await supabase.from('trips').insert({
      id: newTrip.id,
      user_id: userId,
      customer: newTrip.customer,
      customer_id: newTrip.customerId,
      pickup_location: newTrip.pickupLocation,
      destination: newTrip.destination,
      trip_date: newTrip.tripDate,
      trip_time: newTrip.tripTime,
      vehicle: newTrip.vehicle,
      vehicle_id: newTrip.vehicleId,
      vehicle_reg: newTrip.vehicleReg,
      driver_id: newTrip.driverId,
      driver_name: newTrip.driverName,
      driver_phone: newTrip.driverPhone,
      trip_type: newTrip.tripType,
      estimated_distance: newTrip.estimatedDistance,
      fare: newTrip.fare,
      actual_fare: newTrip.actualFare,
      status: newTrip.status,
      payment_status: newTrip.paymentStatus,
      timeline: newTrip.timeline,
      notes: newTrip.notes,
      created_at: newTrip.createdAt,
    })

    if (error) console.error('Error inserting trip into Supabase:', error)
  } catch (err) {
    console.error('Failed to save trip to cloud:', err)
  }

  return newTrip
}

export async function updateTripStatus(id, newStatus, actualFare = null) {
  const idx = liveTrips.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Trip not found')

  const now = new Date().toISOString()
  const trip = liveTrips[idx]

  const updatedTimeline = [
    ...(trip.timeline || []),
    {
      status: newStatus,
      label: `Trip ${newStatus}`,
      timestamp: now,
      performedBy: 'Dispatcher',
    }
  ]

  const updated = {
    ...trip,
    status: newStatus,
    actualFare: actualFare !== null ? Number(actualFare) : trip.actualFare,
    timeline: updatedTimeline,
    updatedAt: now,
  }

  liveTrips[idx] = updated

  addActivity({
    id: Date.now(),
    type: 'trip',
    text: `Trip ${id} status updated to ${newStatus}`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase
      .from('trips')
      .update({
        status: newStatus,
        actual_fare: updated.actualFare,
        timeline: updatedTimeline,
        updated_at: now,
      })
      .eq('id', id)

    if (error) console.error('Error updating trip status in Supabase:', error)
  } catch (err) {
    console.error('Failed to update trip status in cloud:', err)
  }

  return updated
}

export async function editTrip(id, updates) {
  const idx = liveTrips.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Trip not found')

  // Conflict Check
  const conflictErr = checkTripConflicts({
    tripId: id,
    driverId: updates.driverId !== undefined ? updates.driverId : liveTrips[idx].driverId,
    vehicleId: updates.vehicleId !== undefined ? updates.vehicleId : liveTrips[idx].vehicleId,
    tripDate: updates.tripDate || liveTrips[idx].tripDate,
  })
  if (conflictErr) {
    throw new Error(conflictErr)
  }

  const now = new Date().toISOString()
  const updated = {
    ...liveTrips[idx],
    ...updates,
    updatedAt: now,
  }

  liveTrips[idx] = updated

  addActivity({
    id: Date.now(),
    type: 'trip',
    text: `Trip ${id} details updated`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase
      .from('trips')
      .update({
        customer: updated.customer,
        customer_id: updated.customerId,
        pickup_location: updated.pickupLocation,
        destination: updated.destination,
        trip_date: updated.tripDate,
        trip_time: updated.tripTime,
        vehicle: updated.vehicle,
        vehicle_id: updated.vehicleId,
        vehicle_reg: updated.vehicleReg,
        driver_id: updated.driverId,
        driver_name: updated.driverName,
        driver_phone: updated.driverPhone,
        trip_type: updated.tripType,
        estimated_distance: updated.estimatedDistance,
        fare: updated.fare,
        actual_fare: updated.actualFare,
        status: updated.status,
        payment_status: updated.paymentStatus,
        notes: updated.notes,
        updated_at: now,
      })
      .eq('id', id)

    if (error) console.error('Error updating trip in Supabase:', error)
  } catch (err) {
    console.error('Failed to update trip in cloud:', err)
  }

  return updated
}

export async function deleteTrip(id) {
  const idx = liveTrips.findIndex(t => t.id === id)
  if (idx === -1) return false

  const removed = liveTrips[idx]
  liveTrips.splice(idx, 1)

  addActivity({
    id: Date.now(),
    type: 'trip',
    text: `Trip cancelled/removed — ${removed.id} (${removed.customer})`,
    performedBy: 'Dispatcher',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) console.error('Error deleting trip from Supabase:', error)
  } catch (err) {
    console.error('Failed to delete trip from cloud:', err)
  }

  return true
}
