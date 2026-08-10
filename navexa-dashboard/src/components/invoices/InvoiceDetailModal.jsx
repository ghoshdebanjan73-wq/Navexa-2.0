import { useState, useRef } from 'react'
import {
  X, Printer, Download, CreditCard, CheckCircle2, AlertCircle,
  Building2, Phone, Mail, FileText, MapPin, Route, Car, User, ArrowRight,
  Plus, Trash2, Calendar, ShieldCheck, DollarSign
} from 'lucide-react'
import { formatINR } from '../../data/tripStore'
import {
  getInvoicePaymentSummary,
  getPaymentsByInvoice,
  deleteInvoicePaymentRecord
} from '../../data/paymentStore'
import StatusBadge from '../ui/StatusBadge'
import PasswordConfirmModal from '../ui/PasswordConfirmModal'
import { printInvoice } from '../../utils/printInvoice'

export default function InvoiceDetailModal({ invoice, isOpen, onClose, onRecordPayment, isAdmin, currentUser }) {
  const printRef = useRef(null)
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState(null)

  if (!isOpen || !invoice) return null

  const company = invoice.companyDetails || {}
  const trip = invoice.tripDetails || {}

  const amountPaid = Number(invoice.amountPaid || 0)
  const remainingBalance = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, invoice.totalAmount - amountPaid))
  const progressPercentage = invoice.totalAmount > 0 ? Math.min(100, Math.round((amountPaid / invoice.totalAmount) * 100)) : 0
  const paymentStatus = invoice.paymentStatus || (remainingBalance === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Pending')

  const paymentSummary = {
    totalAmount: invoice.totalAmount,
    amountPaid,
    remainingBalance,
    progressPercentage,
    paymentStatus,
  }

  const rawStorePayments = getPaymentsByInvoice(invoice.id)
  const paymentsList = (Array.isArray(invoice.payments) && invoice.payments.length > 0) ? invoice.payments : rawStorePayments

  const handlePrint = () => {
    printInvoice(invoice)
  }

  const handleDownload = () => {
    printInvoice(invoice)
  }

  const handleDeletePaymentConfirmed = async () => {
    if (!deleteConfirmPayment) return
    deleteInvoicePaymentRecord(deleteConfirmPayment.id, currentUser)
    setDeleteConfirmPayment(null)
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

      <div className="my-6 w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={paymentSummary.paymentStatus} />
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

            {isAdmin && paymentSummary.paymentStatus !== 'Paid' && (
              <button
                onClick={() => { onRecordPayment(invoice) }}
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

        {/* ─── DEDICATED PAYMENT DETAILS SECTION (SCREEN VIEW) ─────────────────── */}
        <div className="no-print space-y-4 rounded-2xl border border-line bg-bg/50 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Payment Details & Progress
            </h3>
            {isAdmin && paymentSummary.remainingBalance > 0 && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Payment
              </button>
            )}
          </div>

          {/* Payment Progress Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase text-ink-soft">Invoice Total</p>
              <p className="text-sm font-extrabold text-ink num">{formatINR(paymentSummary.totalAmount)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Total Paid</p>
              <p className="text-sm font-extrabold text-emerald-700 num">{formatINR(paymentSummary.amountPaid)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase text-rose-700">Remaining Balance</p>
              <p className="text-sm font-extrabold text-rose-700 num">{formatINR(paymentSummary.remainingBalance)}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
              <p className="text-[10px] font-bold uppercase text-sky-700">Payment Progress</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-sky-700 num">{paymentSummary.progressPercentage}%</span>
                <StatusBadge status={paymentSummary.paymentStatus} size="sm" showDot={false} />
              </div>
            </div>
          </div>

          {/* Clean Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] font-bold text-ink-soft">
              <span>Payment Progress Bar</span>
              <span className="num">{paymentSummary.progressPercentage}% Completed</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  paymentSummary.progressPercentage === 100
                    ? 'bg-emerald-500'
                    : paymentSummary.progressPercentage > 0
                    ? 'bg-sky-500'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${paymentSummary.progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Payment History List */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ink">
              <span>Payment History ({paymentsList.length})</span>
            </div>

            {paymentsList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface p-4 text-center text-xs text-ink-soft">
                No payments recorded for this invoice yet.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-hidden rounded-xl border border-line bg-surface">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                      <tr>
                        <th className="px-3 py-2">Payment #</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Collected By</th>
                        {isAdmin && <th className="px-3 py-2 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-medium text-ink">
                      {paymentsList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2 font-bold num">{p.paymentNumber}</td>
                          <td className="px-3 py-2 num text-ink-soft">{p.paymentDate}</td>
                          <td className="px-3 py-2 text-right font-extrabold text-emerald-700 num">{formatINR(p.amount)}</td>
                          <td className="px-3 py-2 font-semibold">{p.paymentMethod}</td>
                          <td className="px-3 py-2 num text-ink-soft">{p.referenceNumber || '—'}</td>
                          <td className="px-3 py-2 text-ink-soft">{p.collectedBy}</td>
                          {isAdmin && (
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => setDeleteConfirmPayment(p)}
                                className="text-ink-soft hover:text-rose-600 transition-colors p-1 cursor-pointer"
                                title="Delete payment entry"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Cards */}
                  <div className="sm:hidden space-y-2">
                    {paymentsList.map((p) => (
                      <div key={p.id} className="rounded-xl border border-line bg-surface p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="num">{p.paymentNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 font-extrabold num">{formatINR(p.amount)}</span>
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteConfirmPayment(p)}
                                className="text-ink-soft hover:text-rose-600 p-0.5"
                                title="Delete payment"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-ink-soft">
                          <span>{p.paymentDate} • {p.paymentMethod}</span>
                          <span>By: {p.collectedBy}</span>
                        </div>
                        {p.referenceNumber && (
                          <p className="text-[10px] text-ink-soft num">Ref: {p.referenceNumber}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <PasswordConfirmModal
            isOpen={!!deleteConfirmPayment}
            title="Confirm Payment Deletion"
            description={`Deleting payment ${deleteConfirmPayment?.paymentNumber || ''} (${formatINR(deleteConfirmPayment?.amount || 0)}) will update invoice balance and audit logs. Enter password to verify.`}
            actionLabel="Delete Payment"
            onConfirm={handleDeletePaymentConfirmed}
            onClose={() => setDeleteConfirmPayment(null)}
          />

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
                <span className="num">{formatINR(paymentSummary.amountPaid)}</span>
              </div>

              <div className="flex items-center justify-between text-rose-700 font-extrabold border-t border-line/50 pt-1.5">
                <span>Balance Due</span>
                <span className="num">{formatINR(paymentSummary.remainingBalance)}</span>
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
