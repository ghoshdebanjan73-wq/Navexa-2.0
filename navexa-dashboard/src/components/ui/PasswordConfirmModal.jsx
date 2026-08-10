import { useState } from 'react'
import { ShieldAlert, Eye, EyeOff, Lock, X, AlertCircle } from 'lucide-react'
import { useUser } from '../../context/UserContext'

export default function PasswordConfirmModal({
  isOpen,
  title = 'Password Verification Required',
  description = 'This is a sensitive action. Please enter your password to confirm and proceed.',
  actionLabel = 'Confirm & Proceed',
  onConfirm,
  onClose,
}) {
  const { verifyPassword } = useUser()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await verifyPassword(password.trim())
      if (!res.success) {
        setError(res.error || 'Incorrect password. Verification failed.')
        setLoading(false)
        return
      }

      // Password verified! Execute sensitive action
      setPassword('')
      setError(null)
      setLoading(false)
      if (onConfirm) await onConfirm()
      if (onClose) onClose()
    } catch (err) {
      console.error('Password verification error:', err)
      setError(err.message || 'Incorrect password. Verification failed.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError(null)
    setLoading(false)
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-pop">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors cursor-pointer"
          aria-label="Close verification modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 shadow-2xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-ink leading-snug">{title}</h3>
            <p className="mt-0.5 text-xs text-ink-soft leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 animate-fadeIn">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Confirm Your Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter password to verify"
                autoFocus
                required
                className="w-full rounded-xl border border-line bg-bg pl-10 pr-10 py-2.5 text-sm font-medium text-ink placeholder:text-ink-soft/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>{actionLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
