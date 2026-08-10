/**
 * invoiceStore.js
 * Centralized reactive store for Navexa Invoices with localStorage persistence and Supabase synchronization.
 *
 * Storage Key: navexa_invoices
 */

import { supabase } from '../lib/supabase'
import { liveCustomers, getCustomerByName } from './customerStore'
import { liveTrips } from './tripStore'
import { addTransaction } from './transactionStore'

const STORAGE_KEY = 'navexa_invoices'

export const INVOICE_STATUSES = [
  'Pending',
  'In Progress',
  'Paid',
  'Cancelled',
]

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Other',
]

function loadInvoicesFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Error loading navexa_invoices from storage:', err)
  }
  return []
}

function persistInvoices() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveInvoices))
  } catch (err) {
    console.error('Error saving navexa_invoices to storage:', err)
  }
}

/** @type {InvoiceRecord[]} Central reactive array */
export const liveInvoices = loadInvoicesFromStorage()

const listeners = new Set()

export function subscribeInvoices(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  persistInvoices()
  const snap = [...liveInvoices]
  listeners.forEach(fn => fn(snap))
}

export function notifyInvoices() {
  notify()
}

/** Cloud sync from Supabase */
export async function syncInvoices(userId) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        invoiceNumber: item.invoice_number,
        tripId: item.trip_id || '',
        customerId: item.customer_id || '',
        customerName: item.customer_name,
        customerPhone: item.customer_phone || '',
        customerEmail: item.customer_email || '',
        customerAddress: item.customer_address || '',
        invoiceDate: item.invoice_date,
        dueDate: item.due_date,
        subtotal: Number(item.subtotal || 0),
        taxRate: Number(item.tax_rate || 0),
        taxAmount: Number(item.tax_amount || 0),
        totalAmount: Number(item.total_amount || 0),
        amountPaid: Number(item.amount_paid || 0),
        balanceDue: Number(item.balance_due || 0),
        paymentStatus: item.payment_status || 'Draft',
        paymentMethod: item.payment_method || '',
        paymentDate: item.payment_date || null,
        referenceNumber: item.reference_number || '',
        notes: item.notes || '',
        payments: Array.isArray(item.payments) ? item.payments : [],
        companyDetails: item.company_details || {},
        tripDetails: item.trip_details || {},
        createdBy: item.created_by,
        createdAt: item.created_at,
      }))

      liveInvoices.length = 0
      liveInvoices.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing invoices from Supabase:', err)
  }
}

/**
 * Sequential Invoice Number Generator
 * Reads company settings prefix (default "NVX") and calculates next 6-digit sequence.
 */
export async function generateNextInvoiceNumber() {
  let prefix = 'NVX'
  let startNum = 1

  try {
    const { data } = await supabase
      .from('company_profile')
      .select('invoice_prefix, starting_invoice_number')
      .maybeSingle()

    if (data) {
      if (data.invoice_prefix) prefix = data.invoice_prefix.trim().toUpperCase()
      if (data.starting_invoice_number) startNum = parseInt(data.starting_invoice_number, 10) || 1
    }
  } catch (err) {
    console.error('Could not fetch company invoice settings:', err)
  }

  // Find highest existing invoice number with prefix
  let maxSeq = startNum - 1
  liveInvoices.forEach(inv => {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(`${prefix}-`)) {
      const parts = inv.invoiceNumber.split('-')
      const num = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num
      }
    }
  })

  const nextSeq = String(maxSeq + 1).padStart(6, '0')
  return `${prefix}-${nextSeq}`
}

/**
 * Helper to fetch company profile for invoice header
 */
