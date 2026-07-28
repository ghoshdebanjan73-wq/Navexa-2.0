import { useState, useEffect } from 'react'
import {
  X, User, Phone, Mail, MapPin, Building, MessageSquare, Calendar,
  CreditCard, Route, CheckCircle2, AlertTriangle, Edit3, Trash2,
  TrendingUp, Compass, Clock, ArrowRight, ShieldCheck
} from 'lucide-react'
import { getCustomer360Stats, getInitials } from '../../data/customerStore'
import { formatINR, subscribeTrips } from '../../data/tripStore'
import { liveInvoices, subscribeInvoices } from '../../data/invoiceStore'
import TripDetailPanel from '../trips/TripDetailPanel'
import AddTripModal from '../trips/AddTripModal'

export default function CustomerDetailPanel({ customer, isOpen, onClose, onEdit, onDelete, isAdmin, user }) {
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showAddTripModal, setShowAddTripModal] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (customer) {
      setStats(getCustomer360Stats(customer.name, customer.id))
    }

    const unsub = subscribeTrips(() => {
      if (customer) {
        setStats(getCustomer360Stats(customer.name, customer.id))
      }
    })
    return () => unsub()
  }, [customer])

  if (!isOpen || !customer || !stats) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl h-full bg-surface border-l border-line shadow-2xl flex flex-col justify-between animate-slideLeft overflow-y-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-line p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary font-extrabold text-sm border border-primary/20 shadow-2xs">
              {getInitials(customer.name)}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink leading-tight">{customer.name}</h3>
              <p className="text-xs text-ink-soft">{customer.companyName || 'Individual Customer'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body (6 CRM SECTIONS) */}
        <div className="p-5 space-y-6 flex-1">
          
          {/* SECTION 1: CUSTOMER INFORMATION */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                1. Customer Information
              </h4>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary-50 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                  Contact: {customer.preferredContactMethod || 'Phone'}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                  customer.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {customer.status || 'Active'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-ink">
                  <Phone size={14} className="text-ink-soft shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase">Phone</p>
                    <p className="font-semibold num">{customer.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-ink">
                  <Mail size={14} className="text-ink-soft shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase">Email</p>
                    <p className="font-semibold">{customer.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {customer.companyName && (
                <div className="flex items-center gap-2 text-ink pt-1 border-t border-line/40">
                  <Building size={14} className="text-ink-soft shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase">Company / Business</p>
                    <p className="font-bold text-ink">{customer.companyName}</p>
                  </div>
                </div>
              )}

              {(customer.address || customer.city) && (
                <div className="flex items-start gap-2 text-ink pt-1 border-t border-line/40">
                  <MapPin size={14} className="text-ink-soft shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-ink-soft uppercase">Address</p>
                    <p className="font-medium text-ink">
                      {[customer.address, customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {customer.notes && (
                <div className="rounded-xl bg-bg p-2.5 border border-line/60 mt-2">
                  <p className="text-[10px] font-bold uppercase text-ink-soft">Notes</p>
                  <p className="text-xs text-ink whitespace-pre-wrap mt-0.5">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: TRIP SUMMARY */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              2. Trip Summary & Lifetime Value
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Total Trips</p>
                <p className="text-lg font-extrabold text-ink num mt-0.5">{stats.totalTrips}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Completed</p>
                <p className="text-lg font-extrabold text-emerald-700 num mt-0.5">{stats.completedTrips}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Upcoming / Active</p>
                <p className="text-lg font-extrabold text-sky-700 num mt-0.5">{stats.upcomingTrips}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Lifetime Revenue</p>
                <p className="text-sm font-extrabold text-emerald-800 num mt-0.5">{formatINR(stats.lifetimeRevenue)}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Avg Trip Value</p>
                <p className="text-sm font-extrabold text-ink num mt-0.5">{formatINR(stats.avgTripValue)}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Total Distance</p>
                <p className="text-sm font-extrabold text-ink num mt-0.5">{stats.totalDistance} km</p>
              </div>
            </div>
          </div>

          {/* SECTION 3: TRIP HISTORY */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                3. Trip History ({stats.customerTrips.length})
              </h4>
              <button
                onClick={() => setShowAddTripModal(true)}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                + Book Trip
              </button>
            </div>

            {stats.customerTrips.length === 0 ? (
              <p className="text-xs font-medium text-ink-soft italic">No trips booked for this customer yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stats.customerTrips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className="rounded-xl border border-line bg-bg p-3 text-xs space-y-1.5 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>{trip.pickupLocation} ➔ {trip.destination}</span>
                      <span className="num font-extrabold">{formatINR(trip.actualFare || trip.fare)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-ink-soft">
                      <span className="num font-semibold">{trip.tripDate} • {trip.id}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.2 text-[9px] font-bold ${
                        trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: PAYMENT & INVOICES SUMMARY */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              4. Payment & Invoices Summary
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid</p>
                <p className="text-base font-extrabold text-emerald-900 num mt-0.5">{formatINR(stats.totalPaid)}</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-[10px] font-bold text-amber-800 uppercase">Pending Amount</p>
                <p className="text-base font-extrabold text-amber-900 num mt-0.5">{formatINR(stats.pendingAmount)}</p>
              </div>
            </div>

            {/* Customer Related Invoices */}
            <div className="pt-2 border-t border-line space-y-2">
              <p className="text-[11px] font-bold text-ink-soft uppercase">Customer Invoices ({liveInvoices.filter(i => i.customerId === customer.id || i.customerName === customer.name).length})</p>
              {liveInvoices.filter(i => i.customerId === customer.id || i.customerName === customer.name).length === 0 ? (
                <p className="text-xs text-ink-soft italic">No invoices generated yet for this customer.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {liveInvoices.filter(i => i.customerId === customer.id || i.customerName === customer.name).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between rounded-xl bg-bg p-2.5 border border-line text-xs">
                      <div>
                        <p className="font-extrabold text-primary num">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-ink-soft num">{inv.invoiceDate} • Due: {inv.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ink num">{formatINR(inv.totalAmount)}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.2 text-[9px] font-bold ${
                          inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: FAVORITE LOCATIONS */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              5. Favorite Locations (Dynamic Analytics)
            </h4>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-line bg-bg p-3 space-y-1">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Top Pickup Location</p>
                <p className="font-bold text-ink">{stats.favoritePickup}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3 space-y-1">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Top Drop Location</p>
                <p className="font-bold text-ink">{stats.favoriteDrop}</p>
              </div>
            </div>
          </div>

          {/* SECTION 6: ACTIVITY TIMELINE */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
              6. Activity Timeline
            </h4>

            <div className="space-y-3 pl-2 text-xs border-l-2 border-primary/20">
              <div className="relative pl-4 space-y-0.5">
                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="font-bold text-ink">Customer Profile Created</p>
                <p className="text-[10px] text-ink-soft num">
                  {new Date(customer.createdAt || Date.now()).toLocaleString()}
                </p>
              </div>

              {stats.lastTrip && (
                <div className="relative pl-4 space-y-0.5">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-emerald-600" />
                  <p className="font-bold text-ink">Most Recent Trip Logged</p>
                  <p className="text-[10px] text-ink-soft num">
                    {stats.lastTrip.tripDate} • {stats.lastTrip.pickupLocation} ➔ {stats.lastTrip.destination}
                  </p>
                </div>
              )}

              {customer.updatedAt && (
                <div className="relative pl-4 space-y-0.5">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  <p className="font-bold text-ink">Profile Details Updated</p>
                  <p className="text-[10px] text-ink-soft num">
                    {new Date(customer.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="sticky bottom-0 bg-surface border-t border-line p-4 flex items-center gap-3">
            <button
              onClick={() => { onClose(); onEdit(customer) }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-50 text-primary border border-primary/20 px-4 py-2.5 text-xs font-bold hover:bg-primary-100 transition-colors cursor-pointer"
            >
              <Edit3 size={15} /> Edit Customer
            </button>

            <button
              onClick={() => { onClose(); onDelete(customer) }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}

      </div>

      {/* Trip Details Sub-Drawer */}
      {selectedTrip && (
        <TripDetailPanel
          trip={selectedTrip}
          isOpen={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          isAdmin={isAdmin}
        />
      )}

      {/* Add Trip Modal Triggered from Customer Profile */}
      {showAddTripModal && (
        <AddTripModal
          onClose={() => setShowAddTripModal(false)}
          initialCustomer={customer.name}
          user={user}
        />
      )}

    </div>
  )
}
