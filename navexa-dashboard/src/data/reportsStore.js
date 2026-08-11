/**
 * reportsStore.js
 * Analytics Store for Navexa Reports & Business Performance.
 * Reads from existing data stores (transactionStore, tripStore, invoiceStore, customerStore, vehicleStore, driverStore).
 * Provides date-range filtering, metrics calculation, and CSV data exports.
 */

import { liveTransactions } from './transactionStore'
import { liveTrips } from './tripStore'
import { liveInvoices } from './invoiceStore'
import { liveCustomers } from './customerStore'
import { liveVehicles } from './vehicleStore'
import { liveDrivers } from './driverStore'

export const DATE_RANGES = [
  'This Month',
  'Last Month',
  'Last 3 Months',
  'Last 6 Months',
  'This Year',
  'All Time',
  'Custom Range',
]

/**
 * Returns date range boundaries { startDate, endDate, label }
 */
export function getDateBoundaries(dateRange, customStart, customEnd) {
  const now = new Date()
  let start = new Date(now.getFullYear(), now.getMonth(), 1)
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  if (dateRange === 'Last Month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  } else if (dateRange === 'Last 3 Months') {
    start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  } else if (dateRange === 'Last 6 Months') {
    start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  } else if (dateRange === 'This Year') {
    start = new Date(now.getFullYear(), 0, 1)
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  } else if (dateRange === 'All Time') {
    start = new Date(1970, 0, 1)
    end = new Date(now.getFullYear() + 10, 11, 31, 23, 59, 59)
  } else if (dateRange === 'Custom Range' && customStart && customEnd) {
    start = new Date(customStart)
    end = new Date(customEnd)
    end.setHours(23, 59, 59)
  }

  return { start, end }
}

/**
 * Filter all domain records by date boundaries
 */
export function getFilteredReportData({ dateRange = 'This Month', customStart = '', customEnd = '' }) {
  const { start, end } = getDateBoundaries(dateRange, customStart, customEnd)

  const isBetween = (dateStr) => {
    if (!dateStr) return true
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return true
    return d >= start && d <= end
  }

  const transactions = liveTransactions.filter(t => isBetween(t.date || t.createdAt))
  const trips = liveTrips.filter(t => isBetween(t.tripDate || t.createdAt))
  const invoices = liveInvoices.filter(i => isBetween(i.invoiceDate || i.createdAt))
  const customers = liveCustomers.filter(c => isBetween(c.createdAt))
  const vehicles = [...liveVehicles]
  const drivers = [...liveDrivers]

  return {
    start,
    end,
    dateRange,
    transactions,
    trips,
    invoices,
    customers,
    vehicles,
    drivers,
  }
}

/**
 * 1. Business Overview Summary
 */
export function computeBusinessOverview({ transactions, trips, invoices }) {
  // Revenue from collected finance income and paid invoices
  const txnIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const invoicePaidRevenue = invoices
    .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0)

  const totalRevenue = Math.max(txnIncome, invoicePaidRevenue)

  // Total expenses
  const totalExpenses = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Net Profit
  const netProfit = totalRevenue - totalExpenses

  // Completed & active operational trips
  const completedTrips = trips.filter(t => ['Completed', 'Started', 'Ongoing', 'Passenger Picked Up', 'Vehicle Assigned', 'Driver Assigned', 'Booked', 'Confirmed'].includes(t.status)).length

  // Outstanding receivables
  const outstandingReceivables = invoices
    .filter(i => i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => {
      const tot = Number(i.totalAmount || 0)
      const paid = Number(i.amountPaid || 0)
      const computedBal = Math.max(0, tot - paid)
      const bal = i.balanceDue !== undefined && !isNaN(Number(i.balanceDue))
        ? Number(i.balanceDue)
        : computedBal
      return sum + (isNaN(bal) ? 0 : bal)
    }, 0)

  const totalCustomers = liveCustomers.length

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    completedTrips,
    outstandingReceivables,
    totalCustomers,
  }
}

/**
 * 2. Financial Performance Trend
 */
export function computeFinancialPerformance({ transactions, start, end }) {
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  const isMonthlyGroup = diffDays > 45

  const trendMap = new Map()

  transactions.forEach(t => {
    const d = new Date(t.date || t.createdAt)
    let key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    if (isMonthlyGroup) {
      key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    }

    if (!trendMap.has(key)) {
      trendMap.set(key, { period: key, income: 0, expenses: 0, profit: 0 })
    }

    const rec = trendMap.get(key)
    if (t.type === 'Income') rec.income += t.amount
    else if (t.type === 'Expense') rec.expenses += t.amount
    rec.profit = rec.income - rec.expenses
  })

  const trend = Array.from(trendMap.values())
  return { trend, isMonthlyGroup }
}

