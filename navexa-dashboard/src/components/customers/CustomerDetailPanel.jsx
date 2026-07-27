import { useState, useEffect } from 'react'
import {
  X, Edit2, Plus, Phone, Mail, MapPin, FileText, Calendar, User,
  Route, CreditCard, Clock, ArrowRight, CheckCircle2
} from 'lucide-react'
import { getCustomerStats, getInitials, subscribeCustomers } from '../../data/customerStore'
import { subscribeTrips, formatINR } from '../../data/tripStore'
import { STATUS_BADGE, PAYMENT_BADGE } from '../../pages/Trips'
import TripDetailPanel from '../trips/TripDetailPanel'
import AddTripModal from '../trips/AddTripModal'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-line/50 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg text-ink-soft mt-0.5">
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-xs sm:text-sm font-semibold text-ink break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function StatChip({ label, value, isCurrency = false, color = 'text-ink' }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3 flex flex-col justify-center">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{label}</span>
      <span className={`num text-base sm:text-lg font-extrabold mt-1 ${color}`}>
        {isCurrency ? formatINR(value) : value}
      </span>
    </div>
  )
}

export default function CustomerDetailPanel({ customer, onClose, onEdit, user, onToast }) {
  const [stats, setStats] = useState(getCustomerStats(customer?.name))
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [addTripOpen, setAddTripOpen] = useState(false)

  // Subscribe to tripStore & customerStore so stats and trip history update live
  useEffect(() => {
    if (!customer) return
    const unsubTrips = subscribeTrips(() => {
      setStats(getCustomerStats(customer.name))
    })
    const unsubCust = subscribeCustomers(() => {
      setStats(getCustomerStats(customer.name))
    })
    return () => {
      unsubTrips()
      unsubCust()
    }
  }, [customer])

  if (!customer) return null

  const formattedDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Recently'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:w-[500px] md:w-[600px] h-full sm:h-auto sm:max-h-[94vh] rounded-none sm:rounded-2xl border-0 sm:border border-line bg-surface shadow-pop flex flex-col overflow-hidden animate-slideRight">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-extrabold text-primary shadow-xs">
              {getInitials(customer.name)}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink leading-tight">{customer.name}</h2>
              <p className="text-xs text-ink-soft mt-0.5">{customer.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* 1. Statistics Cards */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">Customer Statistics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatChip label="Total Trips" value={stats.totalTrips} />
              <StatChip label="Upcoming" value={stats.upcomingTrips} color="text-sky-700" />
              <StatChip label="Completed" value={stats.completedTrips} color="text-emerald-700" />
              <StatChip label="Total Value" value={stats.totalTripValue} isCurrency color="text-primary" />
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">Customer Information</p>
            <DetailRow icon={User} label="Full Name" value={customer.name} />
            <DetailRow icon={Phone} label="Phone Number" value={customer.phone} />
            {customer.email && <DetailRow icon={Mail} label="Email Address" value={customer.email} />}
            {customer.address && <DetailRow icon={MapPin} label="Address" value={customer.address} />}
            {customer.notes && <DetailRow icon={FileText} label="Notes" value={customer.notes} />}
            <DetailRow icon={Calendar} label="Added On" value={formattedDate} />
            <DetailRow icon={User} label="Added By" value={customer.createdBy === 'U-01' ? 'Banjo' : 'Ranjan'} />
          </div>

          {/* 3. Trip History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Trip History ({stats.trips.length})</p>
              <button
                onClick={() => setAddTripOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <Plus size={13} /> Add Trip
              </button>
            </div>

            {stats.trips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-bg p-6 text-center">
                <Route size={28} className="text-ink-soft/40 mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">No trips yet</p>
                <p className="text-[11px] text-ink-soft mt-0.5 mb-3">This customer does not have any recorded trips.</p>
                <button
                  onClick={() => setAddTripOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                >
                  <Plus size={13} /> Add Trip for {customer.name}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.trips.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrip(t)}
                    className="w-full rounded-xl border border-line bg-bg p-3 space-y-2 transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">{t.pickupLocation} → {t.destination}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[t.status]}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft pt-1 border-t border-line/60">
                      <span>{t.tripDate} · {t.tripTime}</span>
                      <div className="flex items-center gap-2">
                        <span className="num font-bold text-ink">{formatINR(t.fare)}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PAYMENT_BADGE[t.paymentStatus]}`}>
                          {t.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Sub-Modal: Trip Details when trip in history is clicked ── */}
      {selectedTrip && (
        <TripDetailPanel
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onEdit={() => setSelectedTrip(null)}
          onUpdateStatus={() => setSelectedTrip(null)}
          onCancel={() => setSelectedTrip(null)}
        />
      )}

      {/* ── Sub-Modal: Add Trip for this preselected Customer ── */}
      {addTripOpen && (
        <AddTripModal
          onClose={() => setAddTripOpen(false)}
          onSaved={(msg) => {
            setAddTripOpen(false)
            if (onToast) onToast(msg || 'Trip added for customer.')
          }}
          user={user}
          initialCustomer={customer.name}
        />
      )}
    </div>
  )
}
