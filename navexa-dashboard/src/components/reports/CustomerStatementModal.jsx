import { useState, useEffect, useRef } from 'react'
import { X, Printer, FileText, UserCheck } from 'lucide-react'
import { getCompanyInvoiceDetails } from '../../data/invoiceStore'
import { formatINR } from '../../data/tripStore'
import { playSuccessSound } from '../../utils/soundEngine'

export default function CustomerStatementModal({ isOpen, onClose, customer, invoices = [], payments = [], trips = [] }) {
  const [company, setCompany] = useState({})
  const printRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      getCompanyInvoiceDetails().then(data => setCompany(data || {}))
    }
  }, [isOpen])

  if (!isOpen || !customer) return null

  // Filter customer invoices
  const customerInvoices = invoices.filter(inv => 
    String(inv.customer_id) === String(customer.id) ||
    String(inv.customerName || inv.customer_name).toLowerCase() === String(customer.name).toLowerCase()
  )

  // Filter customer trips
  const customerTrips = trips.filter(t =>
    String(t.customer_id) === String(customer.id) ||
    String(t.customer).toLowerCase() === String(customer.name).toLowerCase()
  )

  // Build Chronological Ledger Entries
  const ledgerEntries = []

  // Add Invoices
  customerInvoices.forEach(inv => {
    ledgerEntries.push({
      date: inv.invoice_date || inv.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      ref: inv.invoice_number || `INV-${inv.id}`,
      type: 'Invoice Issued',
      description: inv.trip_details?.pickup_location 
        ? `Trip #${inv.trip_id || ''}: ${inv.trip_details.pickup_location} → ${inv.trip_details.destination}`
        : `Tax Invoice ${inv.invoice_number}`,
      debit: Number(inv.total_amount || 0),
      credit: 0
    })

    // Add Payments recorded inside invoice
    if (inv.payments && Array.isArray(inv.payments)) {
      inv.payments.forEach(p => {
        ledgerEntries.push({
          date: p.date || p.payment_date || inv.invoice_date,
          ref: `PAY-${p.id || inv.id.slice(-4)}`,
          type: 'Payment Received',
          description: `Payment via ${p.method || p.payment_method || 'UPI/Bank'} ${p.notes ? `(${p.notes})` : ''}`,
          debit: 0,
          credit: Number(p.amount || 0)
        })
      })
    }
  })

  // Sort chronological
  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calculate Running Balance
  let runningBalance = 0
  const statementLedger = ledgerEntries.map(entry => {
    runningBalance = runningBalance + entry.debit - entry.credit
    return {
      ...entry,
      balance: runningBalance
    }
  })

  const totalInvoiced = ledgerEntries.reduce((sum, e) => sum + e.debit, 0)
  const totalPaid = ledgerEntries.reduce((sum, e) => sum + e.credit, 0)
  const outstandingBalance = totalInvoiced - totalPaid

  const handlePrint = () => {
    playSuccessSound()
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-statement-report, #printable-statement-report * {
            visibility: visible;
          }
          #printable-statement-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="my-6 w-full max-w-3xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-modalPop space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Control Header */}
        <div className="no-print flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Customer Statement of Account
            </h3>
            <p className="text-xs text-ink-soft">Client: <strong className="text-ink">{customer.name}</strong></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover active:scale-97 transition-all cursor-pointer"
            >
              <Printer size={15} /> Print / Save Statement PDF
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable PDF Document Content */}
        <div id="printable-statement-report" ref={printRef} className="space-y-6 bg-surface p-2 text-ink">
          
          {/* Header Branding */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4">
            <div>
              <h2 className="text-xl font-black text-ink">{company.businessName || 'Navexa Transport & Logistics'}</h2>
              <p className="text-xs text-ink-soft">{company.address || 'Hooghly, West Bengal, India'}</p>
              <p className="text-xs text-ink-soft num">Phone: {company.phone || 'N/A'} | Email: {company.email || 'N/A'}</p>
              {company.gstNumber && <p className="text-xs font-bold text-ink num mt-0.5">GSTIN: {company.gstNumber}</p>}
            </div>

            <div className="text-right">
              <span className="inline-block rounded-xl bg-slate-900 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                STATEMENT OF ACCOUNT
              </span>
              <p className="text-xs text-ink-soft mt-1.5">Date: <strong className="text-ink">{new Date().toLocaleDateString('en-IN')}</strong></p>
            </div>
          </div>

          {/* Customer Bill-To Info & Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Info */}
            <div className="rounded-xl border border-line bg-bg p-3.5 space-y-1">
              <p className="text-[10px] font-extrabold uppercase text-ink-soft tracking-wider">Statement Issued To</p>
              <h3 className="text-sm font-black text-ink">{customer.name}</h3>
              {customer.company_name && <p className="text-xs font-bold text-primary">{customer.company_name}</p>}
              <p className="text-xs text-ink-soft num">Phone: {customer.phone}</p>
              {customer.email && <p className="text-xs text-ink-soft">Email: {customer.email}</p>}
              {customer.address && <p className="text-xs text-ink-soft">{customer.address}, {customer.city || ''}</p>}
            </div>

            {/* Account Summary Metrics */}
            <div className="rounded-xl border border-line bg-bg p-3.5 space-y-2">
              <p className="text-[10px] font-extrabold uppercase text-ink-soft tracking-wider">Account Financial Summary</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-ink-soft">Total Invoiced</p>
                  <p className="font-extrabold text-ink num">{formatINR(totalInvoiced)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-soft">Total Paid</p>
                  <p className="font-extrabold text-emerald-700 num">{formatINR(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-ink-soft">Balance Due</p>
                  <p className={`font-extrabold num ${outstandingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatINR(outstandingBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Chronological Ledger Table */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-2">
              Itemized Ledger & Payment History
            </h4>
            <table className="w-full text-left text-xs border border-line rounded-xl overflow-hidden">
              <thead className="bg-bg text-[10px] font-bold uppercase text-ink-soft border-b border-line">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Ref / Doc #</th>
                  <th className="px-3 py-2">Transaction Details</th>
                  <th className="px-3 py-2 text-right">Invoiced (₹)</th>
                  <th className="px-3 py-2 text-right">Paid (₹)</th>
                  <th className="px-3 py-2 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {statementLedger.length > 0 ? (
                  statementLedger.map((row, idx) => (
                    <tr key={idx} className={row.debit > 0 ? 'bg-surface' : 'bg-emerald-50/20'}>
                      <td className="px-3 py-2 text-ink-soft num whitespace-nowrap">{row.date}</td>
                      <td className="px-3 py-2 font-bold num">{row.ref}</td>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2 text-right font-semibold text-ink num">
                        {row.debit > 0 ? formatINR(row.debit) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700 num">
                        {row.credit > 0 ? formatINR(row.credit) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-black num">
                        {formatINR(row.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-ink-soft">
                      No invoices or payments recorded for this customer yet.
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="px-3 py-2.5 text-ink">Closing Outstanding Balance Due</td>
                  <td className="px-3 py-2.5 text-right text-ink font-extrabold num">{formatINR(totalInvoiced)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-700 font-extrabold num">{formatINR(totalPaid)}</td>
                  <td className="px-3 py-2.5 text-right text-rose-700 font-black num text-sm">{formatINR(outstandingBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Notes & Authorized Signatory */}
          <div className="pt-6 mt-6 border-t border-line flex items-end justify-between text-xs">
            <div>
              <p className="text-[11px] font-bold text-ink">Payment Remittance Details:</p>
              <p className="text-[11px] text-ink-soft">Please send payments via UPI / Bank Transfer as referenced above.</p>
              <p className="text-[10px] text-ink-soft num mt-0.5">Generated by Navexa Fleet ERP</p>
            </div>
            <div className="text-center w-48 border-t border-slate-300 pt-2">
              <p className="font-bold text-ink text-xs">Authorized Signatory</p>
              <p className="text-[10px] text-ink-soft">{company.businessName || 'Navexa Transport'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
