/**
 * transactionStore.js
 * Comprehensive Finance & Expense Store for Navexa.
 * Synchronizes real-time income and expense transactions, invoice payments, and vehicle/trip financial linkages.
 *
 * Storage Key: navexa_finance_transactions
 */

import { supabase } from '../lib/supabase'
import { liveInvoices } from './invoiceStore'

const STORAGE_KEY = 'navexa_finance_transactions'

export const EXPENSE_CATEGORIES = [
  'Fuel',
  'Petrol',
  'Diesel',
  'CNG',
  'Fastag',
  'Toll',
  'Parking',
  'Vehicle Service',
  'Vehicle Repair',
  'Maintenance',
  'Tyres',
  'Insurance',
  'Tax',
  'Cleaning',
  'Driver Salary',
  'Driver Allowance',
  'Driver Payment',
  'Office Expense',
  'Miscellaneous',
  'Permit',
  'Software',
  'Marketing',
  'Other',
]

export const INCOME_CATEGORIES = [
  'Invoice Payment',
  'Trip Fare',
  'Contract Payment',
  'Lease / Hire',
  'Other Income',
]

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Cheque',
  'Other',
]

function loadTransactionsFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Error loading navexa_finance_transactions from storage:', err)
  }
  return []
}

function persistTransactions() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveTransactions))
  } catch (err) {
    console.error('Error saving navexa_finance_transactions to storage:', err)
  }
}

/** @type {TransactionRecord[]} Live mutable array */
export const liveTransactions = loadTransactionsFromStorage()
export const liveActivity = []

const txnListeners = new Set()
const activityListeners = new Set()
const summaryListeners = new Set()

export function subscribeTxn(fn) {
  txnListeners.add(fn)
  return () => txnListeners.delete(fn)
}
export function subscribeActivity(fn) {
  activityListeners.add(fn)
  return () => activityListeners.delete(fn)
}
export function subscribeSummary(fn) {
  summaryListeners.add(fn)
  return () => summaryListeners.delete(fn)
}

export function addActivity(act) {
  const item = { id: Date.now(), ...act }
  liveActivity.unshift(item)
  activityListeners.forEach(fn => fn([...liveActivity]))
  return item
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function notify() {
  persistTransactions()
  const snap = computeSummary()
  txnListeners.forEach(fn => fn([...liveTransactions]))
  activityListeners.forEach(fn => fn([...liveActivity]))
  summaryListeners.forEach(fn => fn(snap))
}

/** Cloud sync from Supabase */
export async function syncTransactions(userId) {
  try {
    // Try finance_transactions table first, fallback to transactions
    let { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })

    if (error) {
      // Fallback
      const res = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
      data = res.data
    }

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        type: item.type || (item.category === 'Fuel' || item.category === 'Maintenance' ? 'Expense' : 'Income'),
        category: item.category || 'Other',
        subcategory: item.subcategory || '',
        amount: Number(item.amount || 0),
        description: item.description || item.transaction || '',
        paymentMethod: item.payment_method || 'Cash',
        date: item.transaction_date || item.date || new Date().toISOString().split('T')[0],
        time: item.time || '',
        customerId: item.customer_id || '',
        tripId: item.trip_id || '',
        invoiceId: item.invoice_id || '',
        vehicleId: item.vehicle_id || '',
        driverId: item.driver_id || '',
        vendor: item.vendor || '',
        vendorPhone: item.vendor_phone || '',
        billNumber: item.bill_number || item.reference_number || item.reference || '',
        reference: item.reference_number || item.reference || '',
        receiptPath: item.receipt_path || '',
        notes: item.notes || '',
        createdBy: item.created_by || 'Dispatcher',
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.updated_at || '',
      }))

      liveTransactions.length = 0
      liveTransactions.push(...mapped)
      notify()
    }
  } catch (err) {
    console.error('Error syncing finance transactions:', err)
  }
}

/**
 * Add a new Income or Expense transaction
 */