export async function getCompanyInvoiceDetails() {
  try {
    const { data } = await supabase
      .from('company_profile')
      .select('*')
      .maybeSingle()

    if (data) {
      return {
        businessName: data.business_name || 'Navexa Logistics',
        ownerName: data.owner_name || '',
        phone: data.phone || '+91 98765 43210',
        email: data.email || 'billing@navexa.io',
        address: [data.address, data.city, data.state, data.postal_code, data.country].filter(Boolean).join(', '),
        gstNumber: data.gst_number || '',
        logoUrl: data.logo_url || '',
      }
    }
  } catch (err) {
    console.error('Error fetching company invoice details:', err)
  }

  return {
    businessName: 'Navexa Transport & Logistics',
    ownerName: 'Management',
    phone: '+91 98765 43210',
    email: 'billing@navexa.io',
    address: '12 G.T. Road, Hooghly, West Bengal - 712101',
    gstNumber: '19AAACN1234F1Z9',
    logoUrl: '',
  }
}

/**
 * Auto generate invoice from a completed or booked trip
 */
export async function autoGenerateInvoiceFromTrip(trip, userId) {
  // Check if invoice already exists for this trip
  const existing = liveInvoices.find(inv => inv.tripId === trip.id)
  if (existing) {
    return existing
  }

  const invoiceNumber = await generateNextInvoiceNumber()
  const companyDetails = await getCompanyInvoiceDetails()
  const customerObj = getCustomerByName(trip.customer)

  const todayStr = new Date().toISOString().split('T')[0]
  const dueDateObj = new Date()
  dueDateObj.setDate(dueDateObj.getDate() + 7)
  const dueDateStr = dueDateObj.toISOString().split('T')[0]

  const totalFare = Number(trip.actualFare || trip.fare || 0)
  const isPaid = trip.paymentStatus === 'Paid'
  const initialStatus = isPaid ? 'Paid' : 'Sent'

  const newInvoice = {
    id: `INV-${Date.now()}`,
    invoiceNumber,
    tripId: trip.id,
    customerId: customerObj?.id || trip.customerId || '',
    customerName: trip.customer,
    customerPhone: customerObj?.phone || trip.driverPhone || '',
    customerEmail: customerObj?.email || '',
    customerAddress: customerObj ? [customerObj.address, customerObj.city, customerObj.state].filter(Boolean).join(', ') : '',
    invoiceDate: todayStr,
    dueDate: dueDateStr,
    subtotal: totalFare,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: totalFare,
    amountPaid: isPaid ? totalFare : 0,
    balanceDue: isPaid ? 0 : totalFare,
    paymentStatus: initialStatus,
    paymentMethod: isPaid ? 'Bank Transfer' : '',
    paymentDate: isPaid ? todayStr : null,
    referenceNumber: isPaid ? `AUTO-${trip.id}` : '',
    notes: trip.notes || `Invoice generated for trip ${trip.id}`,
    companyDetails,
    tripDetails: {
      pickupLocation: trip.pickupLocation,
      destination: trip.destination,
      driverName: trip.driverName,
      vehicle: trip.vehicle,
      vehicleReg: trip.vehicleReg,
      tripDate: trip.tripDate,
      tripTime: trip.tripTime,
      tripType: trip.tripType || 'One Way',
      estimatedDistance: trip.estimatedDistance,
    },
    createdBy: 'System',
    createdAt: new Date().toISOString(),
  }

  liveInvoices.unshift(newInvoice)
  notify()

  try {
    const { error } = await supabase.from('invoices').insert({
      id: newInvoice.id,
      invoice_number: newInvoice.invoiceNumber,
      trip_id: newInvoice.tripId,
      customer_id: newInvoice.customerId,
      customer_name: newInvoice.customerName,
      customer_phone: newInvoice.customerPhone,
      customer_email: newInvoice.customerEmail,
      customer_address: newInvoice.customerAddress,
      invoice_date: newInvoice.invoiceDate,
      due_date: newInvoice.dueDate,
      subtotal: newInvoice.subtotal,
      tax_rate: newInvoice.taxRate,
      tax_amount: newInvoice.taxAmount,
      total_amount: newInvoice.totalAmount,
      amount_paid: newInvoice.amountPaid,
      balance_due: newInvoice.balanceDue,
      payment_status: newInvoice.paymentStatus,
      payment_method: newInvoice.paymentMethod,
      payment_date: newInvoice.paymentDate,
      reference_number: newInvoice.referenceNumber,
      notes: newInvoice.notes,
      company_details: newInvoice.companyDetails,
      trip_details: newInvoice.tripDetails,
      created_at: newInvoice.createdAt,
      user_id: userId,
    })

    if (error) console.error('Error inserting invoice into Supabase:', error)
  } catch (err) {
    console.error('Failed to sync generated invoice to cloud:', err)
  }

  return newInvoice
}

