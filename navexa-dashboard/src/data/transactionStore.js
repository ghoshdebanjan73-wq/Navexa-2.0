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
  'Driver Payment',
  'Vehicle Service',
  'Vehicle Repair',
  'Insurance',
  'Permit',
  'Toll',
  'Parking',
  'Cleaning',
  'Office Expense',
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
        amount: Number(item.amount || 0),
        description: item.description || item.transaction || '',
        paymentMethod: item.payment_method || 'Cash',
        date: item.transaction_date || item.date || new Date().toISOString().split('T')[0],
        customerId: item.customer_id || '',
        tripId: item.trip_id || '',
        invoiceId: item.invoice_id || '',
        vehicleId: item.vehicle_id || '',
        vendor: item.vendor || '',
        reference: item.reference_number || item.reference || '',
        receiptPath: item.receipt_path || '',
        notes: item.notes || '',
        createdBy: item.created_by || 'Dispatcher',
        createdAt: item.created_at || new Date().toISOString(),
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
  const newTxn = {
    id: payload.id || `TXN-${Date.now()}`,
    type: payload.type || 'Income',
    category: payload.category || 'Other',
    amount: Math.max(0, Number(payload.amount || 0)),
    description: payload.description ? payload.description.trim() : '',
    paymentMethod: payload.paymentMethod || 'Cash',
    date: payload.date || new Date().toISOString().split('T')[0],
    customerId: payload.customerId || '',
    tripId: payload.tripId || '',
    invoiceId: payload.invoiceId || '',
    vehicleId: payload.vehicleId || '',
    vendor: payload.vendor ? payload.vendor.trim() : '',
    reference: payload.reference || payload.referenceNumber || '',
    receiptPath: payload.receiptPath || '',
    notes: payload.notes ? payload.notes.trim() : '',
    createdBy: payload.createdBy || 'Dispatcher',
    createdAt: new Date().toISOString(),
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
      amount: newTxn.amount,
      description: newTxn.description,
      payment_method: newTxn.paymentMethod,
      transaction_date: newTxn.date,
      customer_id: newTxn.customerId || null,
      trip_id: newTxn.tripId || null,
      invoice_id: newTxn.invoiceId || null,
      vehicle_id: newTxn.vehicleId || null,
      vendor: newTxn.vendor || null,
      reference_number: newTxn.reference || null,
      receipt_path: newTxn.receiptPath || null,
      notes: newTxn.notes || null,
      created_by: newTxn.createdBy,
      created_at: newTxn.createdAt,
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

/** Update transaction */
export async function updateTransaction(id, updates) {
  const idx = liveTransactions.findIndex(t => t.id === id)
  if (idx === -1) return null

  const updated = {
    ...liveTransactions[idx],
    ...updates,
    amount: Math.max(0, Number(updates.amount !== undefined ? updates.amount : liveTransactions[idx].amount)),
  }

  liveTransactions[idx] = updated
  notify()

  try {
    await supabase
      .from('finance_transactions')
      .update({
        type: updated.type,
        category: updated.category,
        amount: updated.amount,
        description: updated.description,
        payment_method: updated.paymentMethod,
        transaction_date: updated.date,
        customer_id: updated.customerId || null,
        trip_id: updated.tripId || null,
        invoice_id: updated.invoiceId || null,
        vehicle_id: updated.vehicleId || null,
        vendor: updated.vendor || null,
        reference_number: updated.reference || null,
        receipt_path: updated.receiptPath || null,
        notes: updated.notes || null,
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
 * Filter & Search Transactions
 */
export function filterAndSortTransactions(list, { search = '', type = 'All', category = 'All', paymentMethod = 'All', vehicleId = 'All', dateRange = 'All', sortBy = 'Newest' }) {
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

  // Date Range Filtering
  if (dateRange !== 'All') {
    const now = new Date()
    let cutoff = new Date()

    if (dateRange === '7D') cutoff.setDate(now.getDate() - 7)
    else if (dateRange === '30D') cutoff.setDate(now.getDate() - 30)
    else if (dateRange === '3M') cutoff.setMonth(now.getMonth() - 3)
    else if (dateRange === '6M') cutoff.setMonth(now.getMonth() - 6)
    else if (dateRange === '1Y') cutoff.setFullYear(now.getFullYear() - 1)

    result = result.filter(t => new Date(t.date) >= cutoff)
  }

  // Instant Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(t => {
      const haystack = `${t.description} ${t.category} ${t.reference || ''} ${t.invoiceId || ''} ${t.tripId || ''} ${t.vendor || ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  // Sort
  if (sortBy === 'Oldest') {
    result.sort((a, b) => new Date(a.date) - new Date(b.date))
  } else if (sortBy === 'Highest Amount') {
    result.sort((a, b) => b.amount - a.amount)
  } else if (sortBy === 'Lowest Amount') {
    result.sort((a, b) => a.amount - b.amount)
  } else {
    result.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return result
}

/**
 * Derived Finance Summary Metrics
 */
export function computeSummary() {
  const totalIncome = liveTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = liveTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const netProfit = totalIncome - totalExpenses

  // Invoices & Receivables
  const paidInvoiceRevenue = liveInvoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.totalAmount, 0)
  const pendingInvoiceAmount = liveInvoices.filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled').reduce((sum, i) => sum + i.balanceDue, 0)

  // Current Month Calculations
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthIncome = liveTransactions
    .filter(t => t.type === 'Income' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0)

  const thisMonthExpenses = liveTransactions
    .filter(t => t.type === 'Expense' && new Date(t.date).getMonth() === currentMonth && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0)

  const thisMonthProfit = thisMonthIncome - thisMonthExpenses

  return {
    income: { value: totalIncome, delta: 0, direction: 'up', sentiment: 'positive' },
    expenses: { value: totalExpenses, delta: 0, direction: 'up', sentiment: 'warning' },
    balance: { value: netProfit, delta: 0, direction: netProfit >= 0 ? 'up' : 'down', sentiment: netProfit >= 0 ? 'positive' : 'negative' },
    outstandingReceivables: pendingInvoiceAmount,
    paidInvoiceRevenue,
    pendingInvoiceAmount,
    thisMonthIncome,
    thisMonthExpenses,
    thisMonthProfit,
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
