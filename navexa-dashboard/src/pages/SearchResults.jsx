import { useState, useMemo } from 'react'
import {
  Search, Users, Route, Car, UserCheck, FileText, ArrowUpRight, CheckCircle2, Filter
} from 'lucide-react'
import { performGlobalSearch } from '../data/searchStore'
import { liveCustomers } from '../data/customerStore'
import { liveTrips } from '../data/tripStore'
import EmptyState from '../components/ui/EmptyState'
import { useRouter } from '../context/RouterContext'
import { useUser } from '../context/UserContext'
import CustomerDetailPanel from '../components/customers/CustomerDetailPanel'
import TripDetailPanel from '../components/trips/TripDetailPanel'
import { formatINR } from '../data/tripStore'

export default function SearchResultsPage() {
  const { navigate } = useRouter()
  const { user } = useUser()

  // Parse query from URL search param if present
  const initialQuery = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('q') || ''
    }
    return ''
  }, [])

  const [query, setQuery] = useState(initialQuery)
  const [filterTab, setFilterTab] = useState('All')

  // Detail Modals
  const [selectedCustomerForPanel, setSelectedCustomerForPanel] = useState(null)
  const [selectedTripForModal, setSelectedTripForModal] = useState(null)

  const results = useMemo(() => {
    return performGlobalSearch({ query, role: user?.role, limitPerCategory: 50 })
  }, [query, user?.role])

  const isStaff = user?.role === 'Staff'

  return (
    <div className="page-container">
      
      {/* Search Header Bar */}
      <div className="flex flex-col gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Global Search Results</h1>
          <p className="text-xs text-ink-soft mt-0.5">Found {results.totalCount} matching record(s) across all business modules.</p>
        </div>

        {/* Input Bar */}
        <div className="relative max-w-xl">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, trips, vehicles, drivers, invoices..."
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-xs font-bold text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {[
          { id: 'All', label: `All (${results.totalCount})` },
          { id: 'Customers', label: `Customers (${results.totalCustomersCount})` },
          { id: 'Trips', label: `Trips (${results.totalTripsCount})` },
          { id: 'Vehicles', label: `Vehicles (${results.totalVehiclesCount})` },
          { id: 'Drivers', label: `Drivers (${results.totalDriversCount})` },
          ...(!isStaff ? [{ id: 'Invoices', label: `Invoices (${results.totalInvoicesCount})` }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              filterTab === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Results Body */}
      {results.totalCount === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching results found"
          description="Try searching for a different customer name, trip ID, partial vehicle registration number, or invoice number."
        />
      ) : (
        <div className="space-y-6">
          
          {/* CUSTOMERS RESULTS */}
          {(filterTab === 'All' || filterTab === 'Customers') && results.customers.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-2 font-extrabold text-ink text-sm">
                <Users size={18} className="text-primary" /> Customers ({results.totalCustomersCount})
              </div>
              <div className="divide-y divide-line">
                {results.customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      const match = liveCustomers.find(item => item.name.toLowerCase() === c.name.toLowerCase())
                      if (match) setSelectedCustomerForPanel(match)
                      else navigate('Customers')
                    }}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-ink">{c.name}</p>
                      <p className="text-[11px] text-ink-soft num">{c.phone} {c.companyName ? `• ${c.companyName}` : ''}</p>
                    </div>
                    <button className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      View Profile <ArrowUpRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRIPS RESULTS */}
          {(filterTab === 'All' || filterTab === 'Trips') && results.trips.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-2 font-extrabold text-ink text-sm">
                <Route size={18} className="text-primary" /> Trips ({results.totalTripsCount})
              </div>
              <div className="divide-y divide-line">
                {results.trips.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      const match = liveTrips.find(item => item.id === t.id)
                      if (match) setSelectedTripForModal(match)
                      else navigate('Trips')
                    }}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-primary num">{t.id}</span>
                        <span className="text-xs font-bold text-ink">{t.customer}</span>
                      </div>
                      <p className="text-[11px] text-ink-soft">{t.pickupLocation} ➔ {t.destination}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-ink">
                        {t.status}
                      </span>
                      <ArrowUpRight size={14} className="text-ink-soft" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VEHICLES RESULTS */}
          {(filterTab === 'All' || filterTab === 'Vehicles') && results.vehicles.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-2 font-extrabold text-ink text-sm">
                <Car size={18} className="text-primary" /> Vehicles ({results.totalVehiclesCount})
              </div>
              <div className="divide-y divide-line">
                {results.vehicles.map(v => (
                  <div
                    key={v.id}
                    onClick={() => navigate('Vehicles')}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-ink">{v.name}</p>
                      <p className="text-[11px] text-ink-soft num font-bold">{v.registration} {v.brand ? `• ${v.brand}` : ''}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-ink-soft" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DRIVERS RESULTS */}
          {(filterTab === 'All' || filterTab === 'Drivers') && results.drivers.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-2 font-extrabold text-ink text-sm">
                <UserCheck size={18} className="text-primary" /> Drivers ({results.totalDriversCount})
              </div>
              <div className="divide-y divide-line">
                {results.drivers.map(d => (
                  <div
                    key={d.id}
                    onClick={() => navigate('Drivers')}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-ink">{d.fullName}</p>
                      <p className="text-[11px] text-ink-soft num">{d.phone} {d.licenseNumber ? `• License: ${d.licenseNumber}` : ''}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-ink-soft" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVOICES RESULTS */}
          {!isStaff && (filterTab === 'All' || filterTab === 'Invoices') && results.invoices.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-2 font-extrabold text-ink text-sm">
                <FileText size={18} className="text-primary" /> Invoices ({results.totalInvoicesCount})
              </div>
              <div className="divide-y divide-line">
                {results.invoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => navigate('Invoices')}
                    className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-primary num">{inv.invoiceNumber}</span>
                        <span className="text-xs font-bold text-ink">{inv.customerName}</span>
                      </div>
                      <p className="text-[11px] text-ink-soft num font-semibold">Balance Due: {formatINR(inv.balanceDue)}</p>
                    </div>
                    <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                      {inv.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Customer 360 Drawer */}
      {selectedCustomerForPanel && (
        <CustomerDetailPanel
          customer={selectedCustomerForPanel}
          isOpen={!!selectedCustomerForPanel}
          onClose={() => setSelectedCustomerForPanel(null)}
        />
      )}

      {/* Trip Details Modal */}
      {selectedTripForModal && (
        <TripDetailPanel
          trip={selectedTripForModal}
          isOpen={!!selectedTripForModal}
          onClose={() => setSelectedTripForModal(null)}
        />
      )}

    </div>
  )
}
