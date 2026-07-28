/**
 * driverStore.js
 * Centralized reactive store for Navexa driver data with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_drivers
 */

import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_drivers'

/** Safe load drivers from localStorage */
function loadDriversFromStorage() {
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
    console.error('Error loading navexa_drivers from storage:', err)
  }
  return []
}

/** Safe save drivers to localStorage */
function persistDrivers() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveDrivers))
  } catch (err) {
    console.error('Error saving navexa_drivers to storage:', err)
  }
}

/** Central reactive array */
export const liveDrivers = loadDriversFromStorage()

const listeners = new Set()

export function subscribeDrivers(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistDrivers()
  const snap = [...liveDrivers]
  listeners.forEach(fn => fn(snap))
}

/** Cloud synchronization from Supabase */
export async function syncDrivers(userId) {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data) {
      const mapped = data.map(item => ({
        id: item.id,
        photoUrl: item.photo_url || null,
        fullName: item.full_name,
        phone: item.phone,
        email: item.email || '',
        dateOfBirth: item.date_of_birth || '',
        address: item.address || '',
        emergencyContactName: item.emergency_contact_name || '',
        emergencyContactPhone: item.emergency_contact_phone || '',
        licenseNumber: item.license_number,
        licenseIssueDate: item.license_issue_date || '',
        licenseExpiryDate: item.license_expiry_date,
        assignedVehicleId: item.assigned_vehicle_id || null,
        assignedVehicleName: item.assigned_vehicle_name || 'Unassigned',
        status: item.status || 'Active',
        notes: item.notes || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }))

      liveDrivers.length = 0
      liveDrivers.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing drivers from Supabase:', err)
  }
}

/** Helper: Check if license number already exists */
export function isLicenseNumberDuplicate(licenseNumber, excludeId = null) {
  if (!licenseNumber) return false
  const normalized = licenseNumber.trim().toUpperCase()
  return liveDrivers.some(
    drv => drv.id !== excludeId && drv.licenseNumber.trim().toUpperCase() === normalized
  )
}

/** Add a new driver */
export async function addDriver(driverData, userId) {
  // Check for duplicate license
  if (isLicenseNumberDuplicate(driverData.licenseNumber)) {
    throw new Error(`A driver with license number "${driverData.licenseNumber}" already exists.`)
  }

  const id = `DRV-${Date.now().toString(36).toUpperCase()}`
  const now = new Date().toISOString()

  const newDriver = {
    id,
    photoUrl: driverData.photoUrl || null,
    fullName: driverData.fullName.trim(),
    phone: driverData.phone.trim(),
    email: driverData.email ? driverData.email.trim() : '',
    dateOfBirth: driverData.dateOfBirth || '',
    address: driverData.address ? driverData.address.trim() : '',
    emergencyContactName: driverData.emergencyContactName ? driverData.emergencyContactName.trim() : '',
    emergencyContactPhone: driverData.emergencyContactPhone ? driverData.emergencyContactPhone.trim() : '',
    licenseNumber: driverData.licenseNumber.trim().toUpperCase(),
    licenseIssueDate: driverData.licenseIssueDate || '',
    licenseExpiryDate: driverData.licenseExpiryDate,
    assignedVehicleId: driverData.assignedVehicleId || null,
    assignedVehicleName: driverData.assignedVehicleName || 'Unassigned',
    status: driverData.status || 'Active',
    notes: driverData.notes ? driverData.notes.trim() : '',
    createdAt: now,
    updatedAt: now,
  }

  // Update memory & localStorage immediately
  liveDrivers.unshift(newDriver)
  notify()

  // Sync to Supabase
  try {
    const { error } = await supabase.from('drivers').insert({
      id: newDriver.id,
      user_id: userId,
      photo_url: newDriver.photoUrl,
      full_name: newDriver.fullName,
      phone: newDriver.phone,
      email: newDriver.email || null,
      date_of_birth: newDriver.dateOfBirth || null,
      address: newDriver.address || null,
      emergency_contact_name: newDriver.emergencyContactName || null,
      emergency_contact_phone: newDriver.emergencyContactPhone || null,
      license_number: newDriver.licenseNumber,
      license_issue_date: newDriver.licenseIssueDate || null,
      license_expiry_date: newDriver.licenseExpiryDate,
      assigned_vehicle_id: newDriver.assignedVehicleId,
      assigned_vehicle_name: newDriver.assignedVehicleName,
      status: newDriver.status,
      notes: newDriver.notes || null,
    })

    if (error) console.error('Supabase error inserting driver:', error)
  } catch (err) {
    console.error('Failed to save driver to cloud:', err)
  }

  return newDriver
}

