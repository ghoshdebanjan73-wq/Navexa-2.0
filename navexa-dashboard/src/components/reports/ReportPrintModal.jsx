import { useState, useEffect, useRef } from 'react'
import { X, Printer, Download, Building2 } from 'lucide-react'
import { getCompanyInvoiceDetails } from '../../data/invoiceStore'
import { formatINR } from '../../data/tripStore'

export default function ReportPrintModal({ isOpen, onClose, overview, vehicles, receivables, dateRangeLabel }) {
  const [company, setCompany] = useState({})
  const printRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      getCompanyInvoiceDetails().then(data => setCompany(data || {}))
    }
  }, [isOpen])

  if (!isOpen || !overview) return null

  const handlePrint = () => {
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
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
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

      <div className="my-6 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-pop animate-scaleUp space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Top Control Bar */}
        <div className="no-print flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-ink">Business Performance Report</h3>
            <p className="text-xs text-ink-soft">Period: <strong className="text-ink">{dateRangeLabel}</strong></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg px-3.5 py-1.5 text-xs font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable PDF Content */}
        <div id="printable-report" ref={printRef} className="space-y-6 bg-surface p-2 text-ink">
          
          {/* Header Branding */}
          <div className="flex items-start justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-lg font-black text-ink">{company.businessName || 'Navexa Transport & Logistics'}</h2>
              <p className="text-xs text-ink-soft">{company.address || 'Hooghly, West Bengal, India'}</p>
              <p className="text-xs text-ink-soft num">Phone: {company.phone} | Email: {company.email}</p>
              {company.gstNumber && <p className="text-xs font-semibold text-ink num mt-0.5">GSTIN: {company.gstNumber}</p>}
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-extrabold text-primary uppercase tracking-wider">
                Executive Report
              </span>
              <p className="text-xs text-ink-soft mt-1">Period: <strong className="text-ink">{dateRangeLabel}</strong></p>
              <p className="text-[10px] text-ink-soft num">Generated: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Financial Overview Summary */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-3">
              1. Business Overview Summary
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Total Revenue</p>
                <p className="text-sm font-extrabold text-emerald-800 num mt-0.5">{formatINR(overview.totalRevenue)}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Total Expenses</p>
                <p className="text-sm font-extrabold text-rose-800 num mt-0.5">{formatINR(overview.totalExpenses)}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[10px] font-bold text-ink-soft uppercase">Net Profit</p>
                <p className={`text-sm font-extrabold num mt-0.5 ${overview.netProfit >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                  {formatINR(overview.netProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* Fleet Vehicles Comparison */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-3">
              2. Fleet Vehicle Performance
            </h4>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                  <tr>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2 text-center">Completed Trips</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-right">Expenses</th>
                    <th className="px-3 py-2 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-ink">
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 font-bold">{v.name} ({v.registration})</td>
                      <td className="px-3 py-2 text-center num">{v.completedTrips}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-bold num">{formatINR(v.tripRevenue)}</td>
                      <td className="px-3 py-2 text-right text-rose-700 num">{formatINR(v.recordedExpenses)}</td>
                      <td className="px-3 py-2 text-right font-extrabold num">{formatINR(v.estimatedProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outstanding Receivables */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-3">
              3. Outstanding Receivables ({receivables.length})
            </h4>
            {receivables.length === 0 ? (
              <p className="text-xs text-ink-soft italic">No outstanding receivables for this period.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                    <tr>
                      <th className="px-3 py-2">Invoice No</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 text-right">Total Amount</th>
                      <th className="px-3 py-2 text-right">Balance Due</th>
                      <th className="px-3 py-2">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium text-ink">
                    {receivables.slice(0, 5).map(i => (
                      <tr key={i.id}>
                        <td className="px-3 py-2 font-bold text-primary num">{i.invoiceNumber}</td>
                        <td className="px-3 py-2 font-semibold">{i.customerName}</td>
                        <td className="px-3 py-2 text-right num">{formatINR(i.totalAmount)}</td>
                        <td className="px-3 py-2 text-right text-rose-700 font-extrabold num">{formatINR(i.balanceDue)}</td>
                        <td className="px-3 py-2 num text-ink-soft">{i.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signoff Footer */}
          <div className="border-t border-line pt-4 text-center text-[10px] text-ink-soft">
            <p>Computer generated business performance report • {company.businessName || 'Navexa Transport'}</p>
          </div>

        </div>

      </div>
    </div>
  )
}
