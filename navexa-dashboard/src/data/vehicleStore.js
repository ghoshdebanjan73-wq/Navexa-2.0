/**
 * vehicleStore.js
 * Centralized reactive store for Navexa vehicle data with localStorage persistence.
 *
 * Storage Key: navexa_vehicles
 */

import { vehicles as seedVehicles } from './mockData.js'
import { liveTrips } from './tripStore.js'
import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_vehicles'

// Initial canonical seed vehicles
const initialSeedVehicles = []

/** Safe load vehicles from localStorage */
function loadVehiclesFromStorage() {
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
    console.error('Error loading navexa_vehicles from storage:', err)
  }
  return []
}

/** Safe save vehicles to localStorage */
function persistVehicles() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveVehicles))
  } catch (err) {
    console.error('Error saving navexa_vehicles to storage:', err)
  }
}

/** @type {VehicleRecord[]} Central reactive array */
export const liveVehicles = loadVehiclesFromStorage()

export async function syncVehicles(userId) {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        reg: item.reg,
        status: item.status,
        seats: item.type === 'Innova Crysta' || item.type === 'Ertiga SUV' ? 7 : 4,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }))

      liveVehicles.length = 0
      liveVehicles.push(...mapped)
      persistVehicles()

      const snap = [...liveVehicles]
      listeners.forEach(fn => fn(snap))
    } else {
      // Empty data in database, keep local store empty
      liveVehicles.length = 0
      persistVehicles()

      const snap = [...liveVehicles]
      listeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing vehicles:', err)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
const listeners = new Set()

export function subscribeVehicles(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistVehicles()
  const snap = [...liveVehicles]
  listeners.forEach(fn => fn(snap))
}

// ─── Queries & Helpers ────────────────────────────────────────────────────────

/** Normalise vehicle registration for case-insensitive duplicate check */
export function normaliseReg(raw) {
  if (!raw) return ''
  return raw.replace(/\s+/g, '').toUpperCase()
}

export function findVehicleByReg(rawReg) {
  const target = normaliseReg(rawReg)
  if (!target) return null
  return liveVehicles.find(v => normaliseReg(v.reg) === target) || null
}

/** Returns effective operational status of a vehicle (derived 'On Trip' if assigned to an Ongoing trip) */
export function getEffectiveVehicleStatus(vehicle) {
  if (!vehicle) return 'Available'

  const nameNeedle = (vehicle.name || '').toLowerCase()
  const regNeedle  = (vehicle.reg || '').toLowerCase()

  const hasOngoingTrip = liveTrips.some(t => {
    if (t.status !== 'Ongoing') return false
    if (t.vehicleId && t.vehicleId === vehicle.id) return true
    const tVehicle = (t.vehicle || '').toLowerCase()
    const tReg     = (t.vehicleReg || '').toLowerCase()
    return (
      (nameNeedle && (tVehicle.includes(nameNeedle) || nameNeedle.includes(tVehicle))) ||
      (regNeedle && tReg === regNeedle)
    )
  })

  if (hasOngoingTrip) return 'On Trip'
  return vehicle.status || 'Available'
}

export function getVehicleCounts() {
  const total       = liveVehicles.length
  const available   = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Available').length
  const onTrip      = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'On Trip').length
  const maintenance = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Maintenance').length
  const inactive    = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Inactive').length

  return { total, available, onTrip, maintenance, inactive }
}

/** Cross-reference liveTrips to get current active/upcoming assignment for a vehicle */
export function getVehicleAssignment(vehicleName, vehicleReg = '') {
  if (!vehicleName) return null

  const nameNeedle = vehicleName.toLowerCase()
  const regNeedle  = vehicleReg ? vehicleReg.toLowerCase() : ''

  // Look for Ongoing trip first, then Upcoming
  const matchedTrip = liveTrips.find(t => {
    const isOngoingOrUpcoming = t.status === 'Ongoing' || t.status === 'Upcoming'
    if (!isOngoingOrUpcoming) return false

    const tVehicle = (t.vehicle || '').toLowerCase()
    const tReg     = (t.vehicleReg || '').toLowerCase()

    return tVehicle.includes(nameNeedle) || nameNeedle.includes(tVehicle) || (regNeedle && tReg === regNeedle)
  })

  if (!matchedTrip) return null

  return {
    customer: matchedTrip.customer,
    route:    `${matchedTrip.pickupLocation} → ${matchedTrip.destination}`,
    dateTime: `${matchedTrip.tripDate}, ${matchedTrip.tripTime}`,
    status:   matchedTrip.status,
  }
}