/**
 * 3. Trip Performance & Volume Trend
 */
export function computeTripPerformance({ trips }) {
  const totalTrips = trips.length
  const completedTrips = trips.filter(t => ['Completed', 'Started', 'Ongoing', 'Passenger Picked Up', 'Vehicle Assigned', 'Driver Assigned'].includes(t.status)).length
  const upcomingTrips = trips.filter(t => t.status === 'Booked' || t.status === 'Confirmed').length
  const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length

  const totalTripRevenue = trips
    .filter(t => t.status !== 'Cancelled')
    .reduce((sum, t) => sum + (Number(t.actualFare || t.fare) || 0), 0)

  const averageTripValue = completedTrips > 0 ? Math.round(totalTripRevenue / completedTrips) : 0

  return {
    totalTrips,
    completedTrips,
    upcomingTrips,
    cancelledTrips,
    totalTripRevenue,
    averageTripValue,
  }
}

/**
 * 4. Customer Performance & Top Customers
 */
export function computeCustomerPerformance({ trips, invoices }) {
  const totalCustomers = liveCustomers.length
  const customerMap = new Map()

  // Pre-populate with all registered customers
  liveCustomers.forEach(c => {
    customerMap.set(c.name.trim().toLowerCase(), {
      name: c.name,
      phone: c.phone || '',
      email: c.email || '',
      completedTrips: 0,
      revenue: 0,
      outstanding: 0,
    })
  })

  // Attribute trips
  trips.forEach(t => {
    if (!t.customer) return
    const key = t.customer.trim().toLowerCase()
    if (!customerMap.has(key)) {
      customerMap.set(key, { name: t.customer, phone: '', email: '', completedTrips: 0, revenue: 0, outstanding: 0 })
    }
    const rec = customerMap.get(key)
    if (['Completed', 'Started', 'Ongoing', 'Passenger Picked Up', 'Vehicle Assigned', 'Driver Assigned', 'Booked', 'Confirmed'].includes(t.status)) {
      rec.completedTrips += 1
    }
    if (t.status === 'Completed' || t.paymentStatus === 'Paid') {
      rec.revenue += Number(t.actualFare || t.fare || 0)
    }
  })

  // Attribute invoices (revenue & outstanding balance)
  invoices.forEach(i => {
    if (!i.customerName) return
    const key = i.customerName.trim().toLowerCase()
    if (!customerMap.has(key)) {
      customerMap.set(key, { name: i.customerName, phone: i.customerPhone || '', email: i.customerEmail || '', completedTrips: 0, revenue: 0, outstanding: 0 })
    }
    const rec = customerMap.get(key)
    const paid = Number(i.amountPaid || 0)
    const bal = Number(i.balanceDue !== undefined ? i.balanceDue : Math.max(0, (i.totalAmount || 0) - paid))

    if (rec.revenue === 0 || paid > rec.revenue) {
      rec.revenue = Math.max(rec.revenue, paid)
    }

    if (i.paymentStatus !== 'Paid' && i.paymentStatus !== 'Cancelled') {
      rec.outstanding += bal
    }
  })

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => (b.revenue + b.completedTrips * 100) - (a.revenue + a.completedTrips * 100))

  const repeatCustomers = Array.from(customerMap.values()).filter(c => c.completedTrips > 1).length
  const newCustomers = Math.max(0, totalCustomers - repeatCustomers)

  return {
    totalCustomers,
    newCustomers,
    repeatCustomers,
    topCustomers,
  }
}

/**
 * 5. Fleet Vehicle Performance & Utilization (Side-by-Side Comparison)
 */
export function computeVehiclePerformance({ trips, transactions, invoices }) {
  const fleet = liveVehicles.map(veh => {
    const vehNameLower = veh.name.trim().toLowerCase()
    const vehRegLower = (veh.reg || veh.registrationNumber || '').trim().toLowerCase()

    const vehTrips = trips.filter(t => {
      if (t.vehicleId && t.vehicleId === veh.id) return true
      if (t.vehicle && (t.vehicle.toLowerCase().includes(vehNameLower) || (vehRegLower && t.vehicle.toLowerCase().includes(vehRegLower)))) return true
      if (t.vehicleReg && vehRegLower && t.vehicleReg.toLowerCase().includes(vehRegLower)) return true
      return false
    })

    const completedTrips = vehTrips.filter(t => ['Completed', 'Started', 'Ongoing', 'Passenger Picked Up', 'Vehicle Assigned', 'Driver Assigned'].includes(t.status)).length

    let tripRevenue = vehTrips
      .reduce((sum, t) => {
        const inv = invoices.find(i => i.tripId === t.id)
        if (inv && Number(inv.amountPaid || 0) > 0) return sum + Number(inv.amountPaid)
        if (t.status === 'Completed' || t.paymentStatus === 'Paid') return sum + Number(t.actualFare || t.fare || 0)
        return sum + Number(t.fare || 0)
      }, 0)

    const recordedExpenses = transactions
      .filter(t => t.type === 'Expense' && (t.vehicleId === veh.id || (t.description && t.description.toLowerCase().includes(vehNameLower))))
      .reduce((sum, t) => sum + t.amount, 0)

    const estimatedProfit = tripRevenue - recordedExpenses

    return {
      id: veh.id,
      name: veh.name,
      registration: veh.registration || veh.reg || veh.registrationNumber || 'N/A',
      type: veh.type || 'Sedan',
      status: veh.status || 'Available',
      completedTrips,
      tripRevenue,
      recordedExpenses,
      estimatedProfit,
    }
  })

  return fleet
}

