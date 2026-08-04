import { useState } from 'react'
import {
  X, Route, User, Car, Calendar, Clock, MapPin, CheckCircle2,
  AlertCircle, Edit3, Trash2, ArrowRight, Check, Play, Flag, IndianRupee, Lock, ShieldCheck
} from 'lucide-react'
import { getNextTripStatus, updateTripStatus, TRIP_STAGES, formatINR, isTripFinalized } from '../../data/tripStore'
import { liveDrivers } from '../../data/driverStore'
import { liveVehicles } from '../../data/vehicleStore'
import { getTripProfitability } from '../../data/transactionStore'
import StatusBadge from '../ui/StatusBadge'
import ConfirmDialog from './ConfirmDialog'

export default function TripDetailPanel({ trip, isOpen, onClose, onEdit, onDelete, isAdmin }) {
  const [confirmStatus, setConfirmStatus] = useState(null)
  const [actualFareInput, setActualFareInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !trip) return null

  const isFinalized = isTripFinalized(trip)
  const nextAction = !isFinalized ? getNextTripStatus(trip.status) : null

  // Driver details
  let driverObj = null
  if (trip.driverId) {
    driverObj = liveDrivers.find(d => d.id === trip.driverId)
  }

  // Vehicle details
  let vehicleObj = null
  if (trip.vehicleId) {
    vehicleObj = liveVehicles.find(v => v.id === trip.vehicleId)
  }

  const handleStatusProgression = async () => {
    if (!nextAction || isSubmitting || isFinalized) return
    setIsSubmitting(true)
    try {
      const actualFareVal = nextAction.next === 'Completed' ? (actualFareInput || trip.fare) : null
      await updateTripStatus(trip.id, nextAction.next, actualFareVal)
      setConfirmStatus(null)
    } catch (err) {
      console.error('Error progressing trip status:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg h-full bg-surface border-l border-line shadow-2xl flex flex-col justify-between animate-slideLeft overflow-y-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-line p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary font-bold">
              <Route size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-ink leading-tight">{trip.customer}</h3>
                <StatusBadge status={trip.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-ink-soft num font-extrabold">{trip.id}</p>
                {isFinalized && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                    <Lock size={10} /> Finalized Record
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-6 flex-1">
          
          {/* Read-Only Finalized Banner for Completed/Cancelled trips */}
          {isFinalized ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">Trip Finalized ({trip.status})</p>
                  <p className="text-[11px] text-ink-soft">This record is read-only and locked against editing.</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                Finalized Record
              </span>
            </div>
          ) : (
            /* Quick Action Button for Status Progression (Upcoming Trips) */
            nextAction && isAdmin && (
              <div className="rounded-2xl border border-primary/20 bg-primary-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-ink">Next Stage Workflow</p>
                    <p className="text-[11px] text-ink-soft">Current: <strong className="text-primary">{trip.status}</strong></p>
                  </div>
                  <button
                    onClick={() => setConfirmStatus(nextAction)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    <span>{nextAction.label}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          )}

          {/* Route & Timing Card */}
          <div className="rounded-2xl border border-line bg-bg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-bold text-ink border border-line">
                {trip.tripType || 'One Way'}
              </span>
              <span className="text-xs font-bold text-ink num">
                {trip.tripDate} • {trip.tripTime}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold mt-0.5">
                  A
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-soft uppercase">Pickup Location</p>
                  <p className="font-bold text-ink">{trip.pickupLocation}</p>
                </div>
              </div>

              <div className="ml-3 border-l-2 border-dashed border-slate-300 h-3" />

              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold mt-0.5">
                  B
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink-soft uppercase">Drop Destination</p>
                  <p className="font-bold text-ink">{trip.destination}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fare & Financial Summary */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Fare & Operational Financials
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Estimated Fare</p>
                <p className="font-extrabold text-ink num text-sm mt-0.5">{formatINR(trip.fare)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Actual Fare</p>
                <p className="font-extrabold text-emerald-700 num text-sm mt-0.5">
                  {trip.actualFare ? formatINR(trip.actualFare) : (trip.status === 'Completed' ? formatINR(trip.fare) : 'Pending')}
                </p>
              </div>
              {trip.estimatedDistance && (
                <div>
                  <p className="text-[10px] font-bold text-ink-soft uppercase">Distance</p>
                  <p className="font-bold text-ink num mt-0.5">{trip.estimatedDistance} km</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Operational State</p>
                <p className="font-bold text-ink mt-0.5">{trip.status}</p>
              </div>
            </div>
          </div>

          {/* Vehicle & Driver Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vehicle Card */}
            <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Assigned Vehicle</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Car size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{trip.vehicle}</p>
                  <p className="text-[10px] text-ink-soft uppercase num font-bold">{trip.vehicleReg || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-2 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Assigned Driver</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{trip.driverName || 'Unassigned'}</p>
                  <p className="text-[10px] text-ink-soft num font-medium">{trip.driverPhone || 'No contact'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Trip Timeline */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-4 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Trip Lifecycle Timeline
            </h4>

            <div className="relative pl-6 space-y-4 border-l-2 border-line">
              {TRIP_STAGES.map((stageName) => {
                const timelineEntry = (trip.timeline || []).find(t => t.status === stageName)
                const isPassed = Boolean(timelineEntry) || TRIP_STAGES.indexOf(stageName) <= TRIP_STAGES.indexOf(trip.status)

                return (
                  <div key={stageName} className="relative">
                    {/* Node Dot */}
                    <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                      isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPassed ? <Check size={10} strokeWidth={3} /> : ''}
                    </div>

                    <div>
                      <p className={`text-xs font-bold ${isPassed ? 'text-ink' : 'text-ink-soft opacity-60'}`}>
                        {stageName}
                      </p>
                      {timelineEntry ? (
                        <p className="text-[10px] text-ink-soft num font-medium">
                          {new Date(timelineEntry.timestamp).toLocaleString()} • {timelineEntry.performedBy || 'Dispatcher'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-ink-soft italic opacity-60">Pending</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trip Profitability Analysis */}
          {(() => {
            const prof = getTripProfitability(trip.id, trip.actualFare || trip.fare)
            return (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-2">
                  Trip Financial & Profitability
                </h4>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase">Revenue</p>
                    <p className="text-xs font-extrabold text-emerald-900 num mt-0.5">{formatINR(prof.revenue)}</p>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-2.5">
                    <p className="text-[10px] font-bold text-rose-800 uppercase">Expenses</p>
                    <p className="text-xs font-extrabold text-rose-900 num mt-0.5">{formatINR(prof.expenses)}</p>
                  </div>

                  <div className={`rounded-xl border p-2.5 ${prof.profit >= 0 ? 'border-primary/40 bg-primary-50/50' : 'border-rose-300 bg-rose-100/50'}`}>
                    <p className="text-[10px] font-bold text-primary uppercase">Net Profit</p>
                    <p className={`text-xs font-extrabold num mt-0.5 ${prof.profit >= 0 ? 'text-primary' : 'text-rose-700'}`}>{formatINR(prof.profit)}</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Notes */}
          {trip.notes && (
            <div className="rounded-2xl border border-line bg-bg p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Notes</p>
              <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">{trip.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[10px] text-ink-soft space-y-1 pt-2 border-t border-line">
            <p>Created Date: <span className="num font-semibold">{new Date(trip.createdAt || Date.now()).toLocaleString()}</span></p>
            {trip.updatedAt && (
              <p>Last Updated: <span className="num font-semibold">{new Date(trip.updatedAt).toLocaleString()}</span></p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="sticky bottom-0 bg-surface border-t border-line p-4 flex items-center justify-between gap-3">
            {!isFinalized ? (
              <button
                onClick={() => { onClose(); onEdit(trip) }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-50 text-primary border border-primary/20 px-4 py-2.5 text-xs font-bold hover:bg-primary-100 transition-colors cursor-pointer"
              >
                <Edit3 size={15} /> Edit Trip
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2.5 text-xs font-bold select-none">
                <Lock size={14} /> Finalized Record (Locked)
              </div>
            )}
          </div>
        )}

      </div>

      {/* Confirmation Modal for Status Progression */}
      {confirmStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn"
          onClick={e => { if (e.target === e.currentTarget) setConfirmStatus(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-pop animate-scaleUp space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary font-bold">
                <ArrowRight size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">{confirmStatus.label}</h4>
                <p className="text-xs text-ink-soft">Advance trip to stage <strong>{confirmStatus.next}</strong>?</p>
              </div>
            </div>

            {confirmStatus.next === 'Completed' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink">Actual Fare (₹)</label>
                <input
                  type="number"
                  value={actualFareInput || trip.fare}
                  onChange={e => setActualFareInput(e.target.value)}
                  placeholder={String(trip.fare)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs font-bold text-ink num outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStatus(null)}
                className="rounded-xl border border-line bg-surface px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusProgression}
                disabled={isSubmitting}
                className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