export async function addTransaction(payload, userId) {
  const nowISO = new Date().toISOString()
  const newTxn = {
    id: payload.id || `TXN-${Date.now()}`,
    type: payload.type || 'Income',
    category: payload.category || 'Other',
    subcategory: payload.subcategory || '',
    amount: Math.max(0, Number(payload.amount || 0)),
    description: payload.description ? payload.description.trim() : '',
    paymentMethod: payload.paymentMethod || 'Cash',
    date: payload.date || new Date().toISOString().split('T')[0],
    time: payload.time || new Date().toTimeString().slice(0, 5),
    customerId: payload.customerId || '',
    tripId: payload.tripId || '',
    invoiceId: payload.invoiceId || '',
    vehicleId: payload.vehicleId || '',
    driverId: payload.driverId || '',
    vendor: payload.vendor ? payload.vendor.trim() : '',
    vendorPhone: payload.vendorPhone ? payload.vendorPhone.trim() : '',
    billNumber: payload.billNumber || payload.reference || payload.referenceNumber || '',
    reference: payload.reference || payload.referenceNumber || payload.billNumber || '',
    receiptPath: payload.receiptPath || '',
    notes: payload.notes ? payload.notes.trim() : '',
    createdBy: payload.createdBy || 'Dispatcher',
    createdAt: nowISO,
    updatedAt: nowISO,
  }

  // Idempotent Invoice check: If transaction has invoiceId, prevent duplicate invoice payments
  if (newTxn.invoiceId) {
    const existingIdx = liveTransactions.findIndex(t => t.invoiceId === newTxn.invoiceId && t.reference === newTxn.reference)
    if (existingIdx !== -1) {
      liveTransactions[existingIdx] = newTxn
      notify()
      return newTxn
    }
  }

  liveTransactions.unshift(newTxn)
  notify()

  try {
    const { error } = await supabase.from('finance_transactions').insert({
      id: newTxn.id,
      type: newTxn.type,
      category: newTxn.category,
      subcategory: newTxn.subcategory || null,
      amount: newTxn.amount,
      description: newTxn.description,
      payment_method: newTxn.paymentMethod,
      transaction_date: newTxn.date,
      time: newTxn.time || null,
      customer_id: newTxn.customerId || null,
      trip_id: newTxn.tripId || null,
      invoice_id: newTxn.invoiceId || null,
      vehicle_id: newTxn.vehicleId || null,
      driver_id: newTxn.driverId || null,
      vendor: newTxn.vendor || null,
      vendor_phone: newTxn.vendorPhone || null,
      bill_number: newTxn.billNumber || null,
      reference_number: newTxn.reference || null,
      receipt_path: newTxn.receiptPath || null,
      notes: newTxn.notes || null,
      created_by: newTxn.createdBy,
      created_at: newTxn.createdAt,
      updated_at: newTxn.updatedAt,
      user_id: userId,
    })

    if (error) {
      // Fallback insert into legacy transactions table
      await supabase.from('transactions').insert({
        id: newTxn.id,
        transaction: newTxn.description,
        category: newTxn.category,
        date: newTxn.date,
        amount: newTxn.amount,
        type: newTxn.type,
        user_id: userId,
      })
    }
  } catch (err) {
    console.error('Failed to sync transaction to cloud:', err)
  }

  return newTxn
}

/** Remove transaction by ID or reference string */
export async function removeTransactionByReference(idOrRef) {
  const idx = liveTransactions.findIndex(t => t.id === idOrRef || t.reference === idOrRef)
  if (idx === -1) return false

  const target = liveTransactions[idx]
  liveTransactions.splice(idx, 1)
  notify()

  try {
    await supabase.from('finance_transactions').delete().eq('id', target.id)
  } catch (err) {
    console.error('Error removing transaction from cloud:', err)
  }
  return true
}

/** Update transaction */
export async function updateTransaction(id, updates) {
  const idx = liveTransactions.findIndex(t => t.id === id)
  if (idx === -1) return null

  const updated = {
    ...liveTransactions[idx],
    ...updates,
    amount: Math.max(0, Number(updates.amount !== undefined ? updates.amount : liveTransactions[idx].amount)),
    updatedAt: new Date().toISOString(),
  }

  liveTransactions[idx] = updated
  notify()

  try {
    await supabase
      .from('finance_transactions')
      .update({
        type: updated.type,
        category: updated.category,
        subcategory: updated.subcategory || null,
        amount: updated.amount,
        description: updated.description,
        payment_method: updated.paymentMethod,
        transaction_date: updated.date,
        time: updated.time || null,
        customer_id: updated.customerId || null,
        trip_id: updated.tripId || null,
        invoice_id: updated.invoiceId || null,
        vehicle_id: updated.vehicleId || null,
        driver_id: updated.driverId || null,
        vendor: updated.vendor || null,
        vendor_phone: updated.vendorPhone || null,
        bill_number: updated.billNumber || null,
        reference_number: updated.reference || null,
        receipt_path: updated.receiptPath || null,
        notes: updated.notes || null,
        updated_at: updated.updatedAt,
      })
      .eq('id', id)
  } catch (err) {
    console.error('Error updating transaction in cloud:', err)
  }

  return updated
}

/** Delete transaction */
export async function deleteTransaction(id) {
  const idx = liveTransactions.findIndex(t => t.id === id)
  if (idx === -1) return false

  liveTransactions.splice(idx, 1)
  notify()

  try {
    await supabase.from('finance_transactions').delete().eq('id', id)
    await supabase.from('transactions').delete().eq('id', id)
  } catch (err) {
    console.error('Error deleting transaction from cloud:', err)
  }

  return true
}

