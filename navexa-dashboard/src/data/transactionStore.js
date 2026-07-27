/**
 * transactionStore.js
 * Centralized reactive mock store for Navexa transactions.
 * Provides live-mutable lists, derived summary, and React-friendly subscriptions.
 */

import { transactions as seedTransactions, recentActivity as seedActivity, summary as seedSummary } from './mockData.js'
import { supabase } from '../lib/supabase'

// ─── Mutable state containers ─────────────────────────────────────────────
export const liveTransactions = []
export const liveActivity    = []

export async function syncTransactions(userId) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        transaction: item.transaction,
        category: item.category,
        date: item.date,
        amount: Number(item.amount) || 0,
        type: item.type,
        _session: true,
      }))

      liveTransactions.length = 0
      liveTransactions.push(...mapped)

      const snap = computeSummary()
      txnListeners.forEach(fn => fn([...liveTransactions]))
      activityListeners.forEach(fn => fn([...liveActivity]))
      summaryListeners.forEach(fn => fn(snap))
    } else {
      // Empty database, keep local store empty
      liveTransactions.length = 0
      liveActivity.length = 0

      const snap = computeSummary()
      txnListeners.forEach(fn => fn([...liveTransactions]))
      activityListeners.forEach(fn => fn([...liveActivity]))
      summaryListeners.forEach(fn => fn(snap))
    }
  } catch (err) {
    console.error('Error syncing transactions:', err)
  }
}

// ─── Subscription sets ────────────────────────────────────────────────────
const txnListeners      = new Set()
const activityListeners = new Set()
const summaryListeners  = new Set()

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

function notify() {
  const snap = computeSummary()
  txnListeners.forEach(fn => fn([...liveTransactions]))
  activityListeners.forEach(fn => fn([...liveActivity]))
  summaryListeners.forEach(fn => fn(snap))
}

// ─── Derived summary ──────────────────────────────────────────────────────
export function computeSummary() {
  const totalIncome   = liveTransactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = liveTransactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0)
  const totalBalance    = totalIncome - totalExpenses
  return {
    income:   { value: totalIncome, delta: 0, direction: 'up', sentiment: 'positive' },
    expenses: { value: totalExpenses, delta: 0, direction: 'up', sentiment: 'warning' },
    balance:  { value: totalBalance, delta: 0, direction: 'up', sentiment: 'positive' },
    trips:    { value: 0, infoText: 'No scheduled trips', sentiment: 'info' },
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────
export function addTransaction(txn) {
  const newTxn = {
    id: txn.id || `TXN-${Date.now()}`,
    ...txn,
    _session: true,
  }
  liveTransactions.unshift(newTxn)
  notify()

  // Save to Supabase in background
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase
        .from('transactions')
        .insert({
          id: newTxn.id,
          user_id: user.id,
          transaction: newTxn.transaction,
          category: newTxn.category,
          date: newTxn.date,
          amount: newTxn.amount,
          type: newTxn.type,
        })
        .then(({ error }) => {
          if (error) console.error('Error inserting transaction into Supabase:', error)
        })
    }
  })
}
export function addActivity(item) {
  liveActivity.unshift(item)
  notify()
}

// ─── Format helpers ───────────────────────────────────────────────────────
export const formatINR = n =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const formatDate = isoDate => {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
