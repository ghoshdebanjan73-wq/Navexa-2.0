/**
 * paymentStore.js
 * Centralized reactive store for Navexa Trip Payment records with localStorage persistence.
 *
 * Storage Key: navexa_payments
 */

import { addActivity } from './transactionStore.js'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_payments'

// Seed payment records matching initial seed trips
const initialSeedPayments = []

/** Safe load payments from localStorage */
function loadPaymentsFromStorage() {
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
    console.error('Error loading navexa_payments from storage:', err)
  }
  return []
}

/** Safe save payments to localStorage */
function persistPayments() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(livePayments))
  } catch (err) {
    console.error('Error saving navexa_payments to storage:', err)
  }
}

/** @type {PaymentRecord[]} Central reactive array */
export const livePayments = loadPaymentsFromStorage()

export async function syncPayments(userId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        tripId: item.trip_id,
        amount: Number(item.amount) || 0,
        paymentDate: item.payment_date,
        paymentMethod: item.payment_method,
        notes: item.notes || '',
        createdAt: item.created_at,
      }))

      livePayments.length = 0
      livePayments.push(...mapped)
      persistPayments()

      const snap = [...livePayments]
      listeners.forEach(fn => fn(snap))
    } else {
      // Empty database, keep local store empty
      livePayments.length = 0
      persistPayments()

      const snap = [...livePayments]
      listeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing payments:', err)
  }
}

// ─── Subscription ─────────────────────────────────────────────────────────────
const listeners = new Set()

export function subscribePayments(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistPayments()
  const snap = [...livePayments]
  listeners.forEach(fn => fn(snap))
}

// ─── Queries & Derived Payment State ──────────────────────────────────────────

/** Get all payments recorded for a trip, sorted newest first */
export function getPaymentsByTrip(tripId) {
  if (!tripId) return []
  return livePayments
    .filter(p => p.tripId === tripId)
    .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))
}

/** Calculate total amount paid for a trip */
export function getTripAmountPaid(tripId, fare = 0, fallbackStatus = 'Unpaid') {
  if (!tripId) return 0
  const payments = livePayments.filter(p => p.tripId === tripId)
  if (payments.length > 0) {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }
  // Safe fallback for legacy seed trips without explicit payment records
  if (fallbackStatus === 'Paid') return Number(fare) || 0
  return 0
}

/**
 * Compute full payment summary & derived status for a trip
 * Rules:
 * - amountPaid <= 0 -> Unpaid
 * - amountPaid > 0 && amountPaid < fare -> Partial
 * - amountPaid >= fare -> Paid
 */
export function getTripPaymentSummary(tripId, fare = 0, fallbackStatus = 'Unpaid') {
  const numFare = Number(fare) || 0
  const amountPaid = getTripAmountPaid(tripId, numFare, fallbackStatus)
  const balance = Math.max(0, numFare - amountPaid)

  let paymentStatus = 'Unpaid'
  if (amountPaid >= numFare && numFare > 0) {
    paymentStatus = 'Paid'
  } else if (amountPaid > 0 && amountPaid < numFare) {
    paymentStatus = 'Partial'
  } else if (numFare === 0 && amountPaid === 0 && fallbackStatus === 'Paid') {
    paymentStatus = 'Paid'
  }

  return {
    fare: numFare,
    amountPaid,
    balance,
    paymentStatus,
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function recordPayment(data, userName = 'Banjo') {
  const newPayment = {
    id:            `PMT-${Date.now()}`,
    tripId:        data.tripId,
    amount:        Number(data.amount) || 0,
    paymentDate:   data.paymentDate,
    paymentMethod: data.paymentMethod || 'UPI',
    notes:         data.notes?.trim() || '',
    createdAt:     new Date().toISOString(),
  }

  livePayments.unshift(newPayment)

  addActivity({
    id:          Date.now(),
    type:        'finance',
    text:        `Payment recorded: ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMethod}`,
    performedBy: userName,
    time:        'Just now',
  })

  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('payments')
        .insert({
          id: newPayment.id,
          user_id: user.id,
          trip_id: newPayment.tripId,
          amount: newPayment.amount,
          payment_date: newPayment.paymentDate,
          payment_method: newPayment.paymentMethod,
          notes: newPayment.notes || null,
          created_at: newPayment.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting payment record into Supabase:', error)
        })
    }
  })

  return newPayment
}
