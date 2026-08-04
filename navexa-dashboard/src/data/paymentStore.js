/**
 * paymentStore.js
 * Centralized reactive store for Navexa Payment records (Invoices & Trips)
 * with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_payments
 */

import { addActivity, addTransaction, removeTransactionByReference } from './transactionStore.js'
import { addAuditLog } from './auditStore.js'
import { supabase } from '../lib/supabase'
import { liveInvoices } from './invoiceStore.js'

const STORAGE_KEY = 'navexa_payments'

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Other',
]

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
        invoiceId: item.notes && item.notes.includes('INV_ID:') ? extractInvoiceId(item.notes) : (item.trip_id?.startsWith('INV-') ? item.trip_id : null),
        tripId: item.trip_id && !item.trip_id.startsWith('INV-') ? item.trip_id : null,
        paymentNumber: item.notes && item.notes.includes('PAY_NUM:') ? extractPayNum(item.notes) : `PAY-${item.id.slice(-4)}`,
        amount: Number(item.amount) || 0,
        paymentDate: item.payment_date,
        paymentMethod: item.payment_method || 'Cash',
        referenceNumber: item.notes && item.notes.includes('REF:') ? extractRefNum(item.notes) : '',
        collectedBy: item.notes && item.notes.includes('BY:') ? extractCollectedBy(item.notes) : 'System',
        notes: cleanNotes(item.notes),
        createdAt: item.created_at,
      }))

      livePayments.length = 0
      livePayments.push(...mapped)
      persistPayments()
      notify()
    }
  } catch (err) {
    console.error('Error syncing payments:', err)
  }
}

// ─── Helpers for parsing structured notes in DB ──────────────────────────────────
function extractInvoiceId(notes = '') {
  const match = notes.match(/INV_ID:([^\s|]+)/)
  return match ? match[1] : null
}
function extractPayNum(notes = '') {
  const match = notes.match(/PAY_NUM:([^\s|]+)/)
  return match ? match[1] : ''
}
function extractRefNum(notes = '') {
  const match = notes.match(/REF:([^\s|]+)/)
  return match ? match[1] : ''
}
function extractCollectedBy(notes = '') {
  const match = notes.match(/BY:([^\s|]+)/)
  return match ? match[1] : 'System'
}
function cleanNotes(notes = '') {
  if (!notes) return ''
  return notes.replace(/(INV_ID|PAY_NUM|REF|BY):[^\s|]+\s*\|?\s*/g, '').trim()
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

/** Get all payments recorded for an invoice, sorted newest first */
export function getPaymentsByInvoice(invoiceId) {
  if (!invoiceId) return []
  return livePayments
    .filter(p => p.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt))
}

/** Compute full payment summary & derived status for an invoice */
export function getInvoicePaymentSummary(invoiceId, totalAmount = 0, currentInvoiceStatus = 'Pending') {
  const numTotal = Number(totalAmount) || 0
  const payments = getPaymentsByInvoice(invoiceId)
  
  const amountPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const remainingBalance = Math.max(0, numTotal - amountPaid)
  const progressPercentage = numTotal > 0 ? Math.min(100, Math.round((amountPaid / numTotal) * 100)) : (amountPaid > 0 ? 100 : 0)

  let paymentStatus = 'Pending'
  if (currentInvoiceStatus === 'Cancelled') {
    paymentStatus = 'Cancelled'
  } else if (amountPaid >= numTotal && numTotal > 0) {
    paymentStatus = 'Paid'
  } else if (amountPaid > 0) {
    paymentStatus = 'In Progress'
  }

  return {
    invoiceId,
    totalAmount: numTotal,
    amountPaid,
    remainingBalance,
    progressPercentage,
    paymentStatus,
    paymentCount: payments.length,
  }
}

/** Calculate total amount paid for a trip */
export function getTripAmountPaid(tripId, fare = 0, fallbackStatus = 'Unpaid') {
  if (!tripId) return 0
  const payments = livePayments.filter(p => p.tripId === tripId)
  if (payments.length > 0) {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }
  if (fallbackStatus === 'Paid') return Number(fare) || 0
  return 0
}