/**
 * 6. Expense Categorization Breakdown
 */
export function computeExpenseBreakdown({ transactions }) {
  const expenseTxns = transactions.filter(t => t.type === 'Expense')
  const totalExpenseAmount = expenseTxns.reduce((sum, t) => sum + t.amount, 0)

  const catMap = new Map()

  expenseTxns.forEach(t => {
    const cat = t.category || 'Other'
    catMap.set(cat, (catMap.get(cat) || 0) + t.amount)
  })

  const breakdown = Array.from(catMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount)

  return { breakdown, totalExpenseAmount }
}

/**
 * 7. Driver Basic Performance
 */
export function computeDriverPerformance({ trips }) {
  return liveDrivers.map(d => {
    const driverNameLower = d.fullName.trim().toLowerCase()
    const driverTrips = trips.filter(t => {
      if (t.driverId && t.driverId === d.id) return true
      if (t.driverName && t.driverName.trim().toLowerCase() === driverNameLower) return true
      return false
    })

    const completedTrips = driverTrips.filter(t => ['Completed', 'Started', 'Ongoing', 'Passenger Picked Up', 'Driver Assigned'].includes(t.status)).length
    const tripRevenue = driverTrips
      .reduce((sum, t) => sum + Number(t.actualFare || t.fare || 0), 0)

    return {
      id: d.id,
      fullName: d.fullName,
      phone: d.phone,
      assignedVehicleName: d.assignedVehicleName || 'Unassigned',
      status: d.status || 'Active',
      completedTrips,
      tripRevenue,
    }
  })
}

/**
 * CSV Exporter for Reports
 */
export function exportToCSV(reportType, data, dateLabel = 'This Month') {
  let filename = `Navexa_${reportType}_${dateLabel.replace(/\s+/g, '_')}.csv`
  let csvContent = ''

  if (reportType === 'Financial_Transactions') {
    csvContent = 'Date,Description,Category,Type,Payment Method,Amount,Reference\n'
    data.forEach(t => {
      csvContent += `"${t.date}","${t.description.replace(/"/g, '""')}","${t.category}","${t.type}","${t.paymentMethod}",${t.amount},"${t.reference || ''}"\n`
    })
  } else if (reportType === 'Trips') {
    csvContent = 'Trip ID,Customer,Pickup,Destination,Driver,Vehicle,Date,Fare,Status\n'
    data.forEach(t => {
      csvContent += `"${t.id}","${t.customer}","${t.pickupLocation}","${t.destination}","${t.driverName}","${t.vehicle}","${t.tripDate}",${t.actualFare || t.fare},"${t.status}"\n`
    })
  } else if (reportType === 'Customers') {
    csvContent = 'Customer Name,Phone,Email,Completed Trips,Revenue,Outstanding\n'
    data.forEach(c => {
      csvContent += `"${c.name}","${c.phone}","${c.email || ''}",${c.completedTrips || 0},${c.revenue || 0},${c.outstanding || 0}\n`
    })
  } else if (reportType === 'Vehicle_Performance') {
    csvContent = 'Vehicle Name,Registration,Completed Trips,Trip Revenue,Recorded Expenses,Net Profit\n'
    data.forEach(v => {
      csvContent += `"${v.name}","${v.registration}",${v.completedTrips},${v.tripRevenue},${v.recordedExpenses},${v.estimatedProfit}\n`
    })
  } else if (reportType === 'Outstanding_Payments') {
    csvContent = 'Invoice Number,Customer,Invoice Date,Due Date,Total Amount,Amount Paid,Balance Due,Status\n'
    data.forEach(i => {
      csvContent += `"${i.invoiceNumber}","${i.customerName}","${i.invoiceDate}","${i.dueDate}",${i.totalAmount},${i.amountPaid},${i.balanceDue},"${i.paymentStatus}"\n`
    })
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