/**
/**
 * Filter & Search Transactions with support for exact Date Bounds
 */
export function filterAndSortTransactions(list, {
  search = '',
  type = 'All',
  category = 'All',
  paymentMethod = 'All',
  vehicleId = 'All',
  driverId = 'All',
  paymentStatus = 'All',
  startDate = null,
  endDate = null,
  dateRange = 'All',
  sortBy = 'Newest',
  // Lookup maps for enriched search
  customerMap = {},
  vehicleMap = {},
  driverMap = {},
  tripMap = {},
  invoiceMap = {},
} = {}) {
  let result = [...list]

  if (type !== 'All') {
    result = result.filter(t => t.type === type)
  }

  if (category !== 'All') {
    result = result.filter(t => t.category === category)
  }

  if (paymentMethod !== 'All') {
    result = result.filter(t => t.paymentMethod === paymentMethod)
  }

  if (vehicleId !== 'All') {
    result = result.filter(t => t.vehicleId === vehicleId)
  }

  if (driverId !== 'All') {
    result = result.filter(t => t.driverId === driverId)
  }

  // Exact Start/End Date Bounds Filtering
  if (startDate || endDate) {
    result = result.filter(t => {
      if (!t.date) return false
      const tDate = new Date(t.date)
      if (isNaN(tDate.getTime())) return false
      if (startDate && tDate < startDate) return false
      if (endDate && tDate > endDate) return false
      return true
    })
  } else if (dateRange !== 'All' && dateRange !== 'Custom') {
    const now = new Date()
    let cutoff = new Date()
    if (dateRange === '7D' || dateRange === 'This Week') cutoff.setDate(now.getDate() - 7)
    else if (dateRange === '30D' || dateRange === 'This Month') cutoff.setDate(now.getDate() - 30)
    else if (dateRange === '3M') cutoff.setMonth(now.getMonth() - 3)
    else if (dateRange === '6M') cutoff.setMonth(now.getMonth() - 6)
    else if (dateRange === '1Y' || dateRange === 'This Year') cutoff.setFullYear(now.getFullYear() - 1)
    result = result.filter(t => new Date(t.date) >= cutoff)
  }

  // Multi-Field Search (Customer, Driver, Vehicle, Invoice #, Trip ID, Category, Payment Method, Reference, Vendor, Bill Number, Transaction ID)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(t => {
      const customerName = customerMap[t.customerId]?.name || ''
      const customerPhone = customerMap[t.customerId]?.phone || ''
      const vehicleName = vehicleMap[t.vehicleId]?.name || ''
      const vehicleReg = vehicleMap[t.vehicleId]?.registration || ''
      const driverName = driverMap[t.driverId]?.name || ''
      const tripRef = tripMap[t.tripId]?.id || t.tripId || ''
      const invoiceRef = invoiceMap[t.invoiceId]?.invoiceNumber || t.invoiceId || ''
      const haystack = [
        t.id, t.description, t.category, t.subcategory,
        t.reference, t.billNumber, t.invoiceId, t.tripId,
        t.vehicleId, t.driverId, t.vendor, t.vendorPhone,
        t.paymentMethod, t.createdBy, t.notes,
        customerName, customerPhone, vehicleName, vehicleReg,
        driverName, tripRef, invoiceRef
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sort
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
  } else if (sortBy === 'Highest Amount') {
    result.sort((a, b) => b.amount - a.amount)
  } else if (sortBy === 'Lowest Amount') {
    result.sort((a, b) => a.amount - b.amount)
  } else if (sortBy === 'Customer Name') {
    result.sort((a, b) => {
      const ca = customerMap[a.customerId]?.name || a.description || ''
      const cb = customerMap[b.customerId]?.name || b.description || ''
      return ca.localeCompare(cb)
    })
  } else if (sortBy === 'Vehicle') {
    result.sort((a, b) => {
      const va = vehicleMap[a.vehicleId]?.name || a.vehicleId || ''
      const vb = vehicleMap[b.vehicleId]?.name || b.vehicleId || ''
      return va.localeCompare(vb)
    })
  } else {
    // Newest First (default)
    result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }

  return result
}

/**
 * Filtered Financial Summary Calculator
 * Computes exact totals, receivables, expense breakdowns, and daily averages for selected date range bounds.
 */