/** Calculate trip metrics & history for a specific vehicle */
export function getVehicleTripStats(vehicleId, vehicleName = '', vehicleReg = '') {
  const nameNeedle = vehicleName ? vehicleName.toLowerCase() : ''
  const regNeedle  = vehicleReg  ? vehicleReg.toLowerCase()  : ''

  const vehicleTrips = liveTrips.filter(t => {
    if (vehicleId && t.vehicleId === vehicleId) return true
    const tVehicle = (t.vehicle || '').toLowerCase()
    const tReg     = (t.vehicleReg || '').toLowerCase()
    return (
      (nameNeedle && (tVehicle.includes(nameNeedle) || nameNeedle.includes(tVehicle))) ||
      (regNeedle && tReg === regNeedle)
    )
  })

  const upcomingTrips  = vehicleTrips.filter(t => t.status === 'Upcoming' || t.status === 'Ongoing')
  const completedTrips = vehicleTrips.filter(t => t.status === 'Completed')
  const nextAssignment = upcomingTrips[0] || null

  return {
    totalTrips:     vehicleTrips.length,
    upcomingCount:  upcomingTrips.length,
    completedCount: completedTrips.length,
    nextAssignment,
    recentTrips:    vehicleTrips.slice(0, 5),
  }
}

/** Filter vehicles by search and status tab */
export function filterVehicles({ search = '', statusTab = 'All' }) {
  const q = search.toLowerCase()

  return liveVehicles.map(v => ({
    ...v,
    effectiveStatus: getEffectiveVehicleStatus(v)
  })).filter(v => {
    if (statusTab !== 'All' && v.effectiveStatus !== statusTab) {
      return false
    }
    if (q) {
      const haystack = `${v.name} ${v.reg} ${v.type}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function addVehicle(record, userName = 'Banjo') {
  const newVehicle = {
    id:     `V-${Date.now()}`,
    name:   record.name.trim(),
    reg:    record.reg.trim(),
    type:   record.type || 'Sedan',
    status: record.status || 'Available',
    seats:  Number(record.seats) || 4,
    createdAt: new Date().toISOString(),
  }

  liveVehicles.unshift(newVehicle)

  addActivity({
    id:          Date.now(),
    type:        'vehicle',
    text:        `Vehicle added — ${newVehicle.name} (${newVehicle.reg})`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('vehicles')
        .insert({
          id: newVehicle.id,
          user_id: user.id,
          name: newVehicle.name,
          type: newVehicle.type,
          reg: newVehicle.reg,
          status: newVehicle.status,
          created_at: newVehicle.createdAt,
          created_by: 'U-01',
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting vehicle into Supabase:', error)
        })
    }
  })

  return newVehicle
}

export function updateVehicleStatus(id, newStatus, userName = 'Banjo') {
  const idx = liveVehicles.findIndex(v => v.id === id)
  if (idx === -1) return null

  liveVehicles[idx] = {
    ...liveVehicles[idx],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  }

  addActivity({
    id:          Date.now(),
    type:        'vehicle',
    text:        `Vehicle status updated to ${newStatus} — ${liveVehicles[idx].name}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Update in Supabase in background
  supabase
    .from('vehicles')
    .update({
      status: newStatus,
      updated_at: liveVehicles[idx].updatedAt,
      updated_by: 'U-01',
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('Error updating vehicle status in Supabase:', error)
    })

  return liveVehicles[idx]
}

export function editVehicle(id, updates, userName = 'Banjo') {
  const idx = liveVehicles.findIndex(v => v.id === id)
  if (idx === -1) return null

  liveVehicles[idx] = {
    ...liveVehicles[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  notify()

  // Update in Supabase in background
  supabase
    .from('vehicles')
    .update({
      name: liveVehicles[idx].name,
      type: liveVehicles[idx].type,
      reg: liveVehicles[idx].reg,
      status: liveVehicles[idx].status,
      updated_at: liveVehicles[idx].updatedAt,
      updated_by: 'U-01',
    })
    .eq('id', id)
    .then(({ error }) => {
      if (error) console.error('Error editing vehicle in Supabase:', error)
    })

  return liveVehicles[idx]
}