/** Create manual invoice */
export async function createInvoice(payload, userId) {
  const invoiceNumber = payload.invoiceNumber || (await generateNextInvoiceNumber())
  const companyDetails = await getCompanyInvoiceDetails()

  const subtotal = Number(payload.subtotal || payload.totalAmount || 0)
  const taxRate = Number(payload.taxRate || 0)
  const taxAmount = Math.round((subtotal * taxRate) / 100)
  const totalAmount = subtotal + taxAmount
  const amountPaid = Number(payload.amountPaid || 0)
  const balanceDue = Math.max(0, totalAmount - amountPaid)

  let paymentStatus = payload.paymentStatus || 'Sent'
  if (amountPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'Paid'
  } else if (amountPaid > 0 && amountPaid < totalAmount) {
    paymentStatus = 'Partially Paid'
  }

  const newInvoice = {
    id: `INV-${Date.now()}`,
    invoiceNumber,
    tripId: payload.tripId || '',
    customerId: payload.customerId || '',
    customerName: payload.customerName.trim(),
    customerPhone: payload.customerPhone ? payload.customerPhone.trim() : '',
    customerEmail: payload.customerEmail ? payload.customerEmail.trim() : '',
    customerAddress: payload.customerAddress ? payload.customerAddress.trim() : '',
    invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: payload.dueDate || new Date().toISOString().split('T')[0],
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    amountPaid,
    balanceDue,
    paymentStatus,
    paymentMethod: payload.paymentMethod || '',
    paymentDate: payload.paymentDate || null,
    referenceNumber: payload.referenceNumber || '',
    notes: payload.notes ? payload.notes.trim() : '',
    companyDetails: payload.companyDetails || companyDetails,
    tripDetails: payload.tripDetails || {},
    createdBy: 'Dispatcher',
    createdAt: new Date().toISOString(),
  }

  liveInvoices.unshift(newInvoice)
  notify()

  try {
    const { error } = await supabase.from('invoices').insert({
      id: newInvoice.id,
      invoice_number: newInvoice.invoiceNumber,
      trip_id: newInvoice.tripId || null,
      customer_id: newInvoice.customerId || null,
      customer_name: newInvoice.customerName,
      customer_phone: newInvoice.customerPhone,
      customer_email: newInvoice.customerEmail,
      customer_address: newInvoice.customerAddress,
      invoice_date: newInvoice.invoiceDate,
      due_date: newInvoice.dueDate,
      subtotal: newInvoice.subtotal,
      tax_rate: newInvoice.taxRate,
      tax_amount: newInvoice.taxAmount,
      total_amount: newInvoice.totalAmount,
      amount_paid: newInvoice.amountPaid,
      balance_due: newInvoice.balanceDue,
      payment_status: newInvoice.paymentStatus,
      payment_method: newInvoice.paymentMethod,
      payment_date: newInvoice.paymentDate,
      reference_number: newInvoice.referenceNumber,
      notes: newInvoice.notes,
      company_details: newInvoice.companyDetails,
      trip_details: newInvoice.tripDetails,
      created_at: newInvoice.createdAt,
      user_id: userId,
    })

    if (error) console.error('Error inserting manual invoice into Supabase:', error)
  } catch (err) {
    console.error('Failed to sync manual invoice to cloud:', err)
  }

  return newInvoice
}

