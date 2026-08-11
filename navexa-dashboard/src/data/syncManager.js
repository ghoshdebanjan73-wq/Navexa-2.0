import { syncCustomers } from './customerStore'
import { syncVehicles } from './vehicleStore'
import { syncTrips } from './tripStore'
import { syncMaintenance } from './maintenanceStore'
import { syncPayments } from './paymentStore'
import { syncTransactions } from './transactionStore'
import { syncDrivers } from './driverStore'
import { syncInvoices } from './invoiceStore'
import { syncAuditLogs } from './auditStore'
import { supabase } from '../lib/supabase'

export async function syncAllStores(userId) {
  if (!userId) return
  try {
    // 1. Sync primary collections (Customers, Vehicles) first to resolve foreign key constraints
    await Promise.all([
      syncCustomers(userId),
      syncVehicles(userId)
    ])

    // 2. Sync secondary collections (Trips, Invoices) which reference customers & vehicles
    await Promise.all([
      syncTrips(userId),
      syncInvoices(userId),
    ])

    // 3. Sync dependent collections (Payments, Maintenance, Transactions, Drivers, Audit Logs)
    await Promise.all([
      syncMaintenance(userId),
      syncPayments(userId),
      syncTransactions(userId),
      syncDrivers(userId),
      syncAuditLogs(userId)
    ])
  } catch (err) {
    console.error('Failed to sync data with Supabase:', err)
  }
}

export function setupRealtimeSubscription(userId, callback) {
  if (!userId) return null

  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      async (payload) => {
        console.log('Realtime change detected in Supabase:', payload)
        await syncAllStores(userId)
        if (callback) callback()
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status)
    })

  return channel
}
