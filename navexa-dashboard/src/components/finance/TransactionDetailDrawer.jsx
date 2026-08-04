/**
 * TransactionDetailDrawer.jsx
 * Professional full-detail slide-in drawer for viewing Income and Expense transactions.
 * Shows all available fields, linked records (Customer, Trip, Invoice, Vehicle), bill preview, and export/delete actions.
 */

import { useState } from 'react'
import {
  X, TrendingUp, TrendingDown, Wallet, Calendar, Clock, User, Phone,
  Car, Route, FileText, CreditCard, Hash, Building2, MapPin, Navigation,
  ExternalLink, Download, Eye, Trash2, Printer, Receipt, UserCheck, Fuel,
  Paperclip, AlertCircle, ChevronRight, Info, Shield
} from 'lucide-react'
import { formatINR } from '../../data/tripStore'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function DetailRow({ icon: Icon, label, value, mono = false, accent }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line/50 last:border-0">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${accent || 'bg-slate-100 text-ink-soft'}`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{label}</p>
        <p className={`text-xs font-semibold text-ink mt-0.5 break-words ${mono ? 'num' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3.5 space-y-0.5">
      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-ink-soft pb-2 border-b border-line/60 mb-1">{title}</h4>
      {children}
    </div>
  )
}

function LinkedRecordBadge({ label, value, href }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary-50/60 px-2.5 py-1 text-[11px] font-bold text-primary cursor-pointer hover:bg-primary/10 transition-colors">
      {label}: {value}
      <ExternalLink size={11} />
    </span>
  )
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function TransactionDetailDrawer({
  transaction,
  isOpen,
  onClose,
  onDelete,
  isAdmin,
  // Lookup maps
  customerMap = {},
  vehicleMap = {},
  driverMap = {},
  tripMap = {},
  invoiceMap = {},
}) {
  const [showReceiptFull, setShowReceiptFull] = useState(false)
  const [imageError, setImageError] = useState(false)

  if (!isOpen || !transaction) return null

  const txn = transaction
  const isIncome = txn.type === 'Income'

  // Resolve linked records
  const customer = customerMap[txn.customerId]
  const vehicle = vehicleMap[txn.vehicleId]
  const driver = driverMap[txn.driverId]
  const trip = tripMap[txn.tripId]
  const invoice = invoiceMap[txn.invoiceId]

  // Format helpers
  const fmtDate = (d) => {
    if (!d) return null
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' })
    } catch { return d }
  }
  const fmtTime = (t) => t || null
  const fmtDateTime = (d) => {
    if (!d) return null
    try {
      return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return d }
  }

  // Receipt / Bill URL resolution
  const receiptUrl = txn.receiptPath
    ? (txn.receiptPath.startsWith('http') ? txn.receiptPath : null)
    : null
  const hasReceipt = Boolean(txn.receiptPath)
  const isPDF = txn.receiptPath && txn.receiptPath.toLowerCase().endsWith('.pdf')

  // Build print content
  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Details — ${txn.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .logo { font-size: 22px; font-weight: 800; color: #0284c7; }
            h3 { font-size: 14px; font-weight: 700; margin: 18px 0 8px; color: #475569; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            td:first-child { font-weight: bold; color: #475569; width: 180px; }
            .amount { font-size: 22px; font-weight: 800; color: ${isIncome ? '#047857' : '#be123c'}; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><div class="logo">NAVEXA 2.0</div><p style="font-size:11px;color:#64748b;margin:2px 0 0">Transaction Record</p></div>
            <div style="text-align:right;font-size:11px;color:#64748b">
              <p style="font-weight:bold;color:#0f172a;margin:0">TXN ID: ${txn.id}</p>
              <p style="margin:2px 0 0">Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <div class="amount">${isIncome ? '+' : '-'}${formatINR(txn.amount).replace('₹', '₹ ')}</div>
          <p style="margin:2px 0 8px;font-size:12px;font-weight:600;color:#64748b">${txn.description || 'Transaction'}</p>
          <h3>Transaction Information</h3>
          <table>
            <tr><td>Transaction ID</td><td>${txn.id}</td></tr>
            <tr><td>Type</td><td>${txn.type}</td></tr>
            <tr><td>Category</td><td>${txn.category}${txn.subcategory ? ' / ' + txn.subcategory : ''}</td></tr>
            <tr><td>Amount</td><td>${isIncome ? '+' : '-'}${formatINR(txn.amount)}</td></tr>
            <tr><td>Date</td><td>${fmtDate(txn.date)}</td></tr>
            <tr><td>Time</td><td>${txn.time || '—'}</td></tr>
            <tr><td>Payment Method</td><td>${txn.paymentMethod}</td></tr>
            <tr><td>Reference / Bill No</td><td>${txn.billNumber || txn.reference || '—'}</td></tr>
            ${customer ? `<tr><td>Customer</td><td>${customer.name}${customer.phone ? ' — ' + customer.phone : ''}</td></tr>` : ''}
            ${vehicle ? `<tr><td>Vehicle</td><td>${vehicle.name} (${vehicle.registration || vehicle.id})</td></tr>` : ''}
            ${driver ? `<tr><td>Driver</td><td>${driver.name}</td></tr>` : ''}
            ${trip ? `<tr><td>Trip ID</td><td>${trip.id}</td></tr>` : ''}
            ${invoice ? `<tr><td>Invoice #</td><td>${invoice.invoiceNumber}</td></tr>` : ''}
            ${txn.vendor ? `<tr><td>Vendor</td><td>${txn.vendor}${txn.vendorPhone ? ' — ' + txn.vendorPhone : ''}</td></tr>` : ''}
            <tr><td>Recorded By</td><td>${txn.createdBy}</td></tr>
            <tr><td>Created At</td><td>${fmtDateTime(txn.createdAt)}</td></tr>
            ${txn.notes ? `<tr><td>Notes</td><td>${txn.notes}</td></tr>` : ''}
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-md flex flex-col bg-surface border-l border-line shadow-pop animate-slideInRight overflow-hidden">
        
        {/* Drawer Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b border-line ${isIncome ? 'bg-emerald-50/60' : 'bg-rose-50/60'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${isIncome ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {isIncome ? <TrendingUp size={18} className="text-white" /> : <TrendingDown size={18} className="text-white" />}
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-soft">
                {txn.type} Transaction
              </p>
              <p className={`text-xl font-extrabold num ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isIncome ? '+' : '–'}{formatINR(txn.amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
              title="Print / PDF"
            >
              <Printer size={15} />
            </button>
            {isAdmin && onDelete && (
              <button
                onClick={() => onDelete(txn)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Delete Transaction"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Description Bar */}
        <div className="px-5 py-3 border-b border-line bg-bg">
          <p className="text-sm font-bold text-ink">{txn.description || '—'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
              {txn.category}{txn.subcategory ? ` › ${txn.subcategory}` : ''}
            </span>
            <span className="text-[10px] text-ink-soft font-semibold num">{txn.id}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* --- CORE DETAILS --- */}
          <Section title="Transaction Details">
            <DetailRow icon={Hash} label="Transaction ID" value={txn.id} mono accent="bg-slate-100 text-slate-700" />
            <DetailRow icon={Wallet} label="Amount" value={`${isIncome ? '+' : '–'}${formatINR(txn.amount)}`} mono accent={isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} />
            <DetailRow icon={Calendar} label="Date" value={fmtDate(txn.date)} mono accent="bg-sky-50 text-sky-700" />
            <DetailRow icon={Clock} label="Time" value={fmtTime(txn.time)} mono accent="bg-slate-100 text-slate-700" />
            <DetailRow icon={CreditCard} label="Payment Method" value={txn.paymentMethod} accent="bg-purple-50 text-purple-700" />
            <DetailRow icon={Hash} label="Reference / Bill No" value={txn.billNumber || txn.reference} mono accent="bg-orange-50 text-orange-700" />
          </Section>

          {/* --- CUSTOMER DETAILS (Income) --- */}
          {isIncome && (
            <Section title="Customer Information">
              {customer ? (
                <>
                  <DetailRow icon={User} label="Customer Name" value={customer.name} accent="bg-teal-50 text-teal-700" />
                  <DetailRow icon={Phone} label="Customer Phone" value={customer.phone} mono accent="bg-teal-50 text-teal-700" />
                </>
              ) : txn.customerId ? (
                <DetailRow icon={User} label="Customer ID" value={txn.customerId} mono accent="bg-teal-50 text-teal-700" />
              ) : null}
              {invoice && (
                <>
                  <DetailRow icon={FileText} label="Invoice Number" value={invoice.invoiceNumber} mono accent="bg-primary-50 text-primary" />
                  <DetailRow icon={Wallet} label="Invoice Total" value={formatINR(invoice.totalAmount)} mono accent="bg-primary-50 text-primary" />
                  <DetailRow icon={Wallet} label="Amount Paid" value={formatINR(invoice.amountPaid)} mono accent="bg-emerald-50 text-emerald-700" />
                  <DetailRow icon={AlertCircle} label="Balance Due" value={formatINR(invoice.balanceDue)} mono accent="bg-amber-50 text-amber-700" />
                  <DetailRow icon={Info} label="Payment Status" value={invoice.paymentStatus} accent="bg-slate-100 text-slate-700" />
                </>
              )}
            </Section>
          )}

          {/* --- TRIP DETAILS --- */}
          {(trip || txn.tripId) && (
            <Section title="Trip Information">
              <DetailRow icon={Hash} label="Trip ID" value={trip?.id || txn.tripId} mono accent="bg-indigo-50 text-indigo-700" />
              {trip && (
                <>
                  <DetailRow icon={MapPin} label="Pickup Location" value={trip.pickup} accent="bg-emerald-50 text-emerald-700" />
                  <DetailRow icon={Navigation} label="Destination" value={trip.destination} accent="bg-rose-50 text-rose-700" />
                  <DetailRow icon={Calendar} label="Trip Date" value={fmtDate(trip.tripDate)} mono accent="bg-sky-50 text-sky-700" />
                  <DetailRow icon={Clock} label="Trip Time" value={trip.tripTime} mono accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={Wallet} label="Trip Fare" value={formatINR(trip.fare)} mono accent="bg-emerald-50 text-emerald-700" />
                  <DetailRow icon={Route} label="Trip Status" value={trip.status} accent="bg-slate-100 text-slate-700" />
                </>
              )}
            </Section>
          )}

          {/* --- VEHICLE & DRIVER --- */}
          {(vehicle || driver || txn.vehicleId || txn.driverId) && (
            <Section title="Vehicle & Driver">
              {vehicle && (
                <>
                  <DetailRow icon={Car} label="Vehicle" value={`${vehicle.name}`} accent="bg-violet-50 text-violet-700" />
                  <DetailRow icon={Hash} label="Registration" value={vehicle.registration} mono accent="bg-slate-100 text-slate-700" />
                </>
              )}
              {!vehicle && txn.vehicleId && (
                <DetailRow icon={Car} label="Vehicle ID" value={txn.vehicleId} mono accent="bg-violet-50 text-violet-700" />
              )}
              {driver && (
                <>
                  <DetailRow icon={UserCheck} label="Driver Name" value={driver.name} accent="bg-orange-50 text-orange-700" />
                  <DetailRow icon={Phone} label="Driver Phone" value={driver.phone} mono accent="bg-orange-50 text-orange-700" />
                </>
              )}
              {!driver && txn.driverId && (
                <DetailRow icon={UserCheck} label="Driver ID" value={txn.driverId} mono accent="bg-orange-50 text-orange-700" />
              )}
            </Section>
          )}

          {/* --- VENDOR DETAILS (Expense) --- */}
          {!isIncome && (txn.vendor || txn.vendorPhone) && (
            <Section title="Vendor Information">
              <DetailRow icon={Building2} label="Vendor Name" value={txn.vendor} accent="bg-amber-50 text-amber-700" />
              <DetailRow icon={Phone} label="Vendor Phone" value={txn.vendorPhone} mono accent="bg-amber-50 text-amber-700" />
            </Section>
          )}

          {/* --- CATEGORY-SPECIFIC EXPENSE DETAILS (Fuel, Toll, Parking, Maintenance) --- */}
          {!isIncome && txn.expenseMetadata && (() => {
            const m = typeof txn.expenseMetadata === 'string'
              ? (() => { try { return JSON.parse(txn.expenseMetadata) } catch { return {} } })()
              : txn.expenseMetadata

            const cat = m.category || txn.category

            // FUEL DETAILS
            if (cat === 'Fuel') {
              return (
                <Section title="⛽ Fuel Details">
                  <DetailRow icon={Fuel} label="Fuel Type" value={m.fuelType} accent="bg-amber-50 text-amber-700" />
                  <DetailRow icon={Hash} label="Quantity (Litres)" value={m.quantity ? `${m.quantity} L` : null} mono accent="bg-amber-50 text-amber-700" />
                  <DetailRow icon={Hash} label="Rate per Litre" value={m.ratePerUnit ? `₹${m.ratePerUnit}/L` : null} mono accent="bg-amber-50 text-amber-700" />
                  <DetailRow icon={Car} label="Odometer Reading" value={m.odometer ? `${Number(m.odometer).toLocaleString('en-IN')} km` : null} mono accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={MapPin} label="Fuel Pump Name" value={m.pumpName} accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={MapPin} label="Pump Location" value={m.pumpLocation} accent="bg-slate-100 text-slate-700" />
                </Section>
              )
            }

            // TOLL DETAILS
            if (cat === 'Toll') {
              return (
                <Section title="🛣️ Toll Details">
                  <DetailRow icon={Route} label="Toll Plaza Name" value={m.plazaName} accent="bg-sky-50 text-sky-700" />
                  <DetailRow icon={MapPin} label="Plaza Location" value={m.plazaLocation} accent="bg-sky-50 text-sky-700" />
                  <DetailRow icon={Hash} label="FASTag Used" value={m.fastagUsed} accent="bg-sky-50 text-sky-700" />
                  <DetailRow icon={Hash} label="Transaction No" value={m.transactionNo} mono accent="bg-slate-100 text-slate-700" />
                </Section>
              )
            }

            // PARKING DETAILS
            if (cat === 'Parking') {
              return (
                <Section title="🅿️ Parking Details">
                  <DetailRow icon={MapPin} label="Parking Name" value={m.parkingName} accent="bg-purple-50 text-purple-700" />
                  <DetailRow icon={MapPin} label="Location" value={m.location} accent="bg-purple-50 text-purple-700" />
                  <DetailRow icon={Clock} label="Duration" value={m.hours ? `${m.hours} hour(s)` : null} mono accent="bg-purple-50 text-purple-700" />
                </Section>
              )
            }

            // MAINTENANCE / REPAIR DETAILS
            if (cat === 'Maintenance' || cat === 'Repair' || cat === 'Tyres') {
              return (
                <Section title="🔧 Service / Repair Details">
                  <DetailRow icon={Building2} label="Workshop Name" value={m.workshopName} accent="bg-indigo-50 text-indigo-700" />
                  <DetailRow icon={User} label="Mechanic Name" value={m.mechanicName} accent="bg-indigo-50 text-indigo-700" />
                  <DetailRow icon={Phone} label="Workshop Phone" value={m.workshopPhone} mono accent="bg-indigo-50 text-indigo-700" />
                  <DetailRow icon={FileText} label="Invoice / Bill No" value={m.invoiceNumber} mono accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={Hash} label="Work Description" value={m.workDescription} accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={Hash} label="Parts Replaced" value={m.partsReplaced} accent="bg-slate-100 text-slate-700" />
                  <DetailRow icon={Calendar} label="Next Service Due" value={m.nextServiceDate} mono accent="bg-amber-50 text-amber-700" />
                </Section>
              )
            }

            return null
          })()}

          {/* --- AUDIT & METADATA --- */}
          <Section title="Record Metadata">
            <DetailRow icon={Shield} label="Recorded By" value={txn.createdBy} accent="bg-slate-100 text-slate-700" />
            <DetailRow icon={Calendar} label="Created At" value={fmtDateTime(txn.createdAt)} mono accent="bg-slate-100 text-slate-700" />
            {txn.updatedAt && txn.updatedAt !== txn.createdAt && (
              <DetailRow icon={Calendar} label="Last Updated" value={fmtDateTime(txn.updatedAt)} mono accent="bg-slate-100 text-slate-700" />
            )}
          </Section>

          {/* --- NOTES --- */}
          {txn.notes && (
            <Section title="Notes">
              <p className="text-xs text-ink leading-relaxed">{txn.notes}</p>
            </Section>
          )}

          {/* --- LINKED RECORDS QUICK LINKS --- */}
          {(customer || trip || invoice || vehicle || driver) && (
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-soft">Linked Records</p>
              <div className="flex flex-wrap gap-2">
                {customer && <LinkedRecordBadge label="Customer" value={customer.name} />}
                {trip && <LinkedRecordBadge label="Trip" value={trip.id} />}
                {invoice && <LinkedRecordBadge label="Invoice" value={invoice.invoiceNumber} />}
                {vehicle && <LinkedRecordBadge label="Vehicle" value={vehicle.name} />}
                {driver && <LinkedRecordBadge label="Driver" value={driver.name} />}
              </div>
            </div>
          )}

          {/* --- RECEIPT / BILL PREVIEW --- */}
          {hasReceipt && (
            <Section title="Bill / Receipt Attachment">
              {receiptUrl && !isPDF && !imageError ? (
                <div className="space-y-2">
                  {/* Thumbnail */}
                  <div
                    className="relative overflow-hidden rounded-xl border border-line cursor-pointer group"
                    onClick={() => setShowReceiptFull(true)}
                  >
                    <img
                      src={receiptUrl}
                      alt="Receipt"
                      className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReceiptFull(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50 cursor-pointer"
                    >
                      <Eye size={13} /> Preview Full Size
                    </button>
                    <a
                      href={receiptUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-bg p-3">
                  <Paperclip size={16} className="text-ink-soft" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{txn.receiptPath}</p>
                    <p className="text-[10px] text-ink-soft mt-0.5">
                      {isPDF ? 'PDF Document' : 'File Attachment'}
                    </p>
                  </div>
                  {receiptUrl && (
                    <a
                      href={receiptUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft hover:text-ink transition-colors"
                    >
                      <Download size={13} />
                    </a>
                  )}
                </div>
              )}
            </Section>
          )}

        </div>
      </div>

      {/* Full-Size Image Preview Overlay */}
      {showReceiptFull && receiptUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 animate-fadeIn"
          onClick={() => setShowReceiptFull(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] p-4">
            <img
              src={receiptUrl}
              alt="Receipt Full"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setShowReceiptFull(false)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
            >
              <X size={16} />
            </button>
            <a
              href={receiptUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute left-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/70 text-white px-3 py-1.5 text-xs font-bold hover:bg-black"
            >
              <Download size={13} /> Download
            </a>
          </div>
        </div>
      )}
    </>
  )
}