/** Record or update invoice payment */
export async function recordInvoicePayment(invoiceId, { amountPaid, paymentMethod, paymentDate, referenceNumber, collectedBy, notes }, userName = 'Admin') {
  const idx = liveInvoices.findIndex(inv => inv.id === invoiceId)
  if (idx === -1) throw new Error('Invoice not found.')

  const inv = liveInvoices[idx]
  const paymentAmount = Math.max(0, Number(amountPaid || 0))
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Please enter a valid payment amount greater than ₹0.')
  }

  const alreadyPaid = Number(inv.amountPaid || 0)
  const totalAmount = Number(inv.totalAmount || 0)
  const currentBalance = Number(inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, totalAmount - alreadyPaid))

  if (paymentAmount > currentBalance + 0.01) {
    throw new Error(`Payment cannot exceed the remaining balance of ₹${currentBalance.toLocaleString('en-IN')}.`)
  }

  const updatedAmountPaid = Math.min(totalAmount, alreadyPaid + paymentAmount)
  const updatedBalance = Math.max(0, totalAmount - updatedAmountPaid)

  let updatedStatus = 'Partially Paid'
  if (updatedBalance <= 0) {
    updatedStatus = 'Paid'
  }

  const existingPayments = Array.isArray(inv.payments) ? inv.payments : []
  const collector = collectedBy || userName || 'Admin'

  const paymentRecord = {
    id: `PAY-${invoiceId}-${Date.now()}`,
    paymentNumber: `Payment #${existingPayments.length + 1}`,
    date: paymentDate || new Date().toISOString().split('T')[0],
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    amount: paymentAmount,
    paymentMethod: paymentMethod || 'Cash',
    referenceNumber: referenceNumber || '',
    notes: notes || '',
    recordedBy: collector,
    collectedBy: collector,
  }

  const updatedPayments = [paymentRecord, ...existingPayments]

  const updatedInvoice = {
    ...inv,
    amountPaid: updatedAmountPaid,
    balanceDue: updatedBalance,
    paymentStatus: updatedStatus,
    paymentMethod: paymentMethod || inv.paymentMethod || 'Cash',
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    referenceNumber: referenceNumber || inv.referenceNumber || '',
    payments: updatedPayments,
  }

  liveInvoices[idx] = updatedInvoice
  notify()

  // 1. Log Income in Finance Store
  addTransaction({
    id: paymentRecord.id,
    type: 'Income',
    category: 'Invoice Payment',
    amount: paymentAmount,
    invoiceId: inv.id,
    customerId: inv.customerId || '',
    date: paymentDate || new Date().toISOString().split('T')[0],
    reference: referenceNumber || inv.invoiceNumber,
    description: `Payment received for Invoice ${inv.invoiceNumber} (${inv.customerName})`,
    paymentMethod: paymentMethod || 'Cash',
    createdBy: collector,
  })

  // 2. Persist to Supabase `invoices` table
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        amount_paid: updatedInvoice.amountPaid,
        balance_due: updatedInvoice.balanceDue,
        payment_status: updatedInvoice.paymentStatus,
        payment_method: updatedInvoice.paymentMethod,
        payment_date: updatedInvoice.paymentDate,
        reference_number: updatedInvoice.referenceNumber,
        payments: updatedInvoice.payments,
      })
      .eq('id', invoiceId)

    if (error) console.error('Error updating invoice payment in Supabase:', error)
  } catch (err) {
    console.error('Failed to update invoice payment in cloud:', err)
  }

  // 3. Persist to Supabase `payments` table
  try {
    await supabase.from('payments').upsert({
      id: paymentRecord.id,
      trip_id: inv.tripId || null,
      amount: paymentAmount,
      payment_date: paymentRecord.date,
      payment_method: paymentRecord.paymentMethod,
      notes: notes || `Invoice Payment: ${inv.invoiceNumber}`,
    })
  } catch (err) {
    console.warn('Supabase payments table insert fallback:', err)
  }

  return updatedInvoice
}

