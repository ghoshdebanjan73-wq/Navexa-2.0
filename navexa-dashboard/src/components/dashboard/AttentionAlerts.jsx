import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle2, FileText, Route, Car, ArrowRight, ChevronRight } from 'lucide-react'
import { liveInvoices, getInvoiceStats, subscribeInvoices } from '../../data/invoiceStore'
import { liveTrips, subscribeTrips, isTripNeedsAssignment } from '../../data/tripStore'
import { liveVehicles, subscribeVehicles, getMaintenanceAlert, getInsuranceStatus } from '../../data/vehicleStore'
import { useRouter } from '../../context/RouterContext'
import { formatINR } from '../../data/tripStore'

/**
 * LEVEL 1 — Attention & Action Required Alert Banner / Section
 * Dynamically surfaces overdue invoices, pending trip assignments, and vehicle maintenance/document alerts.
 */
export default function AttentionAlerts({ onNavigate }) {
  const { navigate } = useRouter()
  const [invoices, setInvoices] = useState([...liveInvoices])
  const [trips, setTrips] = useState([...liveTrips])
  const [vehicles, setVehicles] = useState([...liveVehicles])

  useEffect(() => {
    const unsubInv = subscribeInvoices(snap => setInvoices([...snap]))
    const unsubTrips = subscribeTrips(snap => setTrips([...snap]))
    const unsubVeh = subscribeVehicles(snap => setVehicles([...snap]))
    return () => {
      unsubInv()
      unsubTrips()
      unsubVeh()
    }
  }, [])

  // Calculate real attention items
  const attentionItems = useMemo(() => {
    const items = []

    // 1. Overdue Invoices
    const overdueInvoices = invoices.filter(inv => inv.paymentStatus === 'Overdue')
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0)
      items.push({
        id: 'overdue-invoices',
        type: 'error',
        icon: FileText,
        title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`,
        description: `Total balance due: ${formatINR(totalOverdue)}. Action required to collect payment.`,
        actionLabel: 'View Invoices',
        route: 'Invoices',
      })
    }

    // 2. Trips Needing Assignment (Booked or Confirmed without Driver or Vehicle)
    const unassignedTrips = trips.filter(isTripNeedsAssignment)
    if (unassignedTrips.length > 0) {
      items.push({
        id: 'unassigned-trips',
        type: 'warning',
        icon: Route,
        title: `${unassignedTrips.length} Trip${unassignedTrips.length > 1 ? 's' : ''} Need Driver/Vehicle Assignment`,
        description: `Assign vehicles and drivers to ensure smooth operations.`,
        actionLabel: 'Assign Operations',
        route: 'Trips',
        params: { statusFilter: 'Needs Assignment' },
      })
    }

    // 3. Vehicles in Maintenance or Urgent Documents
    const maintenanceVehicles = vehicles.filter(v => v.status === 'Maintenance')
    if (maintenanceVehicles.length > 0) {
      items.push({
        id: 'maintenance-vehicles',
        type: 'info',
        icon: Car,
        title: `${maintenanceVehicles.length} Vehicle${maintenanceVehicles.length > 1 ? 's' : ''} Under Maintenance`,
        description: `Check repair status or update service completion logs.`,
        actionLabel: 'Manage Fleet',
        route: 'Vehicles',
        params: { statusFilter: 'Maintenance' },
      })
    }

    return items
  }, [invoices, trips, vehicles])

  const handleAction = (item) => {
    const route = typeof item === 'string' ? item : item.route
    const params = typeof item === 'object' ? item.params : {}
    if (onNavigate) onNavigate(route, params)
    else navigate(route, params)
  }

  // If no items require urgent attention
  if (attentionItems.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-950">Operations & Finance Running Smoothly</p>
            <p className="text-[11px] font-semibold text-emerald-700">All trips assigned, invoices up to date, and fleet active.</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
          All Clear
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600 flex items-center gap-1.5">
          <AlertCircle size={13} /> Requires Attention ({attentionItems.length})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {attentionItems.map(item => {
          const Icon = item.icon
          const isError = item.type === 'error'
          const isWarning = item.type === 'warning'

          const containerStyle = isError
            ? 'border-rose-200 bg-rose-50/70 text-rose-900'
            : isWarning
            ? 'border-amber-200 bg-amber-50/70 text-amber-900'
            : 'border-sky-200 bg-sky-50/70 text-sky-900'

          const iconStyle = isError
            ? 'bg-rose-600 text-white'
            : isWarning
            ? 'bg-amber-600 text-white'
            : 'bg-sky-600 text-white'

          const btnStyle = isError
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : isWarning
            ? 'bg-amber-600 text-white hover:bg-amber-700'
            : 'bg-sky-600 text-white hover:bg-sky-700'

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 sm:px-4 sm:py-3 shadow-2xs transition-all ${containerStyle}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${iconStyle}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold leading-tight">{item.title}</p>
                  <p className="text-[11px] font-medium opacity-85 mt-0.5">{item.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleAction(item.route)}
                className={`self-end sm:self-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0 ${btnStyle}`}
              >
                <span>{item.actionLabel}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
