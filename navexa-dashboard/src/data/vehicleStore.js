/**
 * vehicleStore.js
 * Centralized reactive store for Navexa vehicle data with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_vehicles
 */

import { liveTrips } from './tripStore.js'
import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_vehicles'

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

/** Cloud synchronization from Supabase */
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
        photoUrl: item.photo_url || null,
        name: item.name,
        type: item.type || 'Sedan',
        reg: item.reg,
        brand: item.brand || '',
        model: item.model || '',
        manufacturingYear: item.manufacturing_year || '',
        color: item.color || '',
        fuelType: item.fuel_type || 'Diesel',
        seats: item.seats || 4,
        odometer: Number(item.odometer) || 0,
        assignedDriverId: item.assigned_driver_id || null,
        assignedDriverName: item.assigned_driver_name || 'Unassigned',
        status: item.status || 'Available',
        rcNumber: item.rc_number || '',
        rcExpiry: item.rc_expiry || '',
        rcDocUrl: item.rc_doc_url || null,
        insurancePolicy: item.insurance_policy || '',
        insuranceExpiry: item.insurance_expiry || '',
        insuranceDocUrl: item.insurance_doc_url || null,
        fitnessExpiry: item.fitness_expiry || '',
        fitnessDocUrl: item.fitness_doc_url || null,
        pollutionExpiry: item.pollution_expiry || '',
        permitExpiry: item.permit_expiry || '',
        permitDocUrl: item.permit_doc_url || null,
        nextServiceDate: item.next_service_date || '',
        nextServiceOdometer: item.next_service_odometer ? Number(item.next_service_odometer) : null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }))

      liveVehicles.length = 0
      liveVehicles.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing vehicles:', err)
  }
}

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

/** Returns effective operational status of a vehicle */
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

/** Calculate Insurance Compliance Status */
export function getInsuranceStatus(vehicle) {
  if (!vehicle || !vehicle.insuranceExpiry) return { status: 'Not Provided', color: 'bg-slate-100 text-slate-600 border-slate-200' }
  const today = new Date()
  const expDate = new Date(vehicle.insuranceExpiry)
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200' }
  } else if (diffDays <= 30) {
    return { status: `Expires in ${diffDays}d`, color: 'bg-amber-50 text-amber-700 border-amber-200' }
  }
  return { status: 'Valid', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

/** Calculate Maintenance Alerts */
export function getMaintenanceAlert(vehicle) {
  if (!vehicle) return null
  const warnings = []

  if (vehicle.nextServiceDate) {
    const today = new Date()
    const serviceDate = new Date(vehicle.nextServiceDate)
    if (serviceDate < today) {
      warnings.push(`Service Date Overdue (${vehicle.nextServiceDate})`)
    }
  }

  if (vehicle.nextServiceOdometer && vehicle.odometer >= vehicle.nextServiceOdometer) {
    warnings.push(`Odometer Service Limit Reached (${vehicle.odometer} / ${vehicle.nextServiceOdometer} km)`)
  }

  if (warnings.length > 0) {
    return warnings.join(' • ')
  }
  return null
}

export function getVehicleCounts() {
  const total       = liveVehicles.length
  const available   = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Available').length
  const onTrip      = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'On Trip').length
  const maintenance = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Maintenance').length
  const inactive    = liveVehicles.filter(v => getEffectiveVehicleStatus(v) === 'Inactive').length

  return { total, available, onTrip, maintenance, inactive }
}

export function getVehicleAssignment(vehicleName, vehicleReg = '') {
  if (!vehicleName) return null
  const nameNeedle = vehicleName.toLowerCase()
  const regNeedle  = vehicleReg ? vehicleReg.toLowerCase() : ''

  const matchedTrip = liveTrips.find(t => {
    const isOngoingOrUpcoming = t.status === 'Ongoing' || t.status === 'Upcoming'
    if (!isOngoingOrUpcoming) return false

    const tVehicle = (t.vehicle || '').toLowerCase()
    const tReg     = (t.vehicleReg || '').toLowerCase()

    return (
      (nameNeedle && (tVehicle.includes(nameNeedle) || nameNeedle.includes(tVehicle))) ||
      (regNeedle && tReg === regNeedle)
    )
  })

  if (!matchedTrip) return null
  return {
    tripId: matchedTrip.id,
    customer: matchedTrip.customer,
    pickupLocation: matchedTrip.pickupLocation,
    destination: matchedTrip.destination,
    tripDate: matchedTrip.tripDate,
    tripTime: matchedTrip.tripTime,
    status: matchedTrip.status,
  }
}

