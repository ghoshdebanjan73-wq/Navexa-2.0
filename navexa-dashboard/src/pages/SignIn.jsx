import { useState } from 'react'
import { Eye, EyeOff, Loader2, Route } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRouter } from '../context/RouterContext'

export default function SignInPage() {
  const { navigate } = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const errs = {}
    if (!email) {
      errs.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!password) {
      errs.password = 'Password is required.'
    }
    return errs
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        // Expose a clean user-friendly message rather than raw DB/tech error
        if (error.message?.toLowerCase().includes('invalid login credentials')) {
          setAuthError('Incorrect email or password.')
        } else {
          setAuthError(error.message || 'An error occurred during sign in.')
        }
        setIsSubmitting(false)
      } else {
        // Redirect to dashboard on success
        setIsSubmitting(false)
        navigate('Dashboard')
      }
    } catch (err) {
      console.error('Sign in exception:', err)
      setAuthError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-line bg-surface p-6 shadow-pop sm:p-8 animate-fadeUp">
        {/* Branding & Welcome */}
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
            Welcome back
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Sign in to manage your business operations
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="rounded-xl bg-danger-bg border border-danger/25 p-3.5 text-xs font-semibold text-danger animate-fadeIn">
            {authError}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email-address" className="block text-xs font-bold text-ink">
              Email address <span className="text-rose-500">*</span>
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
              placeholder="e.g. dispatcher@navexa.io"
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-bold text-ink">
                Password <span className="text-rose-500">*</span>
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => e.preventDefault()}
                className="text-[11px] font-semibold text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/15 rounded-md px-1"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }))
                }}
                placeholder="Enter your password"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Bottom sign up entry point */}
        <div className="text-center pt-2">
          <p className="text-xs text-ink-soft">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('SignUp')}
              className="font-bold text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent/15 rounded-md px-1 cursor-pointer bg-transparent border-0"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
