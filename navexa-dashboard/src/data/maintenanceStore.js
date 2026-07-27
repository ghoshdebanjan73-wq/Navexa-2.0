/**
 * maintenanceStore.js
 * Centralized reactive store for Navexa vehicle maintenance & service records with localStorage persistence.
 *
 * Storage Key: navexa_maintenance
 */

import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_maintenance'

// Canonical seed maintenance records
const initialSeedMaintenance = []

/** Safe load maintenance records from localStorage */
function loadMaintenanceFromStorage() {
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
    console.error('Error loading navexa_maintenance from storage:', err)
  }
  return []
}

/** Safe save maintenance records to localStorage */
function persistMaintenance() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveMaintenance))
  } catch (err) {
    console.error('Error saving navexa_maintenance to storage:', err)
  }
}

/** @type {MaintenanceRecord[]} Central reactive array */
export const liveMaintenance = loadMaintenanceFromStorage()

export async function syncMaintenance(userId) {
  try {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        vehicleId: item.vehicle_id,
        type: item.type,
        serviceDate: item.service_date,
        cost: Number(item.cost) || 0,
        odometer: Number(item.odometer) || null,
        notes: item.notes || '',
        createdAt: item.created_at,
      }))

      liveMaintenance.length = 0
      liveMaintenance.push(...mapped)
      persistMaintenance()

      const snap = [...liveMaintenance]
      listeners.forEach(fn => fn(snap))
    } else {
      // Empty database, keep local store empty
      liveMaintenance.length = 0
      persistMaintenance()

      const snap = [...liveMaintenance]
      listeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing maintenance:', err)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
const listeners = new Set()

export function subscribeMaintenance(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistMaintenance()
  const snap = [...liveMaintenance]
  listeners.forEach(fn => fn(snap))
}

// ─── Queries & Helpers ────────────────────────────────────────────────────────

/** Get maintenance records for a specific vehicle, sorted newest first */
export function getMaintenanceByVehicle(vehicleId) {
  if (!vehicleId) return []
  return liveMaintenance
    .filter(m => m.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.serviceDate || b.createdAt) - new Date(a.serviceDate || a.createdAt))
}

/** Calculate total maintenance cost for a vehicle */
export function getVehicleTotalMaintenanceCost(vehicleId) {
  if (!vehicleId) return 0
  const records = liveMaintenance.filter(m => m.vehicleId === vehicleId)
  return records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function addMaintenanceRecord(record, userName = 'Banjo') {
  const newRecord = {
    id:              `MNT-${Date.now()}`,
    vehicleId:       record.vehicleId,
    type:            record.type || 'Regular Service',
    serviceDate:     record.serviceDate,
    cost:            Number(record.cost) || 0,
    odometer:        record.odometer ? Number(record.odometer) : null,
    serviceProvider: record.serviceProvider?.trim() || '',
    notes:           record.notes?.trim() || '',
    createdAt:       new Date().toISOString(),
  }

  liveMaintenance.unshift(newRecord)

  addActivity({
    id:          Date.now(),
    type:        'vehicle',
    text:        `Maintenance recorded — ${newRecord.type} (₹${newRecord.cost.toLocaleString('en-IN')})`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('maintenance')
        .insert({
          id: newRecord.id,
          user_id: user.id,
          vehicle_id: newRecord.vehicleId,
          type: newRecord.type,
          service_date: newRecord.serviceDate,
          cost: newRecord.cost,
          odometer: newRecord.odometer,
          notes: newRecord.notes || null,
          created_at: newRecord.createdAt,
          created_by: 'U-01',
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting maintenance record into Supabase:', error)
        })
    }
  })

  return newRecord
}
