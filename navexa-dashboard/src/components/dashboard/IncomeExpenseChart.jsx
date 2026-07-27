import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { chartData } from '../../data/mockData'

const PERIODS = ['7 Days', '30 Days', '3 Months', '6 Months', '1 Year']

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
              style={{ background: p.dataKey === 'income' ? '#059669' : '#E11D48' }}
            />
            {p.dataKey === 'income' ? 'Income' : 'Expenses'}
          </div>
          <span className="font-bold text-ink num">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function IncomeExpenseChart() {
  const [period, setPeriod] = useState('30 Days')
  const currentData = chartData[period] || chartData['30 Days']

  // Summary Metrics calculations for current period
  const totalIncome = currentData.reduce((acc, curr) => acc + curr.income, 0)
  const totalExpense = currentData.reduce((acc, curr) => acc + curr.expense, 0)
  const netMargin = totalIncome - totalExpense

  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Header: Title & Period Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink tracking-tight">Financial Overview</h3>
          <p className="text-xs text-ink-soft">Income vs Expenses cash flow comparison</p>
        </div>

        {/* 5 Period Filter Toggle Buttons */}
        <div className="inline-flex flex-wrap rounded-lg border border-line bg-bg p-0.5 self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-line/60 bg-bg p-3 text-xs">
        <div>
          <p className="text-[11px] font-semibold text-ink-soft flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Income
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-emerald-700 num">{formatINR(totalIncome)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink-soft flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-600" /> Expenses
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-rose-700 num">{formatINR(totalExpense)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-ink-soft">Balance</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-ink num">{formatINR(netMargin)}</p>
        </div>
      </div>

      {/* Minimal Line Chart Container */}
      <div className="h-[250px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            {/* Minimal horizontal dashed grid lines */}
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
            
            {/* Professional Green Line for Income */}
            <Line
              type="monotone"
              dataKey="income"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#059669' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            
            {/* Professional Red Line for Expenses */}
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