/** Advanced Filter & Sort Vehicles */
export function filterAndSortVehicles(vehiclesList, { search = '', statusTab = 'All', vehicleType = 'All', assignedDriver = 'All', sortBy = 'Newest' }) {
  let result = vehiclesList.map(v => ({
    ...v,
    effectiveStatus: getEffectiveVehicleStatus(v)
  }))

  // Filter by Status Tab
  if (statusTab !== 'All') {
    result = result.filter(v => v.effectiveStatus === statusTab)
  }

  // Filter by Vehicle Type
  if (vehicleType !== 'All') {
    result = result.filter(v => v.type === vehicleType)
  }

  // Filter by Assigned Driver
  if (assignedDriver === 'Assigned') {
    result = result.filter(v => v.assignedDriverId)
  } else if (assignedDriver === 'Unassigned') {
    result = result.filter(v => !v.assignedDriverId)
  } else if (assignedDriver !== 'All') {
    result = result.filter(v => v.assignedDriverId === assignedDriver)
  }

  // Search by Name, Registration Number, Brand
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(v => {
      const haystack = `${v.name} ${v.reg} ${v.brand || ''} ${v.model || ''} ${v.type}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sort
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  } else if (sortBy === 'Vehicle Name') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === 'Registration Number') {
    result.sort((a, b) => a.reg.localeCompare(b.reg))
  } else {
    // Newest
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addVehicle(record, userId) {
  const normalizedNew = normaliseReg(record.reg)
  const isDuplicate = liveVehicles.some(v => normaliseReg(v.reg) === normalizedNew)
  if (isDuplicate) {
    throw new Error(`Vehicle registration number "${record.reg}" already exists.`)
  }

  const id = `V-${Date.now()}`
  const now = new Date().toISOString()

  const newVehicle = {
    id,
    photoUrl: record.photoUrl || null,
    name: record.name.trim(),
    reg: record.reg.trim().toUpperCase(),
    type: record.type || 'Sedan',
    brand: record.brand ? record.brand.trim() : '',
    model: record.model ? record.model.trim() : '',
    manufacturingYear: record.manufacturingYear || '',
    color: record.color ? record.color.trim() : '',
    fuelType: record.fuelType || 'Diesel',
    seats: Number(record.seats) || 4,
    odometer: Number(record.odometer) || 0,
    assignedDriverId: record.assignedDriverId || null,
    assignedDriverName: record.assignedDriverName || 'Unassigned',
    status: record.status || 'Available',
    rcNumber: record.rcNumber ? record.rcNumber.trim() : '',
    rcExpiry: record.rcExpiry || '',
    rcDocUrl: record.rcDocUrl || null,
    insurancePolicy: record.insurancePolicy ? record.insurancePolicy.trim() : '',
    insuranceExpiry: record.insuranceExpiry || '',
    insuranceDocUrl: record.insuranceDocUrl || null,
    fitnessExpiry: record.fitnessExpiry || '',
    fitnessDocUrl: record.fitnessDocUrl || null,
    pollutionExpiry: record.pollutionExpiry || '',
    permitExpiry: record.permitExpiry || '',
    permitDocUrl: record.permitDocUrl || null,
    nextServiceDate: record.nextServiceDate || '',
    nextServiceOdometer: record.nextServiceOdometer ? Number(record.nextServiceOdometer) : null,
    createdAt: now,
    updatedAt: now,
  }

  liveVehicles.unshift(newVehicle)

  addActivity({
    id: Date.now(),
    type: 'vehicle',
    text: `Vehicle added — ${newVehicle.name} (${newVehicle.reg})`,
    performedBy: 'Admin',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase.from('vehicles').insert({
      id: newVehicle.id,
      user_id: userId,
      photo_url: newVehicle.photoUrl,
      name: newVehicle.name,
      type: newVehicle.type,
      reg: newVehicle.reg,
      brand: newVehicle.brand || null,
      model: newVehicle.model || null,
      manufacturing_year: newVehicle.manufacturingYear ? Number(newVehicle.manufacturingYear) : null,
      color: newVehicle.color || null,
      fuel_type: newVehicle.fuelType,
      seats: newVehicle.seats,
      odometer: newVehicle.odometer,
      assigned_driver_id: newVehicle.assignedDriverId,
      assigned_driver_name: newVehicle.assignedDriverName,
      status: newVehicle.status,
      rc_number: newVehicle.rcNumber || null,
      rc_expiry: newVehicle.rcExpiry || null,
      rc_doc_url: newVehicle.rcDocUrl,
      insurance_policy: newVehicle.insurancePolicy || null,
      insurance_expiry: newVehicle.insuranceExpiry || null,
      insurance_doc_url: newVehicle.insuranceDocUrl,
      fitness_expiry: newVehicle.fitnessExpiry || null,
      fitness_doc_url: newVehicle.fitnessDocUrl,
      pollution_expiry: newVehicle.pollutionExpiry || null,
      permit_expiry: newVehicle.permitExpiry || null,
      permit_doc_url: newVehicle.permitDocUrl,
      next_service_date: newVehicle.nextServiceDate || null,
      next_service_odometer: newVehicle.nextServiceOdometer,
      created_at: newVehicle.createdAt,
    })

    if (error) console.error('Error inserting vehicle into Supabase:', error)
  } catch (err) {
    console.error('Failed to save vehicle to cloud:', err)
  }

  return newVehicle
}

export async function editVehicle(id, updates) {
  const idx = liveVehicles.findIndex(v => v.id === id)
  if (idx === -1) throw new Error('Vehicle not found')

  if (updates.reg) {
    const normalizedNew = normaliseReg(updates.reg)
    const isDuplicate = liveVehicles.some(v => v.id !== id && normaliseReg(v.reg) === normalizedNew)
    if (isDuplicate) {
      throw new Error(`Vehicle registration number "${updates.reg}" is already in use by another vehicle.`)
    }
  }

  const now = new Date().toISOString()
  const updated = {
    ...liveVehicles[idx],
    ...updates,
    reg: updates.reg ? updates.reg.trim().toUpperCase() : liveVehicles[idx].reg,
    updatedAt: now,
  }

  liveVehicles[idx] = updated

  addActivity({
    id: Date.now(),
    type: 'vehicle',
    text: `Vehicle profile updated — ${updated.name} (${updated.reg})`,
    performedBy: 'Admin',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({
        photo_url: updated.photoUrl,
        name: updated.name,
        type: updated.type,
        reg: updated.reg,
        brand: updated.brand || null,
        model: updated.model || null,
        manufacturing_year: updated.manufacturingYear ? Number(updated.manufacturingYear) : null,
        color: updated.color || null,
        fuel_type: updated.fuelType,
        seats: updated.seats,
        odometer: updated.odometer,
        assigned_driver_id: updated.assignedDriverId,
        assigned_driver_name: updated.assignedDriverName,
        status: updated.status,
        rc_number: updated.rcNumber || null,
        rc_expiry: updated.rcExpiry || null,
        rc_doc_url: updated.rcDocUrl,
        insurance_policy: updated.insurancePolicy || null,
        insurance_expiry: updated.insuranceExpiry || null,
        insurance_doc_url: updated.insuranceDocUrl,
        fitness_expiry: updated.fitnessExpiry || null,
        fitness_doc_url: updated.fitnessDocUrl,
        pollution_expiry: updated.pollutionExpiry || null,
        permit_expiry: updated.permitExpiry || null,
        permit_doc_url: updated.permitDocUrl,
        next_service_date: updated.nextServiceDate || null,
        next_service_odometer: updated.nextServiceOdometer,
        updated_at: now,
      })
      .eq('id', id)

    if (error) console.error('Error updating vehicle in Supabase:', error)
  } catch (err) {
    console.error('Failed to update vehicle in cloud:', err)
  }

  return updated
}

export async function updateVehicleStatus(id, newStatus) {
  const idx = liveVehicles.findIndex(v => v.id === id)
  if (idx === -1) return null

  liveVehicles[idx] = {
    ...liveVehicles[idx],
    status: newStatus,
    updatedAt: new Date().toISOString(),
  }

  addActivity({
    id: Date.now(),
    type: 'vehicle',
    text: `Vehicle status updated to ${newStatus} — ${liveVehicles[idx].name}`,
    performedBy: 'Admin',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({
        status: newStatus,
        updated_at: liveVehicles[idx].updatedAt,
      })
      .eq('id', id)

    if (error) console.error('Error updating vehicle status in Supabase:', error)
  } catch (err) {
    console.error('Failed to update vehicle status in cloud:', err)
  }

  return liveVehicles[idx]
}

export async function deleteVehicle(id) {
  const idx = liveVehicles.findIndex(v => v.id === id)
  if (idx === -1) return false

  const removed = liveVehicles[idx]
  liveVehicles.splice(idx, 1)

  addActivity({
    id: Date.now(),
    type: 'vehicle',
    text: `Vehicle removed — ${removed.name} (${removed.reg})`,
    performedBy: 'Admin',
    time: 'Just now',
  })

  notify()

  try {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) console.error('Error deleting vehicle from Supabase:', error)
  } catch (err) {
    console.error('Failed to delete vehicle from cloud:', err)
  }

  return true
}