/** Update invoice status */
export async function updateInvoiceStatus(invoiceId, newStatus) {
  const idx = liveInvoices.findIndex(inv => inv.id === invoiceId)
  if (idx === -1) return

  const updated = {
    ...liveInvoices[idx],
    paymentStatus: newStatus,
  }

  liveInvoices[idx] = updated
  notify()

  try {
    const { error } = await supabase
      .from('invoices')
      .update({ payment_status: newStatus })
      .eq('id', invoiceId)

    if (error) console.error('Error updating invoice status in Supabase:', error)
  } catch (err) {
    console.error('Failed to update invoice status in cloud:', err)
  }
}

/** Delete invoice */
export async function deleteInvoice(id) {
  const idx = liveInvoices.findIndex(inv => inv.id === id)
  if (idx === -1) return false

  liveInvoices.splice(idx, 1)
  notify()

  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) console.error('Error deleting invoice from Supabase:', error)
  } catch (err) {
    console.error('Failed to delete invoice from cloud:', err)
  }

  return true
}

/** Filter and Sort Invoices */
export function filterAndSortInvoices(invoicesList, { search = '', paymentStatus = 'All', dateRange = 'All', customerId = 'All', sortBy = 'Newest' }) {
  let result = [...invoicesList]

  // Status Filter
  if (paymentStatus !== 'All') {
    result = result.filter(inv => inv.paymentStatus === paymentStatus)
  }

  // Customer Filter
  if (customerId !== 'All') {
    result = result.filter(inv => inv.customerId === customerId || inv.customerName.toLowerCase() === customerId.toLowerCase())
  }

  // Search Filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(inv => {
      const haystack = `${inv.invoiceNumber} ${inv.customerName} ${inv.tripId} ${inv.notes || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sorting
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.createdAt || a.invoiceDate) - new Date(b.createdAt || b.invoiceDate))
  } else if (sortBy === 'Highest Amount') {
    result.sort((a, b) => b.totalAmount - a.totalAmount)
  } else if (sortBy === 'Lowest Amount') {
    result.sort((a, b) => a.totalAmount - b.totalAmount)
  } else {
    // Newest
    result.sort((a, b) => new Date(b.createdAt || b.invoiceDate) - new Date(a.createdAt || a.invoiceDate))
  }

  return result
}

/** Calculate Invoice Dashboard Statistics */
export function getInvoiceStats() {
  const total = liveInvoices.length
  const paidList = liveInvoices.filter(inv => inv.paymentStatus === 'Paid')
  const paidCount = paidList.length
  const pendingCount = liveInvoices.filter(inv => inv.paymentStatus === 'Pending' || inv.paymentStatus === 'In Progress' || inv.paymentStatus === 'Sent' || inv.paymentStatus === 'Partially Paid').length
  const overdueCount = liveInvoices.filter(inv => inv.paymentStatus === 'Overdue').length

  const totalPaidRevenue = liveInvoices.reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0)
  const totalPendingReceivables = liveInvoices
    .filter(inv => inv.paymentStatus !== 'Cancelled' && inv.paymentStatus !== 'Paid')
    .reduce((sum, inv) => {
      const tot = Number(inv.totalAmount || 0)
      const paid = Number(inv.amountPaid || 0)
      const computedBal = Math.max(0, tot - paid)
      const bal = inv.balanceDue !== undefined && !isNaN(Number(inv.balanceDue))
        ? Number(inv.balanceDue)
        : computedBal
      return sum + (isNaN(bal) ? 0 : bal)
    }, 0)

  // Revenue this month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const revenueThisMonth = liveInvoices
    .filter(inv => {
      const d = new Date(inv.paymentDate || inv.createdAt)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0)

  return {
    total,
    paidCount,
    pendingCount,
    overdueCount,
    totalPaidRevenue,
    totalPendingReceivables,
    revenueThisMonth,
  }
}