/** Update an existing driver */
export async function updateDriver(id, driverData) {
  const index = liveDrivers.findIndex(d => d.id === id)
  if (index === -1) throw new Error('Driver not found')

  if (isLicenseNumberDuplicate(driverData.licenseNumber, id)) {
    throw new Error(`A driver with license number "${driverData.licenseNumber}" already exists.`)
  }

  const now = new Date().toISOString()
  const updated = {
    ...liveDrivers[index],
    photoUrl: driverData.photoUrl !== undefined ? driverData.photoUrl : liveDrivers[index].photoUrl,
    fullName: driverData.fullName.trim(),
    phone: driverData.phone.trim(),
    email: driverData.email !== undefined ? driverData.email.trim() : liveDrivers[index].email,
    dateOfBirth: driverData.dateOfBirth !== undefined ? driverData.dateOfBirth : liveDrivers[index].dateOfBirth,
    address: driverData.address !== undefined ? driverData.address.trim() : liveDrivers[index].address,
    emergencyContactName: driverData.emergencyContactName !== undefined ? driverData.emergencyContactName.trim() : liveDrivers[index].emergencyContactName,
    emergencyContactPhone: driverData.emergencyContactPhone !== undefined ? driverData.emergencyContactPhone.trim() : liveDrivers[index].emergencyContactPhone,
    licenseNumber: driverData.licenseNumber.trim().toUpperCase(),
    licenseIssueDate: driverData.licenseIssueDate !== undefined ? driverData.licenseIssueDate : liveDrivers[index].licenseIssueDate,
    licenseExpiryDate: driverData.licenseExpiryDate,
    assignedVehicleId: driverData.assignedVehicleId !== undefined ? driverData.assignedVehicleId : liveDrivers[index].assignedVehicleId,
    assignedVehicleName: driverData.assignedVehicleName !== undefined ? driverData.assignedVehicleName : liveDrivers[index].assignedVehicleName,
    status: driverData.status || liveDrivers[index].status,
    notes: driverData.notes !== undefined ? driverData.notes.trim() : liveDrivers[index].notes,
    updatedAt: now,
  }

  liveDrivers[index] = updated
  notify()

  // Sync to Supabase
  try {
    const { error } = await supabase
      .from('drivers')
      .update({
        photo_url: updated.photoUrl,
        full_name: updated.fullName,
        phone: updated.phone,
        email: updated.email || null,
        date_of_birth: updated.dateOfBirth || null,
        address: updated.address || null,
        emergency_contact_name: updated.emergencyContactName || null,
        emergency_contact_phone: updated.emergencyContactPhone || null,
        license_number: updated.licenseNumber,
        license_issue_date: updated.licenseIssueDate || null,
        license_expiry_date: updated.licenseExpiryDate,
        assigned_vehicle_id: updated.assignedVehicleId,
        assigned_vehicle_name: updated.assignedVehicleName,
        status: updated.status,
        notes: updated.notes || null,
        updated_at: now,
      })
      .eq('id', id)

    if (error) console.error('Supabase error updating driver:', error)
  } catch (err) {
    console.error('Failed to update driver in cloud:', err)
  }

  return updated
}

/** Delete a driver */
export async function deleteDriver(id) {
  const index = liveDrivers.findIndex(d => d.id === id)
  if (index === -1) return false

  liveDrivers.splice(index, 1)
  notify()

  try {
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) console.error('Supabase error deleting driver:', error)
  } catch (err) {
    console.error('Failed to delete driver from cloud:', err)
  }

  return true
}

/** Helper: Filter and Sort Drivers */
export function filterAndSortDrivers(driversList, { search = '', status = 'All', sortBy = 'Newest' }) {
  let result = [...driversList]

  // Filter by Status
  if (status && status !== 'All') {
    result = result.filter(d => d.status === status)
  }

  // Instant Search by Name, Phone, License
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(
      d =>
        d.fullName.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
    )
  }

  // Sort
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  } else if (sortBy === 'Driver Name A-Z') {
    result.sort((a, b) => a.fullName.localeCompare(b.fullName))
  } else {
    // Newest default
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
}
