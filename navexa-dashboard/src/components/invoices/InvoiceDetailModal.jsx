import { useState, useRef } from 'react'
import {
  X, Printer, Download, CreditCard, CheckCircle2, AlertCircle,
  Building2, Phone, Mail, FileText, MapPin, Route, Car, User, ArrowRight
} from 'lucide-react'
import { formatINR } from '../../data/tripStore'

export default function InvoiceDetailModal({ invoice, isOpen, onClose, onRecordPayment, isAdmin }) {
  const printRef = useRef(null)

  if (!isOpen || !invoice) return null

  const company = invoice.companyDetails || {}
  const trip = invoice.tripDetails || {}

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="my-6 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
              invoice.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : invoice.paymentStatus === 'Partially Paid'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : invoice.paymentStatus === 'Overdue'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {invoice.paymentStatus}
            </span>
            <span className="text-xs font-bold text-ink num">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer size={15} /> Print
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Download size={15} /> Download PDF
            </button>

            {isAdmin && invoice.paymentStatus !== 'Paid' && (
              <button
                onClick={() => { onClose(); onRecordPayment(invoice) }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
              >
                <CreditCard size={15} /> Record Payment
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Invoice Sheet */}
        <div id="printable-invoice" ref={printRef} className="space-y-6 bg-surface p-2 text-ink">
          
          {/* Invoice Header: Company Branding & Invoice Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-line pb-6">
            <div>
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="h-10 object-contain mb-2" />
              ) : (
                <div className="flex items-center gap-2 text-primary font-extrabold text-lg mb-1">
                  <Building2 size={24} />
                  <span>{company.businessName || 'Navexa Transport & Logistics'}</span>
                </div>
              )}
              <p className="text-xs text-ink-soft">{company.address || 'Hooghly, West Bengal, India'}</p>
              <p className="text-xs text-ink-soft num">Phone: {company.phone || '+91 98765 43210'} | Email: {company.email || 'billing@navexa.io'}</p>
              {company.gstNumber && (
                <p className="text-xs font-semibold text-ink num mt-0.5">GSTIN: {company.gstNumber}</p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-1">
              <h2 className="text-xl font-black text-ink uppercase tracking-wider">Tax Invoice</h2>
              <p className="text-sm font-extrabold text-primary num">{invoice.invoiceNumber}</p>
              <p className="text-xs text-ink-soft">Date: <strong className="text-ink num">{invoice.invoiceDate}</strong></p>
              <p className="text-xs text-ink-soft">Due Date: <strong className="text-ink num">{invoice.dueDate}</strong></p>
            </div>
          </div>

          {/* Customer & Billed To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-line bg-bg p-4 text-xs">
            <div>
              <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">Billed To (Customer)</p>
              <p className="font-bold text-ink text-sm">{invoice.customerName}</p>
              <p className="text-ink-soft num">{invoice.customerPhone}</p>
              {invoice.customerEmail && <p className="text-ink-soft">{invoice.customerEmail}</p>}
              {invoice.customerAddress && <p className="text-ink-soft mt-0.5">{invoice.customerAddress}</p>}
            </div>

            {invoice.tripId && (
              <div>
                <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">Trip Reference</p>
                <p className="font-bold text-ink num">{invoice.tripId} ({trip.tripType || 'One Way'})</p>
                <p className="text-ink-soft">Pickup: <strong className="text-ink">{trip.pickupLocation || 'N/A'}</strong></p>
                <p className="text-ink-soft">Drop: <strong className="text-ink">{trip.destination || 'N/A'}</strong></p>
                <p className="text-ink-soft">Driver: <strong className="text-ink">{trip.driverName || 'N/A'}</strong> | Vehicle: <strong className="text-ink">{trip.vehicle || 'N/A'}</strong></p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-center">Distance / Qty</th>
                  <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                <tr>
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">Transport & Freight Charges</p>
                    <p className="text-[11px] text-ink-soft">
                      Route: {trip.pickupLocation || 'Pickup'} ➔ {trip.destination || 'Drop'} ({trip.tripDate || invoice.invoiceDate})
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center num">
                    {trip.estimatedDistance ? `${trip.estimatedDistance} km` : '1 Trip'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold num">
                    {formatINR(invoice.subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Financial Summary */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2">
            <div className="space-y-2 text-xs flex-1">
              {invoice.notes && (
                <div className="rounded-xl bg-bg p-3 border border-line">
                  <p className="text-[10px] font-bold uppercase text-ink-soft">Invoice Notes / Instructions</p>
                  <p className="text-xs text-ink whitespace-pre-wrap mt-0.5">{invoice.notes}</p>
                </div>
              )}

              {invoice.paymentMethod && (
                <div className="text-xs text-ink-soft space-y-0.5">
                  <p>Payment Method: <strong className="text-ink">{invoice.paymentMethod}</strong></p>
                  {invoice.referenceNumber && <p>Reference / Transaction No: <strong className="text-ink num">{invoice.referenceNumber}</strong></p>}
                  {invoice.paymentDate && <p>Payment Date: <strong className="text-ink num">{invoice.paymentDate}</strong></p>}
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-2 rounded-xl border border-line bg-bg p-3 text-xs">
              <div className="flex items-center justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="font-bold text-ink num">{formatINR(invoice.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-ink-soft">
                <span>Tax (GST 0%)</span>
                <span className="font-bold text-ink num">{formatINR(invoice.taxAmount)}</span>
              </div>

              <div className="flex items-center justify-between border-t border-line pt-2 font-extrabold text-ink text-sm">
                <span>Total Amount</span>
                <span className="text-primary num">{formatINR(invoice.totalAmount)}</span>
              </div>

              <div className="flex items-center justify-between text-emerald-700 font-bold border-t border-line/50 pt-1.5">
                <span>Amount Paid</span>
                <span className="num">{formatINR(invoice.amountPaid)}</span>
              </div>

              <div className="flex items-center justify-between text-rose-700 font-extrabold border-t border-line/50 pt-1.5">
                <span>Balance Due</span>
                <span className="num">{formatINR(invoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="border-t border-line pt-4 text-center text-[10px] text-ink-soft space-y-1">
            <p className="font-bold text-ink">Thank you for doing business with {company.businessName || 'Navexa Logistics'}!</p>
            <p>Computer generated invoice. No signature required.</p>
          </div>

        </div>

      </div>
    </div>
  )
}
