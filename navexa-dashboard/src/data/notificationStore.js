/**
 * notificationStore.js
 * Centralized reactive store for Navexa Smart Notifications & Reminders.
 * Evaluates domain data (Trips, Invoices, Vehicles, Drivers) and generates idempotent reminders.
 *
 * Storage Key: navexa_notifications
 */

import { supabase } from '../lib/supabase'
import { liveTrips } from './tripStore'
import { liveInvoices } from './invoiceStore'
import { liveVehicles } from './vehicleStore'
import { liveDrivers } from './driverStore'

const STORAGE_KEY = 'navexa_notifications'

function loadNotificationsFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Error loading navexa_notifications from storage:', err)
  }
  return []
}

function persistNotifications() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveNotifications))
  } catch (err) {
    console.error('Error saving navexa_notifications to storage:', err)
  }
}

/** @type {NotificationRecord[]} Central reactive array */
export const liveNotifications = loadNotificationsFromStorage()

const listeners = new Set()

export function subscribeNotifications(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistNotifications()
  const snap = [...liveNotifications]
  listeners.forEach(fn => fn(snap))
}

/** Cloud sync from Supabase */
export async function syncNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        type: item.type || 'system',
        severity: item.severity || 'info',
        title: item.title,
        message: item.message,
        isRead: item.is_read || false,
        isDismissed: item.is_dismissed || false,
        deduplicationKey: item.deduplication_key,
        tripId: item.trip_id || '',
        invoiceId: item.invoice_id || '',
        vehicleId: item.vehicle_id || '',
        driverId: item.driver_id || '',
        createdAt: item.created_at,
        readAt: item.read_at,
      }))

      // Merge with local state preserving local reads
      liveNotifications.length = 0
      liveNotifications.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing notifications from Supabase:', err)
  }

  // Trigger real-time smart reminder evaluation
  evaluateSmartReminders(userId)
}

/**
 * Idempotent Reminder Generation Engine
 * Scans Trips, Invoices, Vehicles, and Drivers. Uses stable deduplication keys to prevent spam.
 */