export function computeFilteredFinancialSummary(transactions = [], invoices = [], trips = [], dateBounds = {}) {
  const { startDate, endDate, label = 'Selected Period', daysCount = 1 } = dateBounds

  // Filter transactions within date bounds
  const periodTxns = transactions.filter(t => {
    if (!startDate && !endDate) return true
    if (!t.date) return false
    const d = new Date(t.date)
    if (isNaN(d.getTime())) return false
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })

  // Filter trips within date bounds
  const periodTrips = trips.filter(t => {
    if (!startDate && !endDate) return true
    if (!t.tripDate) return true
    const d = new Date(t.tripDate)
    if (isNaN(d.getTime())) return true
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })

  // Filter invoices within date bounds
  const periodInvoices = invoices.filter(i => {
    if (!startDate && !endDate) return true
    const d = new Date(i.issueDate || i.createdAt || Date.now())
    if (isNaN(d.getTime())) return true
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })

  // Totals
  const totalIncome = periodTxns.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = periodTxns.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // Outstanding Payments (Unpaid & Partial Balance Due)
  const outstandingPayments = periodInvoices
    .filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0)

  // Expense Category Breakdowns
  const fuelExpenses = periodTxns
    .filter(t => t.type === 'Expense' && (t.category === 'Fuel' || (t.description && t.description.toLowerCase().includes('fuel'))))
    .reduce((sum, t) => sum + t.amount, 0)

  const tollExpenses = periodTxns
    .filter(t => t.type === 'Expense' && (t.category === 'Toll' || (t.description && t.description.toLowerCase().includes('toll'))))
    .reduce((sum, t) => sum + t.amount, 0)

  const maintenanceExpenses = periodTxns
    .filter(t => t.type === 'Expense' && (t.category === 'Vehicle Service' || t.category === 'Vehicle Repair' || t.category === 'Maintenance' || (t.description && t.description.toLowerCase().includes('service'))))
    .reduce((sum, t) => sum + t.amount, 0)

  const driverExpenses = periodTxns
    .filter(t => t.type === 'Expense' && (t.category === 'Driver Payment' || (t.description && t.description.toLowerCase().includes('driver'))))
    .reduce((sum, t) => sum + t.amount, 0)

  const specifiedCatExpenses = fuelExpenses + tollExpenses + maintenanceExpenses + driverExpenses
  const otherExpenses = Math.max(0, totalExpenses - specifiedCatExpenses)

  // Daily Averages
  const safeDays = Math.max(1, daysCount)
  const avgDailyIncome = Math.round(totalIncome / safeDays)
  const avgDailyExpense = Math.round(totalExpenses / safeDays)
  const avgDailyProfit = Math.round(netProfit / safeDays)

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    outstandingPayments,
    totalTrips: periodTrips.length,
    fuelExpenses,
    tollExpenses,
    maintenanceExpenses,
    driverExpenses,
    otherExpenses,
    periodLabel: label,
    totalDays: safeDays,
    avgDailyIncome,
    avgDailyExpense,
    avgDailyProfit,
    filteredTxnList: periodTxns,
  }
}

/**
 * Derived Finance Summary Metrics (Default Global Summary)
 */
export function computeSummary() {
  const totalIncome = liveTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = liveTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // Invoices & Receivables
  const paidInvoiceRevenue = liveInvoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0)
  const pendingInvoiceAmount = liveInvoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled').reduce((sum, i) => sum + i.balanceDue, 0)

  return {
    income: { value: totalIncome, delta: 0, direction: 'up', sentiment: 'positive' },
    expenses: { value: totalExpenses, delta: 0, direction: 'up', sentiment: 'warning' },
    balance: { value: netProfit, delta: 0, direction: netProfit >= 0 ? 'up' : 'down', sentiment: netProfit >= 0 ? 'positive' : 'negative' },
    outstandingReceivables: pendingInvoiceAmount,
    paidInvoiceRevenue,
    pendingInvoiceAmount,
  }
}

/**
 * Vehicle Specific Expenses Helper
 */
export function getVehicleExpenses(vehicleId) {
  if (!vehicleId) return { list: [], total: 0 }
  const list = liveTransactions.filter(t => t.type === 'Expense' && t.vehicleId === vehicleId)
  const total = list.reduce((sum, t) => sum + t.amount, 0)
  return { list, total }
}

/**
 * Trip Profitability Calculator
 */
export function getTripProfitability(tripId, tripFare = 0) {
  if (!tripId) return { revenue: tripFare, expenses: 0, profit: tripFare }
  const tripExpenses = liveTransactions
    .filter(t => t.type === 'Expense' && t.tripId === tripId)
    .reduce((sum, t) => sum + t.amount, 0)

  const tripIncomes = liveTransactions
    .filter(t => t.type === 'Income' && t.tripId === tripId)
    .reduce((sum, t) => sum + t.amount, 0)

  const revenue = tripIncomes > 0 ? tripIncomes : Number(tripFare || 0)
  const profit = revenue - tripExpenses

  return { revenue, expenses: tripExpenses, profit }
}
