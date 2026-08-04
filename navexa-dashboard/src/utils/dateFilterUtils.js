/**
 * dateFilterUtils.js
 * Comprehensive date range calculator for Navexa Finance & Accounting Dashboard.
 */

export const QUICK_DATE_PRESETS = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'Last Quarter',
  'This Year',
  'Last Year',
  'All Time',
  'Custom',
]

/**
 * Format a Date object as YYYY-MM-DD
 */
export function formatISODate(d) {
  if (!d || isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Date or date string to readable label e.g., "01 Aug 2026"
 */
export function formatReadableDate(dInput) {
  if (!dInput) return ''
  const d = new Date(dInput)
  if (isNaN(d.getTime())) return String(dInput)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Calculate Start Date, End Date, Label, and Days Count for any preset or custom range
 */
export function getDateRangeBounds(preset = 'This Month', customFrom = '', customTo = '') {
  const now = new Date()
  let startDate = null
  let endDate = null
  let label = preset
  let isCustom = false

  switch (preset) {
    case 'Today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      label = `Today (${formatReadableDate(startDate)})`
      break
    }
    case 'Yesterday': {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0)
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999)
      label = `Yesterday (${formatReadableDate(startDate)})`
      break
    }
    case 'This Week': {
      // Monday as start of week
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      label = `This Week (${formatReadableDate(startDate)} – ${formatReadableDate(endDate)})`
      break
    }
    case 'Last Week': {
      const day = now.getDay()
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1)
      const lastWeekMonday = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 7, 0, 0, 0, 0)
      const lastWeekSunday = new Date(now.getFullYear(), now.getMonth(), diffToMonday - 1, 23, 59, 59, 999)
      startDate = lastWeekMonday
      endDate = lastWeekSunday
      label = `Last Week (${formatReadableDate(startDate)} – ${formatReadableDate(endDate)})`
      break
    }
    case 'This Month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      label = `This Month (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
      break
    }
    case 'Last Month': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      label = `Last Month (${startDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`
      break
    }
    case 'This Quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999)
      const qNum = Math.floor(now.getMonth() / 3) + 1
      label = `Q${qNum} ${now.getFullYear()} (${formatReadableDate(startDate)} – ${formatReadableDate(endDate)})`
      break
    }
    case 'Last Quarter': {
      let qMonth = Math.floor(now.getMonth() / 3) * 3 - 3
      let year = now.getFullYear()
      if (qMonth < 0) {
        qMonth += 12
        year -= 1
      }
      startDate = new Date(year, qMonth, 1, 0, 0, 0, 0)
      endDate = new Date(year, qMonth + 3, 0, 23, 59, 59, 999)
      const qNum = Math.floor(qMonth / 3) + 1
      label = `Q${qNum} ${year} (${formatReadableDate(startDate)} – ${formatReadableDate(endDate)})`
      break
    }
    case 'This Year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      label = `Year ${now.getFullYear()}`
      break
    }
    case 'Last Year': {
      const year = now.getFullYear() - 1
      startDate = new Date(year, 0, 1, 0, 0, 0, 0)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      label = `Year ${year}`
      break
    }
    case 'Custom': {
      isCustom = true
      if (customFrom) {
        const [yf, mf, df] = customFrom.split('-').map(Number)
        startDate = new Date(yf, mf - 1, df, 0, 0, 0, 0)
      }
      if (customTo) {
        const [yt, mt, dt] = customTo.split('-').map(Number)
        endDate = new Date(yt, mt - 1, dt, 23, 59, 59, 999)
      }
      if (startDate && endDate) {
        label = `${formatReadableDate(startDate)} – ${formatReadableDate(endDate)}`
      } else if (startDate) {
        label = `From ${formatReadableDate(startDate)}`
      } else if (endDate) {
        label = `Until ${formatReadableDate(endDate)}`
      } else {
        label = 'Custom Range'
      }
      break
    }
    case 'All Time':
    default: {
      startDate = null
      endDate = null
      label = 'All Time Record'
      break
    }
  }

  // Days Count Calculation
  let daysCount = 1
  if (startDate && endDate) {
    const diffMs = endDate.getTime() - startDate.getTime()
    daysCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  } else {
    // For All Time, calculate days between today and Jan 1 2024 or 365 days fallback
    const startFallback = new Date(now.getFullYear() - 1, 0, 1)
    const diffMs = now.getTime() - startFallback.getTime()
    daysCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }

  return {
    preset,
    startDate,
    endDate,
    label,
    daysCount,
    isCustom,
  }
}
