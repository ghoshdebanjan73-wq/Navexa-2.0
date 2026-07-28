import { useState, useEffect } from 'react'
import {
  X, Car, User, FileText, Wrench, AlertTriangle, CheckCircle2,
  Clock, Calendar, Edit3, Trash2, Plus, Loader2, ShieldCheck, Gauge
} from 'lucide-react'
import { getInsuranceStatus, getMaintenanceAlert } from '../../data/vehicleStore'
import { liveDrivers } from '../../data/driverStore'
import { getMaintenanceByVehicle, addMaintenanceRecord, subscribeMaintenance } from '../../data/maintenanceStore'

export default function VehicleDetailPanel({ vehicle, isOpen, onClose, onEdit, onDelete, isAdmin }) {
  const [maintenanceRecords, setMaintenanceRecords] = useState([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [logging, setLogging] = useState(false)

  // Log Service Form State
  const [serviceType, setServiceType] = useState('Routine Service')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceCost, setServiceCost] = useState('')
  const [serviceOdometer, setServiceOdometer] = useState(vehicle?.odometer || '')
  const [serviceWorkshop, setServiceWorkshop] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')

  useEffect(() => {
    if (vehicle) {
      setMaintenanceRecords(getMaintenanceByVehicle(vehicle.id))
      setServiceOdometer(vehicle.odometer || '')
    }

    const unsub = subscribeMaintenance(() => {
      if (vehicle) {
        setMaintenanceRecords(getMaintenanceByVehicle(vehicle.id))
      }
    })
    return () => unsub()
  }, [vehicle])

  if (!isOpen || !vehicle) return null

  const insurance = getInsuranceStatus(vehicle)
  const maintenanceWarning = getMaintenanceAlert(vehicle)

  // Driver details
  let assignedDriver = null
  if (vehicle.assignedDriverId) {
    assignedDriver = liveDrivers.find(d => d.id === vehicle.assignedDriverId)
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    if (!serviceDate || !serviceCost) return

    setLogging(true)
    try {
      addMaintenanceRecord({
        vehicleId: vehicle.id,
        type: serviceType,
        serviceDate,
        cost: Number(serviceCost),
        odometer: serviceOdometer ? Number(serviceOdometer) : null,
        workshop: serviceWorkshop,
        notes: serviceNotes,
      })

      setShowLogForm(false)
      setServiceCost('')
      setServiceWorkshop('')
      setServiceNotes('')
    } catch (err) {
      console.error('Error logging service:', err)
    } finally {
      setLogging(false)
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <Car size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink leading-tight">{vehicle.name}</h3>
              <p className="text-xs text-ink-soft num font-bold uppercase">{vehicle.reg}</p>
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
          
          {/* Top Profile Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-bg p-4">
            <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-line bg-surface overflow-hidden shadow-2xs">
              {vehicle.photoUrl ? (
                <img src={vehicle.photoUrl} alt={vehicle.name} className="h-full w-full object-cover" />
              ) : (
                <Car size={32} className="text-ink-soft" />
              )}
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-bold text-ink border border-line">
                  {vehicle.type}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                  vehicle.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  vehicle.status === 'On Trip' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                  vehicle.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {vehicle.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-ink-soft truncate">
                {vehicle.brand} {vehicle.model} ({vehicle.manufacturingYear || 'N/A'})
              </p>
            </div>
          </div>

          {/* Maintenance Overdue Alert */}
          {maintenanceWarning && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800 shadow-2xs">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-extrabold text-amber-900">Maintenance Warning</p>
                <p className="text-[11px] leading-relaxed mt-0.5">{maintenanceWarning}</p>
              </div>
            </div>
          )}

          {/* Specs Card */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Vehicle Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Fuel Type</p>
                <p className="font-semibold text-ink mt-0.5">{vehicle.fuelType || 'Diesel'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Seating Capacity</p>
                <p className="font-semibold text-ink mt-0.5">{vehicle.seats || 4} Seats</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Current Odometer</p>
                <p className="font-extrabold text-ink num mt-0.5">{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : '0 km'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Color</p>
                <p className="font-semibold text-ink mt-0.5">{vehicle.color || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Assigned Driver Card */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Assigned Driver
            </h4>
            {assignedDriver ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary font-bold">
                  {assignedDriver.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{assignedDriver.fullName}</p>
                  <p className="text-[11px] text-ink-soft num">{assignedDriver.phone} • License: {assignedDriver.licenseNumber}</p>
                </div>
              </div>
            ) : vehicle.assignedDriverName && vehicle.assignedDriverName !== 'Unassigned' ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary font-bold">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-ink">{vehicle.assignedDriverName}</p>
                  <p className="text-[11px] text-ink-soft">Assigned Driver</p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-ink-soft italic">No driver assigned to this vehicle.</p>
            )}
          </div>

          {/* Documents & Compliance */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">Documents & Compliance</h4>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${insurance.color}`}>
                Insurance: {insurance.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-line/40 pb-1.5">
                <div>
                  <span className="font-bold text-ink">RC Number: </span>
                  <span className="text-ink-soft uppercase num font-semibold">{vehicle.rcNumber || 'N/A'}</span>
                </div>
                <span className="text-[11px] text-ink-soft num">Expiry: {vehicle.rcExpiry || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-line/40 pb-1.5">
                <div>
                  <span className="font-bold text-ink">Insurance Policy: </span>
                  <span className="text-ink-soft uppercase num font-semibold">{vehicle.insurancePolicy || 'N/A'}</span>
                </div>
                <span className="text-[11px] text-ink-soft num">Expiry: {vehicle.insuranceExpiry || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-line/40 pb-1.5">
                <span className="font-bold text-ink">Fitness Expiry:</span>
                <span className="text-ink-soft num font-semibold">{vehicle.fitnessExpiry || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-line/40 pb-1.5">
                <span className="font-bold text-ink">Pollution Expiry:</span>
                <span className="text-ink-soft num font-semibold">{vehicle.pollutionExpiry || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">Permit Expiry:</span>
                <span className="text-ink-soft num font-semibold">{vehicle.permitExpiry || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-2">
              Maintenance Schedule
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Next Service Date</p>
                <p className="font-bold text-ink num mt-0.5">{vehicle.nextServiceDate || 'Not Scheduled'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase">Next Service Km</p>
                <p className="font-bold text-ink num mt-0.5">{vehicle.nextServiceOdometer ? `${vehicle.nextServiceOdometer.toLocaleString()} km` : 'Not Scheduled'}</p>
              </div>
            </div>
          </div>

          {/* Service History Log */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">Service History</h4>
              <button
                onClick={() => setShowLogForm(v => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                <Plus size={14} /> {showLogForm ? 'Close' : 'Log Service'}
              </button>
            </div>

            {/* Inline Log Service Form */}
            {showLogForm && (
              <form onSubmit={handleAddService} className="rounded-xl border border-primary/20 bg-primary-50/50 p-3 space-y-3 animate-fadeIn">
                <p className="text-[11px] font-extrabold text-primary">Record Maintenance / Service</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-ink">Service Date</label>
                    <input
                      type="date"
                      required
                      value={serviceDate}
                      onChange={e => setServiceDate(e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink">Cost (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3500"
                      value={serviceCost}
                      onChange={e => setServiceCost(e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink num outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink">Service Type</label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none"
                    >
                      <option value="Routine Service">Routine Service</option>
                      <option value="Oil Change">Oil Change</option>
                      <option value="Tire Replacement">Tire Replacement</option>
                      <option value="Brake Service">Brake Service</option>
                      <option value="Repair">Repair</option>
                      <option value="Inspection">Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink">Workshop / Vendor</label>
                    <input
                      type="text"
                      placeholder="e.g. Maruti Service Hub"
                      value={serviceWorkshop}
                      onChange={e => setServiceWorkshop(e.target.value)}
                      className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={logging}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 cursor-pointer"
                  >
                    {logging ? 'Saving...' : 'Save Service Record'}
                  </button>
                </div>
              </form>
            )}

            {/* List of past services */}
            {maintenanceRecords.length === 0 ? (
              <p className="text-xs font-medium text-ink-soft italic">No past service records logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {maintenanceRecords.map(rec => (
                  <div key={rec.id} className="rounded-xl border border-line bg-bg p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>{rec.type}</span>
                      <span className="num text-emerald-700 font-extrabold">₹{Number(rec.cost).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-soft">
                      <span>Date: <strong className="num">{rec.serviceDate}</strong></span>
                      {rec.workshop && <span>Workshop: <strong>{rec.workshop}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-[10px] text-ink-soft space-y-1 pt-2 border-t border-line">
            <p>Created Date: <span className="num font-semibold">{new Date(vehicle.createdAt || Date.now()).toLocaleString()}</span></p>
            {vehicle.updatedAt && (
              <p>Last Updated: <span className="num font-semibold">{new Date(vehicle.updatedAt).toLocaleString()}</span></p>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="sticky bottom-0 bg-surface border-t border-line p-4 flex items-center gap-3">
            <button
              onClick={() => { onClose(); onEdit(vehicle) }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-50 text-primary border border-primary/20 px-4 py-2.5 text-xs font-bold hover:bg-primary-100 transition-colors cursor-pointer"
            >
              <Edit3 size={15} /> Edit Vehicle
            </button>

            <button
              onClick={() => { onClose(); onDelete(vehicle) }}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
