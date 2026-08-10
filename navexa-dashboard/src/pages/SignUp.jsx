import { useState } from 'react'
import { Eye, EyeOff, Loader2, Mail, CheckCircle2, ChevronLeft, Route } from 'lucide-react'
import { supabase, getAuthRedirectUrl } from '../lib/supabase'
import { useRouter } from '../context/RouterContext'

export default function SignUpPage() {
  const { navigate } = useRouter()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = () => {
    const errs = {}
    if (!firstName.trim()) {
      errs.firstName = 'First Name is required.'
    }
    if (!lastName.trim()) {
      errs.lastName = 'Last Name is required.'
    }
    if (!email) {
      errs.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!password) {
      errs.password = 'Password is required.'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.'
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm your password.'
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    return errs
  }

  const [isResending, setIsResending] = useState(false)
  const [resendFeedback, setResendFeedback] = useState(null)

  const handleResendEmail = async () => {
    if (isResending || !email.trim()) return
    setIsResending(true)
    setResendFeedback(null)

    try {
      const redirectUrl = getAuthRedirectUrl()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          redirectTo: redirectUrl,
          emailRedirectTo: redirectUrl,
        }
      })

      if (error) {
        console.error('Supabase resend confirmation email error:', error)
        setResendFeedback({ type: 'error', text: error.message || 'Could not resend confirmation email. Please try again later.' })
      } else {
        setResendFeedback({ type: 'success', text: 'Confirmation email resent! Please check your Inbox, Spam, and Promotions folders.' })
      }
    } catch (err) {
      console.error('Resend confirmation email exception:', err)
      setResendFeedback({ type: 'error', text: 'An unexpected error occurred while resending the email.' })
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setAuthError('')
      return
    }

    setErrors({})
    setAuthError('')
    setIsSubmitting(true)

    try {
      const full = `${firstName.trim()} ${lastName.trim()}`.trim()
      const redirectUrl = getAuthRedirectUrl()

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          redirectTo: redirectUrl,
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: full,
            name: full,
            role: 'Admin',
          }
        }
      })

      if (error) {
        if (error.message?.toLowerCase().includes('user already registered')) {
          setAuthError('An account with this email address already exists.')
        } else {
          setAuthError(error.message || 'Failed to create your account. Please try again.')
        }
        setIsSubmitting(false)
      } else {
        if (data?.user) {
          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              name: full,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              email: email.trim(),
              role: 'Admin',
            })
          } catch (dbErr) {
            console.warn('Upsert to users table failed silently:', dbErr)
          }
        }
        if (data?.session) {
          setIsSubmitting(false)
          navigate('Dashboard')
        } else {
          setIsSuccess(true)
          setIsSubmitting(false)
        }
      }
    } catch (err) {
      console.error('Sign up exception:', err)
      setAuthError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // ─── Verification Required Screen ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-surface p-6 shadow-pop text-center sm:p-8 animate-scaleUp">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
            <Mail size={24} strokeWidth={2} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-ink">Check your email</h3>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>. Please click the link in your email to verify your account and sign in.
            </p>
          </div>

          {/* Delivery guidance */}
          <div className="rounded-xl border border-line bg-bg p-3.5 text-left text-xs text-ink-soft space-y-1.5">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Expected Delivery:
            </p>
            <p className="text-[11px] leading-relaxed">
              If you don't see the email immediately, please check your <strong>Spam</strong>, <strong>Junk</strong>, <strong>Promotions</strong>, or <strong>All Mail</strong> folders.
            </p>
          </div>

          {/* Feedback message banner */}
          {resendFeedback && (
            <div className={`rounded-xl p-3 text-xs font-semibold animate-fadeIn ${
              resendFeedback.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {resendFeedback.text}
            </div>
          )}

          {/* Resend button & Return to sign in */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-bg px-4 py-2.5 text-xs sm:text-sm font-bold text-ink hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary" /> Sending Confirmation Email...
                </>
              ) : (
                <>
                  <Mail size={16} /> Resend Confirmation Email
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('SignIn')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} /> Return to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-line bg-surface p-6 shadow-pop sm:p-8 animate-fadeUp">
        {/* Branding & Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <Route size={22} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            Navexa
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-ink-soft">
            Transport & Fleet Management
          </p>
          <h3 className="mt-5 text-base font-bold text-ink">
            Create your account
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Set up your account to start managing your business
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="rounded-xl bg-danger-bg border border-danger/25 p-3.5 text-xs font-semibold text-danger animate-fadeIn">
            {authError}
          </div>
        )}

        {/* Sign Up Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {/* First Name & Last Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="first-name" className="block text-xs font-bold text-ink">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="first-name"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (errors.firstName) setErrors(prev => ({ ...prev, firstName: null }))
                }}
                placeholder="e.g. Rahul"
                className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                  errors.firstName
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="last-name" className="block text-xs font-bold text-ink">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="last-name"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (errors.lastName) setErrors(prev => ({ ...prev, lastName: null }))
                }}
                placeholder="e.g. Sharma"
                className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                  errors.lastName
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email-address" className="block text-xs font-bold text-ink">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors(prev => ({ ...prev, email: null }))
              }}
              placeholder="e.g. rahul@example.com"
              className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                errors.email
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                  : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold text-ink">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }))
                }}
                placeholder="Minimum 8 characters"
                className={`w-full rounded-xl border bg-bg pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                  errors.password
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer focus:outline-none p-1 rounded-md"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="block text-xs font-bold text-ink">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }))
                }}
                placeholder="Re-enter password"
                className={`w-full rounded-xl border bg-bg pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                  errors.confirmPassword
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                    : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer focus:outline-none p-1 rounded-md"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 px-4 text-xs sm:text-sm font-bold shadow-xs transition-all hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </div>
        </form>

        {/* Already have an account link */}
        <div className="text-center pt-2">
          <p className="text-xs text-ink-soft">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('SignIn')}
              className="font-bold text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/15 rounded-md px-1 cursor-pointer bg-transparent border-0"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
