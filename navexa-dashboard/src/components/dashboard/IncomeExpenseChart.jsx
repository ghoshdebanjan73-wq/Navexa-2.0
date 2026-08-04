import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { chartData as mockChartData } from '../../data/mockData'

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const compactINR = (n) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-md text-xs space-y-1">
      <p className="font-bold text-ink border-b border-line pb-1 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-ink-soft">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: p.dataKey === 'income' ? '#059669' : p.dataKey === 'expense' ? '#E11D48' : '#3B82F6'
              }}
            />
            {p.dataKey === 'income' ? 'Income' : p.dataKey === 'expense' ? 'Expenses' : 'Net Profit'}
          </div>
          <span className="font-bold text-ink num">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function IncomeExpenseChart({ transactions = [], dateBounds = null }) {
  // Generate dynamic chart data based on filtered transactions if available
  const dynamicData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return mockChartData['30 Days'] || []
    }

    // Sort transactions chronologically
    const sorted = [...transactions].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))

    // Grouping strategy: If total days <= 31, group by day; else group by month
    const totalDays = dateBounds?.daysCount || 30
    const groupMap = new Map()

    sorted.forEach(t => {
      if (!t.date) return
      const d = new Date(t.date)
      if (isNaN(d.getTime())) return

      let key = ''
      if (totalDays <= 31) {
        key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      } else {
        key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, { label: key, income: 0, expense: 0, profit: 0 })
      }

      const point = groupMap.get(key)
      if (t.type === 'Income') {
        point.income += Number(t.amount || 0)
      } else {
        point.expense += Number(t.amount || 0)
      }
      point.profit = point.income - point.expense
    })

    const points = Array.from(groupMap.values())
    if (points.length < 2 && sorted.length > 0) {
      // Ensure at least two points for visual line rendering
      return points
    }

    return points.length > 0 ? points : mockChartData['30 Days']
  }, [transactions, dateBounds])

  const totalIncome = dynamicData.reduce((acc, curr) => acc + (curr.income || 0), 0)
  const totalExpense = dynamicData.reduce((acc, curr) => acc + (curr.expense || 0), 0)
  const netMargin = totalIncome - totalExpense

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Header: Title & Period Filter Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight">Financial Cash Flow & Trends</h3>
          <p className="text-xs text-ink-soft">
            {dateBounds?.label ? `Showing trends for ${dateBounds.label}` : 'Income vs Expenses cash flow comparison'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Income
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Expenses
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Profit
          </span>
        </div>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-line/60 bg-bg p-3 text-xs">
        <div>
          <p className="text-[11px] font-semibold text-ink-soft flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Total Income
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-700 num">{formatINR(totalIncome)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink-soft flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600" /> Total Expenses
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-rose-700 num">{formatINR(totalExpense)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink-soft">Net Cash Flow</p>
          <p className={`mt-0.5 text-sm sm:text-base font-bold num ${netMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatINR(netMargin)}
          </p>
        </div>
      </div>

      {/* Minimal Line Chart Container */}
      <div className="h-[250px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dynamicData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={compactINR}
              width={42}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Green Line for Income */}
            <Line
              type="monotone"
              dataKey="income"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#059669' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            
            {/* Red Line for Expenses */}
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#E11D48"
              strokeWidth={2}
              dot={{ r: 3, fill: '#E11D48' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