/** Compute full payment summary & derived status for a trip */
export function getTripPaymentSummary(tripId, fare = 0, fallbackStatus = 'Unpaid') {
  const numFare = Number(fare) || 0
  const amountPaid = getTripAmountPaid(tripId, numFare, fallbackStatus)
  const balance = Math.max(0, numFare - amountPaid)

  let paymentStatus = 'Unpaid'
  if (amountPaid >= numFare && numFare > 0) {
    paymentStatus = 'Paid'
  } else if (amountPaid > 0 && amountPaid < numFare) {
    paymentStatus = 'In Progress'
  }

  return {
    fare: numFare,
    amountPaid,
    balance,
    paymentStatus,
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Record a new invoice payment record with overpayment & negative validation */
export function recordInvoicePaymentRecord(data, currentUser = null) {
  const amount = Number(data.amount || 0)
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Payment amount must be a positive number greater than zero.')
  }

  const invoice = liveInvoices.find(inv => inv.id === data.invoiceId)
  if (!invoice) {
    throw new Error('Invoice not found.')
  }

  const currentSummary = getInvoicePaymentSummary(invoice.id, invoice.totalAmount, invoice.paymentStatus)
  if (amount > currentSummary.remainingBalance + 0.01) {
    throw new Error(`Payment amount (₹${amount.toLocaleString('en-IN')}) cannot exceed the remaining balance (₹${currentSummary.remainingBalance.toLocaleString('en-IN')}).`)
  }

  const existingInvoicePayments = getPaymentsByInvoice(data.invoiceId)
  const paySeqNum = existingInvoicePayments.length + 1
  const paymentNumber = `PAY-${String(paySeqNum).padStart(3, '0')}`

  const userName = currentUser?.name || data.collectedBy || 'Admin'
  const userRole = currentUser?.role || 'Admin'

  const newPayment = {
    id: `PMT-${data.invoiceId}-${Date.now()}-${paySeqNum}`,
    invoiceId: data.invoiceId,
    tripId: invoice.tripId || null,
    paymentNumber,
    amount,
    paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod || 'Cash',
    referenceNumber: data.referenceNumber?.trim() || data.transactionId?.trim() || '',
    collectedBy: userName,
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  }

  livePayments.unshift(newPayment)
  notify()

  // Calculate updated invoice amounts & status
  const updatedSummary = getInvoicePaymentSummary(invoice.id, invoice.totalAmount, invoice.paymentStatus)
  
  // Update invoice object in memory
  invoice.amountPaid = updatedSummary.amountPaid
  invoice.balanceDue = updatedSummary.remainingBalance
  invoice.paymentStatus = updatedSummary.paymentStatus
  invoice.paymentMethod = newPayment.paymentMethod
  invoice.paymentDate = newPayment.paymentDate
  invoice.referenceNumber = newPayment.referenceNumber || invoice.referenceNumber

  // Persist updated invoice to storage & notify invoiceStore subscribers
  localStorage.setItem('navexa_invoices', JSON.stringify(liveInvoices))

  // Single Idempotent Income Transaction for Finance Store
  addTransaction({
    id: `TXN-${newPayment.id}`,
    type: 'Income',
    category: 'Invoice Payment',
    amount: newPayment.amount,
    invoiceId: invoice.id,
    customerId: invoice.customerId || '',
    date: newPayment.paymentDate,
    reference: newPayment.referenceNumber || paymentNumber,
    description: `Payment ${paymentNumber} received for Invoice ${invoice.invoiceNumber} (${invoice.customerName})`,
    paymentMethod: newPayment.paymentMethod,
  })

  // Audit Log
  addAuditLog({
    user_id: currentUser?.id || null,
    user_name: userName,
    user_role: userRole,
    action: 'PAYMENT',
    entity_type: 'Invoice',
    entity_id: invoice.id,
    entity_label: invoice.invoiceNumber,
    description: `Recorded payment ${paymentNumber} of ₹${amount.toLocaleString('en-IN')} via ${newPayment.paymentMethod} for invoice ${invoice.invoiceNumber}`,
    new_values: {
      paymentNumber,
      amount,
      paymentMethod: newPayment.paymentMethod,
      remainingBalance: updatedSummary.remainingBalance,
      paymentStatus: updatedSummary.paymentStatus,
    },
  })

  // Supabase background sync
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      const metaNotes = `INV_ID:${invoice.id} | PAY_NUM:${paymentNumber} | REF:${newPayment.referenceNumber} | BY:${userName} | ${newPayment.notes}`.trim()
      
      supabase
        .from('payments')
        .insert({
          id: newPayment.id,
          user_id: user.id,
          trip_id: invoice.id, // linked to invoice ID
          amount: newPayment.amount,
          payment_date: newPayment.paymentDate,
          payment_method: newPayment.paymentMethod,
          notes: metaNotes,
          created_at: newPayment.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('Error syncing payment to Supabase:', error)
        })

      supabase
        .from('invoices')
        .update({
          amount_paid: updatedSummary.amountPaid,
          balance_due: updatedSummary.remainingBalance,
          payment_status: updatedSummary.paymentStatus,
          payment_method: newPayment.paymentMethod,
          payment_date: newPayment.paymentDate,
          reference_number: newPayment.referenceNumber,
        })
        .eq('id', invoice.id)
        .then(({ error }) => {
          if (error) console.error('Error updating invoice status in Supabase:', error)
        })
    }
  })

  return newPayment
}

/** Delete an invoice payment record */
export function deleteInvoicePaymentRecord(paymentId, currentUser = null) {
  const pIndex = livePayments.findIndex(p => p.id === paymentId)
  if (pIndex === -1) return false

  const deletedPayment = livePayments[pIndex]
  livePayments.splice(pIndex, 1)
  notify()

  const userName = currentUser?.name || 'Admin'
  const userRole = currentUser?.role || 'Admin'

  // Reverse finance transaction
  removeTransactionByReference(`TXN-${deletedPayment.id}`)

  // Update invoice status & amounts
  if (deletedPayment.invoiceId) {
    const invoice = liveInvoices.find(inv => inv.id === deletedPayment.invoiceId)
    if (invoice) {
      const summary = getInvoicePaymentSummary(invoice.id, invoice.totalAmount, invoice.paymentStatus)
      invoice.amountPaid = summary.amountPaid
      invoice.balanceDue = summary.remainingBalance
      invoice.paymentStatus = summary.paymentStatus
      localStorage.setItem('navexa_invoices', JSON.stringify(liveInvoices))

      // Audit Log
      addAuditLog({
        user_id: currentUser?.id || null,
        user_name: userName,
        user_role: userRole,
        action: 'DELETE',
        entity_type: 'Invoice',
        entity_id: invoice.id,
        entity_label: invoice.invoiceNumber,
        description: `Deleted payment ${deletedPayment.paymentNumber || paymentId} of ₹${deletedPayment.amount} from invoice ${invoice.invoiceNumber}`,
      })

      // Sync Supabase
      supabase.from('invoices').update({
        amount_paid: summary.amountPaid,
        balance_due: summary.remainingBalance,
        payment_status: summary.paymentStatus,
      }).eq('id', invoice.id).then()
    }
  }

  // Supabase delete payment
  supabase.from('payments').delete().eq('id', paymentId).then()

  return true
}

/** Legacy trip payment mutation */
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
