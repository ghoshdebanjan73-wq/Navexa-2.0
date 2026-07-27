import { useState, useEffect } from 'react'
import {
  X, Edit2, Play, CheckCircle2, XCircle, ArrowRight, MapPin,
  Calendar, Clock, Car, CreditCard, FileText, User, Phone, Info, Route, Plus, Check
} from 'lucide-react'
import { STATUS_BADGE, PAYMENT_BADGE } from '../../pages/Trips'
import { formatINR } from '../../data/tripStore'
import { getCustomerById, getCustomerByName, getInitials, subscribeCustomers } from '../../data/customerStore'
import { liveVehicles, getEffectiveVehicleStatus, subscribeVehicles } from '../../data/vehicleStore'
import {
  getTripPaymentSummary, getPaymentsByTrip, subscribePayments
} from '../../data/paymentStore'
import RecordPaymentModal from './RecordPaymentModal'

function DetailRow({ icon: Icon, label, value, valueClass = '' }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line/50 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg text-ink-soft mt-0.5">
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-ink-soft font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-ink ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}

export default function TripDetailPanel({ trip, onClose, onEdit, onStart, onComplete, onCancel, onShowToast, user }) {
  const [customerRecord, setCustomerRecord] = useState(() => {
    if (!trip) return null
    return (trip.customerId && getCustomerById(trip.customerId)) || getCustomerByName(trip.customer)
  })

  const [vehicleRecord, setVehicleRecord] = useState(() => {
    if (!trip) return null
    return liveVehicles.find(v => (trip.vehicleId && v.id === trip.vehicleId) || v.name === trip.vehicle)
  })

  // Payment state derived from paymentStore
  const [paySummary, setPaySummary] = useState(() => {
    if (!trip) return { fare: 0, amountPaid: 0, balance: 0, paymentStatus: 'Unpaid' }
    return getTripPaymentSummary(trip.id, trip.fare, trip.paymentStatus)
  })
  const [payHistory, setPayHistory] = useState(() => {
    if (!trip) return []
    return getPaymentsByTrip(trip.id)
  })

  const [recordPayOpen, setRecordPayOpen] = useState(false)

  // Subscribe to customerStore, vehicleStore & paymentStore
  useEffect(() => {
    if (!trip) return
    const unsubCust = subscribeCustomers(() => {
      setCustomerRecord((trip.customerId && getCustomerById(trip.customerId)) || getCustomerByName(trip.customer))
    })
    const unsubVeh = subscribeVehicles(() => {
      setVehicleRecord(liveVehicles.find(v => (trip.vehicleId && v.id === trip.vehicleId) || v.name === trip.vehicle))
    })
    const unsubPay = subscribePayments(() => {
      setPaySummary(getTripPaymentSummary(trip.id, trip.fare, trip.paymentStatus))
      setPayHistory(getPaymentsByTrip(trip.id))
    })
    return () => {
      unsubCust()
      unsubVeh()
      unsubPay()
    }
  }, [trip])

  // Escape key listener
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ─── Invalid / Nonexistent Trip ID ──────────────────────────────────────────
  if (!trip || !trip.id) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop text-center space-y-3 animate-scaleUp">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mx-auto">
            <Route size={24} />
          </div>
          <h3 className="text-base font-extrabold text-ink">Trip Not Found</h3>
          <p className="text-xs text-ink-soft">The requested trip record could not be found or has been removed.</p>
          <button
            onClick={onClose}
            className="mt-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
          >
            Back to Trips
          </button>
        </div>
      </div>
    )
  }

  const customerName  = customerRecord?.name || trip.customer || 'Customer unavailable'
  const customerPhone = customerRecord?.phone || null

  const vehicleName   = vehicleRecord?.name || trip.vehicle || 'Vehicle unavailable'
  const vehicleReg    = vehicleRecord?.reg || trip.vehicleReg || ''
  const vehicleStatus = vehicleRecord ? getEffectiveVehicleStatus(vehicleRecord) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trip Details"
      className="fixed inset-0 z-50 flex items-center justify-center sm:items-start sm:justify-end bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full sm:w-[420px] md:w-[460px] h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl border-0 sm:border border-line bg-surface shadow-pop flex flex-col overflow-hidden animate-slideRight">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 pt-5 pb-4 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-ink truncate">
                {trip.pickupLocation} → {trip.destination}
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_BADGE[trip.status]}`}>
                {trip.status}
              </span>
              <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${PAYMENT_BADGE[paySummary.paymentStatus]}`}>
                {paySummary.paymentStatus}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 cursor-pointer ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Customer Section */}
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Customer</p>
            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-extrabold text-primary">
                {getInitials(customerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink truncate">{customerName}</p>
                {customerPhone ? (
                  <p className="text-xs text-ink-soft flex items-center gap-1 font-semibold num mt-0.5">
                    <Phone size={11} className="text-slate-400" /> {customerPhone}
                  </p>
                ) : (
                  <p className="text-[11px] text-ink-soft italic">No phone recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Section */}
          <div className="rounded-xl border border-line bg-bg p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Assigned Vehicle</p>
              {vehicleStatus && (
                <span className="rounded-full bg-surface border border-line px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                  {vehicleStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-line text-primary">
                <Car size={16} strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink truncate">{vehicleName}</p>
                {vehicleReg && <p className="text-xs text-ink-soft font-semibold num mt-0.5">{vehicleReg}</p>}
              </div>
            </div>
          </div>

          {/* Payment Summary Section */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Payment Summary</h4>
              </div>
              {paySummary.balance === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  <Check size={12} strokeWidth={2.5} /> Paid in Full
                </span>
              ) : (
                <button
                  onClick={() => setRecordPayOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={13} /> Record Payment
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-bg p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Total Fare</p>
                <p className="text-xs font-bold text-ink num mt-0.5">{formatINR(paySummary.fare)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Amount Paid</p>
                <p className="text-xs font-bold text-emerald-700 num mt-0.5">{formatINR(paySummary.amountPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Balance Due</p>
                <p className={`text-xs font-extrabold num mt-0.5 ${paySummary.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {formatINR(paySummary.balance)}
                </p>
              </div>
            </div>

            {/* Payment History List */}
            <div className="pt-1 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                Payment History ({payHistory.length})
              </p>
              {payHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-bg p-3 text-center text-xs font-semibold text-ink-soft">
                  No payments recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {payHistory.map(p => (
                    <div key={p.id} className="rounded-xl border border-line bg-bg p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-emerald-700 num text-sm">
                          {formatINR(p.amount)}
                        </span>
                        <span className="rounded-md bg-surface border border-line px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                          {p.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft font-medium">Recorded on {p.paymentDate}</p>
                      {p.notes && (
                        <p className="text-xs text-ink bg-surface rounded-lg p-2 border border-line/50 mt-1">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Route & Schedule Details */}
          <div className="space-y-0.5 border-t border-line/60 pt-2">
            <DetailRow icon={MapPin} label="Pickup Location" value={trip.pickupLocation} />
            <DetailRow icon={ArrowRight} label="Destination" value={trip.destination} />
            <DetailRow icon={Calendar} label="Trip Date" value={trip.tripDate} />
            <DetailRow icon={Clock} label="Trip Time" value={trip.tripTime} />
          </div>

          {/* Notes Section */}
          <div className="rounded-xl border border-line bg-surface p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">Notes / Special Instructions</p>
            <p className="text-xs text-ink leading-relaxed">
              {trip.notes?.trim() ? trip.notes : <span className="text-ink-soft italic">No notes added.</span>}
            </p>
          </div>

          {/* Record Info */}
          <div className="border-t border-line/60 pt-3 text-[11px] text-ink-soft space-y-0.5">
            <p className="font-bold uppercase tracking-wider text-[10px] text-ink-soft mb-1">System Record Info</p>
            <p><strong className="font-semibold text-ink">Trip ID:</strong> {trip.id}</p>
            {trip.createdBy && <p><strong className="font-semibold text-ink">Created By:</strong> User {trip.createdBy}</p>}
            {trip.createdAt && <p><strong className="font-semibold text-ink">Created At:</strong> {new Date(trip.createdAt).toLocaleDateString('en-IN')}</p>}
            {trip.updatedAt && <p><strong className="font-semibold text-ink">Updated At:</strong> {new Date(trip.updatedAt).toLocaleDateString('en-IN')}</p>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 border-t border-line p-4 flex flex-wrap items-center gap-2.5">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Edit2 size={13} /> Edit Trip
          </button>

          {trip.status === 'Upcoming' && (
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer transition-colors"
            >
              <Play size={13} /> Start Trip
            </button>
          )}

          {trip.status === 'Ongoing' && (
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer transition-colors"
            >
              <CheckCircle2 size={13} /> Mark Completed
            </button>
          )}

          {(trip.status === 'Upcoming' || trip.status === 'Ongoing') && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors ml-auto"
            >
              <XCircle size={13} /> Cancel Trip
            </button>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {recordPayOpen && (
        <RecordPaymentModal
          trip={trip}
          onClose={() => setRecordPayOpen(false)}
          onSaved={(msg) => {
            if (onShowToast) onShowToast(msg)
          }}
          user={user}
        />
      )}
    </div>
  )
}