export async function evaluateSmartReminders(userId) {
  const newItems = []
  const existingKeys = new Set(liveNotifications.map(n => n.deduplicationKey))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 1. TRIP REMINDERS (Today / Tomorrow)
  liveTrips.forEach(trip => {
    if (trip.status === 'Cancelled' || trip.status === 'Completed') return
    if (!trip.tripDate) return

    const tDate = new Date(trip.tripDate)
    tDate.setHours(0, 0, 0, 0)

    const isToday = tDate.getTime() === today.getTime()
    const isTomorrow = tDate.getTime() === tomorrow.getTime()

    if (isToday) {
      const dedupKey = `trip:${trip.id}:today`
      if (!existingKeys.has(dedupKey)) {
        newItems.push({
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'trip',
          severity: 'info',
          title: 'Trip Today',
          message: `Trip to ${trip.destination} for ${trip.customer} is scheduled today at ${trip.tripTime || 'scheduled time'}. (Driver: ${trip.driverName || 'N/A'}, Vehicle: ${trip.vehicle || 'N/A'})`,
          isRead: false,
          isDismissed: false,
          deduplicationKey: dedupKey,
          tripId: trip.id,
          createdAt: new Date().toISOString(),
        })
        existingKeys.add(dedupKey)
      }
    } else if (isTomorrow) {
      const dedupKey = `trip:${trip.id}:tomorrow`
      if (!existingKeys.has(dedupKey)) {
        newItems.push({
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'trip',
          severity: 'info',
          title: 'Trip Tomorrow',
          message: `Trip to ${trip.destination} for ${trip.customer} starts tomorrow at ${trip.tripTime || 'scheduled time'}.`,
          isRead: false,
          isDismissed: false,
          deduplicationKey: dedupKey,
          tripId: trip.id,
          createdAt: new Date().toISOString(),
        })
        existingKeys.add(dedupKey)
      }
    }
  })

  // 2. PAYMENT / INVOICE REMINDERS (Overdue / Outstanding)
  liveInvoices.forEach(inv => {
    if (inv.paymentStatus === 'Paid' || inv.paymentStatus === 'Cancelled') return

    const isOverdue = inv.paymentStatus === 'Overdue' || (inv.dueDate && new Date(inv.dueDate) < today)
    const dedupKey = isOverdue ? `invoice:${inv.id}:overdue` : `invoice:${inv.id}:unpaid`

    if (!existingKeys.has(dedupKey)) {
      newItems.push({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'payment',
        severity: isOverdue ? 'warning' : 'info',
        title: isOverdue ? 'Payment Overdue' : 'Outstanding Invoice Balance',
        message: `₹${inv.balanceDue} is still due from ${inv.customerName} for invoice ${inv.invoiceNumber} (Due: ${inv.dueDate}).`,
        isRead: false,
        isDismissed: false,
        deduplicationKey: dedupKey,
        invoiceId: inv.id,
        createdAt: new Date().toISOString(),
      })
      existingKeys.add(dedupKey)
    }
  })

  // 3. VEHICLE DOCUMENT & MAINTENANCE REMINDERS
  liveVehicles.forEach(veh => {
    const docFields = [
      { key: 'insuranceExpiry', label: 'Insurance' },
      { key: 'permitExpiry', label: 'Permit' },
      { key: 'fitnessExpiry', label: 'Fitness Certificate' },
      { key: 'pollutionExpiry', label: 'Pollution Certificate' },
    ]

    docFields.forEach(({ key, label }) => {
      const expStr = veh[key] || veh.documentExpiries?.[key]
      if (!expStr) return

      const expDate = new Date(expStr)
      expDate.setHours(0, 0, 0, 0)

      const diffTime = expDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let intervalLabel = null
      let severity = 'warning'

      if (diffDays < 0) {
        intervalLabel = 'expired'
        severity = 'critical'
      } else if (diffDays <= 1) {
        intervalLabel = '1day'
        severity = 'warning'
      } else if (diffDays <= 7) {
        intervalLabel = '7days'
        severity = 'warning'
      } else if (diffDays <= 30) {
        intervalLabel = '30days'
        severity = 'info'
      }

      if (intervalLabel) {
        const dedupKey = `vehicle:${veh.id}:${key}:${intervalLabel}`
        if (!existingKeys.has(dedupKey)) {
          newItems.push({
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'vehicle',
            severity,
            title: `Vehicle ${label} ${diffDays < 0 ? 'Expired' : 'Expiring Soon'}`,
            message: `${label} for ${veh.name} (${veh.registration || veh.id}) ${diffDays < 0 ? 'has EXPIRED' : `expires in ${diffDays} day(s)`} on ${expStr}.`,
            isRead: false,
            isDismissed: false,
            deduplicationKey: dedupKey,
            vehicleId: veh.id,
            createdAt: new Date().toISOString(),
          })
          existingKeys.add(dedupKey)
        }
      }
    })

    // Vehicle Service Reminder
    if (veh.nextServiceDate) {
      const sDate = new Date(veh.nextServiceDate)
      sDate.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((sDate - today) / (1000 * 60 * 60 * 24))

      if (diffDays <= 7) {
        const dedupKey = `vehicle:${veh.id}:service:${diffDays <= 0 ? 'due' : '7days'}`
        if (!existingKeys.has(dedupKey)) {
          newItems.push({
            id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'vehicle',
            severity: diffDays <= 0 ? 'warning' : 'info',
            title: `Vehicle Service ${diffDays <= 0 ? 'Due' : 'Approaching'}`,
            message: `Scheduled maintenance for ${veh.name} (${veh.registration || veh.id}) is ${diffDays <= 0 ? 'DUE NOW' : `due in ${diffDays} days`}.`,
            isRead: false,
            isDismissed: false,
            deduplicationKey: dedupKey,
            vehicleId: veh.id,
            createdAt: new Date().toISOString(),
          })
          existingKeys.add(dedupKey)
        }
      }
    }
  })

  // 4. DRIVER LICENSE REMINDERS
  liveDrivers.forEach(drv => {
    if (!drv.licenseExpiryDate) return

    const lDate = new Date(drv.licenseExpiryDate)
    lDate.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((lDate - today) / (1000 * 60 * 60 * 24))

    let intervalLabel = null
    let severity = 'warning'

    if (diffDays < 0) {
      intervalLabel = 'expired'
      severity = 'critical'
    } else if (diffDays <= 1) {
      intervalLabel = '1day'
      severity = 'warning'
    } else if (diffDays <= 7) {
      intervalLabel = '7days'
      severity = 'warning'
    } else if (diffDays <= 30) {
      intervalLabel = '30days'
      severity = 'info'
    }

    if (intervalLabel) {
      const dedupKey = `driver:${drv.id}:license:${intervalLabel}`
      if (!existingKeys.has(dedupKey)) {
        newItems.push({
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'driver',
          severity,
          title: `Driver License ${diffDays < 0 ? 'Expired' : 'Expiring Soon'}`,
          message: `Driver license for ${drv.fullName} ${diffDays < 0 ? 'has EXPIRED' : `expires in ${diffDays} day(s)`} on ${drv.licenseExpiryDate}.`,
          isRead: false,
          isDismissed: false,
          deduplicationKey: dedupKey,
          driverId: drv.id,
          createdAt: new Date().toISOString(),
        })
        existingKeys.add(dedupKey)
      }
    }
  })

  // Batch insert new items
  if (newItems.length > 0) {
    liveNotifications.unshift(...newItems)
    notify()

    // Sync to Supabase in background
    newItems.forEach(async item => {
      try {
        await supabase.from('notifications').insert({
          id: item.id,
          type: item.type,
          severity: item.severity,
          title: item.title,
          message: item.message,
          is_read: item.isRead,
          is_dismissed: item.isDismissed,
          deduplication_key: item.deduplicationKey,
          trip_id: item.tripId || null,
          invoice_id: item.invoiceId || null,
          vehicle_id: item.vehicleId || null,
          driver_id: item.driverId || null,
          created_at: item.createdAt,
          user_id: userId,
        })
      } catch (err) {
        console.error('Failed to sync new notification to cloud:', err)
      }
    })
  }
}

