import { useState } from 'react'
import { User, Mail, Shield, CheckCircle2, Save, Loader2 } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { supabase } from '../lib/supabase'

export default function UserProfilePage() {
  const { user, currentUser, setCurrentUser, initials } = useUser()

  const [firstName, setFirstName] = useState(user?.firstName || (user?.name ? user.name.split(' ')[0] : ''))
  const [lastName, setLastName] = useState(user?.lastName || (user?.name ? user.name.split(' ').slice(1).join(' ') : ''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || user?.name || 'User'

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!firstName.trim()) {
      setErrorMsg('First Name is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const newFullName = `${firstName.trim()} ${lastName.trim()}`.trim()

      // 1. Update Supabase Auth user metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: newFullName,
          name: newFullName,
        }
      })

      if (authError) {
        console.warn('Auth metadata update warning:', authError.message)
      }

      // 2. Update public.users table if it exists
      if (user?.id) {
        try {
          await supabase.from('users').upsert({
            id: user.id,
            name: newFullName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: user.email,
            role: user.role || 'Admin',
            updated_at: new Date().toISOString(),
          })
        } catch (dbErr) {
          console.warn('Users table upsert warning:', dbErr.message)
        }
      }

      // 3. Update local state in UserContext
      const updatedUser = {
        ...currentUser,
        name: newFullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }
      setCurrentUser(updatedUser)

      setSuccessMsg('User profile updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setErrorMsg(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
            Account Profile
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Manage your personal identity, contact information, and security role.
          </p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 animate-fadeIn">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Identity Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-black text-white shadow-md">
                {initials}
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink">{fullName}</h3>
              <p className="text-xs text-ink-soft mt-0.5">{user?.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary">
                <Shield size={13} />
                <span>{user?.role || 'Admin'} Role</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
            <div className="border-b border-line pb-3">
              <h3 className="text-sm font-extrabold text-ink">Personal Details</h3>
              <p className="text-xs text-ink-soft">Update your first and last name for greetings and documents.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label htmlFor="user-first-name" className="block text-xs font-bold text-ink">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="user-first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label htmlFor="user-last-name" className="block text-xs font-bold text-ink">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="user-last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>

              {/* Email (Read-Only) */}
              <div className="space-y-1.5">
                <label htmlFor="user-email-readonly" className="block text-xs font-bold text-ink">
                  Email Address <span className="text-xs font-normal text-ink-soft">(Account Identifier)</span>
                </label>
                <div className="relative">
                  <input
                    id="user-email-readonly"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-xl border border-line bg-slate-100/70 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-ink-soft cursor-not-allowed"
                  />
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                </div>
              </div>

              {/* Role (Read-Only) */}
              <div className="space-y-1.5">
                <label htmlFor="user-role-readonly" className="block text-xs font-bold text-ink">
                  System Role
                </label>
                <div className="relative">
                  <input
                    id="user-role-readonly"
                    type="text"
                    disabled
                    value={user?.role || 'Admin'}
                    className="w-full rounded-xl border border-line bg-slate-100/70 pl-9 pr-3.5 py-2 text-xs sm:text-sm font-semibold text-ink-soft cursor-not-allowed"
                  />
                  <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-line flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-primary-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
