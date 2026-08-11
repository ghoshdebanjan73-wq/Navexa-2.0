import { useState, useEffect, useRef } from 'react'
import { X, Printer, Building2, TrendingUp, TrendingDown, Scale, CheckCircle2 } from 'lucide-react'
import { getCompanyInvoiceDetails } from '../../data/invoiceStore'
import { formatINR } from '../../data/tripStore'
import { playSuccessSound } from '../../utils/soundEngine'

export default function ProfitLossPrintModal({ isOpen, onClose, overview, expenseBreakdown, vehiclePerf, dateRangeLabel }) {
  const [company, setCompany] = useState({})
  const printRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      getCompanyInvoiceDetails().then(data => setCompany(data || {}))
    }
  }, [isOpen])

  if (!isOpen || !overview) return null

  const grossRevenue = Number(overview.totalRevenue || 0)
  const totalExpenses = Number(overview.totalExpenses || 0)
  const netProfit = Number(overview.netProfit || 0)
  const marginPercentage = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0

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
          #printable-pnl-report, #printable-pnl-report * {
            visibility: visible;
          }
          #printable-pnl-report {
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
        
        {/* Top Action Header */}
        <div className="no-print flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
              <Scale size={18} className="text-primary" /> Profit & Loss Statement (P&L)
            </h3>
            <p className="text-xs text-ink-soft">Period: <strong className="text-ink">{dateRangeLabel}</strong></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-hover active:scale-97 transition-all cursor-pointer"
            >
              <Printer size={15} /> Print / Save P&L PDF
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable PDF Document Layout */}
        <div id="printable-pnl-report" ref={printRef} className="space-y-6 bg-surface p-2 text-ink">
          
          {/* Executive Company Header */}
          <div className="flex items-start justify-between border-b-2 border-primary pb-4">
            <div>
              <h2 className="text-xl font-black text-ink">{company.businessName || 'Navexa Transport & Logistics'}</h2>
              <p className="text-xs text-ink-soft">{company.address || 'Hooghly, West Bengal, India'}</p>
              <p className="text-xs text-ink-soft num">Phone: {company.phone || 'N/A'} | Email: {company.email || 'N/A'}</p>
              {company.gstNumber && <p className="text-xs font-bold text-ink num mt-0.5">GSTIN: {company.gstNumber}</p>}
            </div>

            <div className="text-right">
              <span className="inline-block rounded-xl bg-primary text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                PROFIT & LOSS STATEMENT
              </span>
              <p className="text-xs text-ink-soft mt-1.5">Statement Period: <strong className="text-ink">{dateRangeLabel}</strong></p>
              <p className="text-[11px] text-ink-soft num">Generated Date: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* Highlights Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-line bg-emerald-50/60 p-3">
              <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Gross Operating Revenue</p>
              <p className="text-lg font-black text-emerald-900 num mt-1">{formatINR(grossRevenue)}</p>
            </div>

            <div className="rounded-xl border border-line bg-rose-50/60 p-3">
              <p className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Total Operating Expenses</p>
              <p className="text-lg font-black text-rose-900 num mt-1">{formatINR(totalExpenses)}</p>
            </div>

            <div className="rounded-xl border border-line bg-sky-50/60 p-3">
              <p className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider">Net Operating Profit</p>
              <p className={`text-lg font-black num mt-1 ${netProfit >= 0 ? 'text-primary' : 'text-rose-700'}`}>
                {formatINR(netProfit)}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-slate-100 p-3">
              <p className="text-[10px] font-extrabold text-ink-soft uppercase tracking-wider">Net Profit Margin</p>
              <p className={`text-lg font-black num mt-1 ${marginPercentage >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {marginPercentage}%
              </p>
            </div>
          </div>

          {/* Section 1: Income Breakdown */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-2 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-600" /> 1. Operating Revenue Breakdown
            </h4>
            <table className="w-full text-left text-xs border border-line rounded-xl overflow-hidden">
              <thead className="bg-bg text-[10px] font-bold uppercase text-ink-soft border-b border-line">
                <tr>
                  <th className="px-3 py-2">Revenue Category</th>
                  <th className="px-3 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                <tr>
                  <td className="px-3 py-2">Fleet Operational Trip Fares & Advance Collections</td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-800 num">{formatINR(grossRevenue)}</td>
                </tr>
                <tr className="bg-emerald-50/40 font-bold">
                  <td className="px-3 py-2 text-emerald-900">Total Gross Revenue (A)</td>
                  <td className="px-3 py-2 text-right text-emerald-900 font-extrabold num">{formatINR(grossRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Expense Categorization Breakdown */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-2 flex items-center gap-1.5">
              <TrendingDown size={14} className="text-rose-600" /> 2. Operating Expenses Breakdown
            </h4>
            <table className="w-full text-left text-xs border border-line rounded-xl overflow-hidden">
              <thead className="bg-bg text-[10px] font-bold uppercase text-ink-soft border-b border-line">
                <tr>
                  <th className="px-3 py-2">Expense Category</th>
                  <th className="px-3 py-2 text-center">% Share</th>
                  <th className="px-3 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {expenseBreakdown && expenseBreakdown.breakdown && expenseBreakdown.breakdown.length > 0 ? (
                  expenseBreakdown.breakdown.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2 text-center num">{item.percentage}%</td>
                      <td className="px-3 py-2 text-right font-semibold text-rose-800 num">{formatINR(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-center text-ink-soft">No recorded expenses for this period.</td>
                  </tr>
                )}
                <tr className="bg-rose-50/40 font-bold">
                  <td className="px-3 py-2 text-rose-900" colSpan={2}>Total Operating Expenses (B)</td>
                  <td className="px-3 py-2 text-right text-rose-900 font-extrabold num">{formatINR(totalExpenses)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Fleet Vehicle Performance Attribution */}
          {vehiclePerf && vehiclePerf.length > 0 && (
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-line pb-1.5 mb-2">
                3. Vehicle Fleet Profitability Contribution
              </h4>
              <table className="w-full text-left text-xs border border-line rounded-xl overflow-hidden">
                <thead className="bg-bg text-[10px] font-bold uppercase text-ink-soft border-b border-line">
                  <tr>
                    <th className="px-3 py-2">Vehicle Name</th>
                    <th className="px-3 py-2 text-center">Trips</th>
                    <th className="px-3 py-2 text-right">Trip Revenue</th>
                    <th className="px-3 py-2 text-right">Expenses</th>
                    <th className="px-3 py-2 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium text-ink">
                  {vehiclePerf.map(v => (
                    <tr key={v.id}>
                      <td className="px-3 py-2 font-bold">{v.name} ({v.registration})</td>
                      <td className="px-3 py-2 text-center num">{v.completedTrips}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold num">{formatINR(v.tripRevenue)}</td>
                      <td className="px-3 py-2 text-right text-rose-700 num">{formatINR(v.recordedExpenses)}</td>
                      <td className="px-3 py-2 text-right font-extrabold num">{formatINR(v.estimatedProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Authorization Block */}
          <div className="pt-6 mt-6 border-t border-line flex items-end justify-between text-xs">
            <div>
              <p className="text-[11px] text-ink-soft">Computer-generated Profit & Loss Statement by Navexa ERP.</p>
              <p className="text-[10px] text-ink-soft num">Report ID: PNL-{Date.now().toString().slice(-6)}</p>
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