/** Mark single notification as read */
export async function markAsRead(id) {
  const idx = liveNotifications.findIndex(n => n.id === id)
  if (idx === -1) return

  liveNotifications[idx].isRead = true
  liveNotifications[idx].readAt = new Date().toISOString()
  notify()

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
  } catch (err) {
    console.error('Error updating notification read state in Supabase:', err)
  }
}

/** Mark all notifications as read */
export async function markAllAsRead() {
  const now = new Date().toISOString()
  liveNotifications.forEach(n => {
    n.isRead = true
    n.readAt = now
  })
  notify()

  try {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('is_read', false)
  } catch (err) {
    console.error('Error marking all notifications as read in Supabase:', err)
  }
}

/** Dismiss notification */
export async function dismissNotification(id) {
  const idx = liveNotifications.findIndex(n => n.id === id)
  if (idx === -1) return

  liveNotifications[idx].isDismissed = true
  notify()

  try {
    await supabase
      .from('notifications')
      .update({ is_dismissed: true })
      .eq('id', id)
  } catch (err) {
    console.error('Error dismissing notification in Supabase:', err)
  }
}

/** Unread count calculator */
export function getUnreadCount(role = 'Admin') {
  return liveNotifications.filter(n => !n.isDismissed && !n.isRead && (role === 'Admin' || n.type !== 'payment')).length
}
