import { syncCustomers } from './customerStore'
import { syncVehicles } from './vehicleStore'
import { syncTrips } from './tripStore'
import { syncMaintenance } from './maintenanceStore'
import { syncPayments } from './paymentStore'
import { syncTransactions } from './transactionStore'

export async function syncAllStores(userId) {
  if (!userId) return
  console.log('Initiating full Supabase cloud synchronization for user:', userId)
  try {
    // 1. Sync primary collections (Customers, Vehicles) first to resolve foreign key constraints
    await Promise.all([
      syncCustomers(userId),
      syncVehicles(userId)
    ])

    // 2. Sync secondary collections (Trips) which reference customers & vehicles
    await syncTrips(userId)

    // 3. Sync dependent collections (Payments, Maintenance, Transactions)
    await Promise.all([
      syncMaintenance(userId),
      syncPayments(userId),
      syncTransactions(userId)
    ])

    console.log('Supabase cloud synchronization completed successfully.')
  } catch (err) {
    console.error('Failed to sync data with Supabase:', err)
  }
}
