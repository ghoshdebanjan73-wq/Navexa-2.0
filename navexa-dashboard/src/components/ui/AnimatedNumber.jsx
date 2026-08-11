import React, { useState, useEffect, useRef } from 'react'

/**
 * AnimatedNumber
 * Pure visual component to smoothly animate numeric value updates (e.g. financial metrics or trip counts)
 * Financial safety guaranteed: pure visual display, underlying calculations remain untouched.
 */
export default function AnimatedNumber({
  value = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 400,
  className = '',
  formatter,
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const [displayValue, setDisplayValue] = useState(numericValue)
  const prevValueRef = useRef(numericValue)
  const animFrameRef = useRef(null)

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(numericValue)
      prevValueRef.current = numericValue
      return
    }

    const startValue = prevValueRef.current
    const endValue = numericValue

    if (startValue === endValue) {
      setDisplayValue(endValue)
      return
    }

    const startTime = performance.now()

    const updateNumber = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * eased

      setDisplayValue(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateNumber)
      } else {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      }
    }

    animFrameRef.current = requestAnimationFrame(updateNumber)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [numericValue, duration])

  const formattedStr = formatter
    ? formatter(displayValue)
    : decimals > 0
    ? displayValue.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(displayValue).toLocaleString('en-IN')

  return (
    <span className={`inline-block transition-colors duration-200 ${className}`}>
      {prefix}{formattedStr}{suffix}
    </span>
  )
}
