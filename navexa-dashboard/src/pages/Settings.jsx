import { useState, useEffect } from 'react'
import {
  Settings, Building2, Sliders, FileText, Bell, Shield, Key, Save, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, User, Lock, Eye, EyeOff
} from 'lucide-react'
import {
  loadSystemSettings, saveSystemSettings, validateNextInvoiceNumber,
  loadUserAccounts, updateAccountPassword, DEFAULT_SETTINGS
} from '../data/settingsStore'
import { useUser } from '../context/UserContext'

export default function SettingsPage() {
  const { currentUser, user } = useUser()

  const [activeTab, setActiveTab] = useState('General') // 'General' | 'Business' | 'Invoices' | 'Notifications' | 'Users' | 'Security'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [toast, setToast] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Users List State
  const [usersList, setUsersList] = useState([])

  // Security / Change Password Form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordUpdating, setPasswordUpdating] = useState(false)

  // Fetch settings on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const data = await loadSystemSettings()
      setSettings(data)
      const users = await loadUserAccounts()
      setUsersList(users)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setHasUnsaved(true)
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    // Validate Invoice Number if on Invoices tab
    if (settings.invoicePrefix && settings.startingInvoiceNumber) {
      const valRes = validateNextInvoiceNumber(settings.invoicePrefix, settings.startingInvoiceNumber)
      if (!valRes.valid) {
        setErrorMsg(valRes.error)
        setToast({ type: 'error', message: valRes.error })
        return
      }
    }

    setSaving(true)
    try {
      await saveSystemSettings(settings)
      setHasUnsaved(false)
      setToast({ type: 'success', message: 'Settings saved successfully!' })
      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setErrorMsg('Unable to save changes. Please try again.')
      setToast({ type: 'error', message: 'Unable to save changes. Check connection.' })
    } finally {
      setSaving(false)
    }
  }

  // Handle Role Change with Admin safeguard
  const handleUserRoleChange = (targetUserId, newRole) => {
    const adminCount = usersList.filter(u => u.role === 'Admin').length
    const targetUser = usersList.find(u => u.id === targetUserId)

    if (targetUser?.role === 'Admin' && newRole === 'Staff' && adminCount <= 1) {
      setToast({ type: 'error', message: 'System requires at least ONE active Admin account.' })
      return
    }

    setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u))
    setToast({ type: 'success', message: `Role for ${targetUser?.name} updated to ${newRole}.` })
  }

  // Handle Change Password
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match!' })
      return
    }

    setPasswordUpdating(true)
    const res = await updateAccountPassword(newPassword)
    setPasswordUpdating(false)

    if (res.success) {
      setNewPassword('')
      setConfirmPassword('')
      setToast({ type: 'success', message: 'Password updated successfully via Supabase Auth!' })
    } else {
      setToast({ type: 'error', message: res.error || 'Failed to update password.' })
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-bg text-ink">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="text-xs font-bold text-ink-soft">Loading system preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 space-y-6">
      
      {/* Top Header & Save Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">Settings & Admin Controls</h1>
          <p className="text-xs text-ink-soft mt-0.5">Manage application preferences, business details, invoice defaults, and security.</p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsaved && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl animate-pulse">
              Unsaved changes
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-bold shadow-xs animate-scaleUp ${
          toast.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-ink-soft hover:text-ink">✕</button>
        </div>
      )}

      {/* Tab Controls Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {[
          { id: 'General', label: 'General', icon: Sliders },
          { id: 'Business', label: 'Business Profile', icon: Building2 },
          { id: 'Invoices', label: 'Invoice Defaults', icon: FileText },
          { id: 'Notifications', label: 'Notifications', icon: Bell },
          { id: 'Users', label: 'Users & Roles', icon: Shield },
          { id: 'Security', label: 'Security', icon: Key },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-slate-50'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: GENERAL PREFERENCES */}
      {activeTab === 'General' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-ink">General System Preferences</h3>
            <p className="text-xs text-ink-soft">Regional localization, currency, and date display settings.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-ink mb-1">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="English">English (United States)</option>
                <option value="English_IN">English (India)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 28/07/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 07/28/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Time Format</label>
              <select
                value={settings.timeFormat}
                onChange={(e) => handleChange('timeFormat', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="12h">12-Hour (e.g. 10:30 AM)</option>
                <option value="24h">24-Hour (e.g. 22:30)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUSINESS PROFILE (Bi-directional Sync with Company Profile) */}
      {activeTab === 'Business' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-line pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-ink">Business Profile & Contact Details</h3>
              <p className="text-xs text-ink-soft">Changes sync 100% bi-directionally with Company Profile and invoice headers.</p>
            </div>
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              Bi-directional Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-ink mb-1">Business Name *</label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Owner Name</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => handleChange('ownerName', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Business Phone *</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink num"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Business Email *</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-ink mb-1">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">City</label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">State</label>
              <input
                type="text"
                value={settings.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">GST Number</label>
              <input
                type="text"
                value={settings.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink uppercase num"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Logo Image URL</label>
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICE DEFAULTS & SAFETY */}
      {activeTab === 'Invoices' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-ink">Invoice Defaults & Numbering Safety</h3>
            <p className="text-xs text-ink-soft">Configures future invoice generation. Historical invoices will not be altered.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-ink mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                placeholder="NVX"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-extrabold text-ink uppercase num"
              />
              <p className="text-[10px] text-ink-soft mt-1">Example: NVX-000001</p>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Next Starting Number (6 Digits)</label>
              <input
                type="text"
                value={settings.startingInvoiceNumber}
                onChange={(e) => handleChange('startingInvoiceNumber', e.target.value)}
                placeholder="000001"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-extrabold text-ink num"
              />
              <p className="text-[10px] text-ink-soft mt-1">Validated against existing invoice numbers to prevent collision.</p>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Default Payment Due Period</label>
              <select
                value={settings.defaultDuePeriodDays}
                onChange={(e) => handleChange('defaultDuePeriodDays', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              >
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Default Tax Rate (GST %)</label>
              <input
                type="number"
                value={settings.defaultTaxRate}
                onChange={(e) => handleChange('defaultTaxRate', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink num"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-ink mb-1">Default Invoice Footer Terms & Notes</label>
              <textarea
                rows={3}
                value={settings.defaultNotes}
                onChange={(e) => handleChange('defaultNotes', e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION PREFERENCES */}
      {activeTab === 'Notifications' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-ink">Smart Reminder & Notification Controls</h3>
            <p className="text-xs text-ink-soft">Toggle operational reminders for trips, payments, and document expiries.</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'notifyUpcomingTrips', label: 'Upcoming Trip Reminders (Today / Tomorrow)' },
              { key: 'notifyVehicleInsurance', label: 'Vehicle Insurance Expiry Warnings' },
              { key: 'notifyVehiclePermit', label: 'Vehicle Permit Expiry Warnings' },
              { key: 'notifyVehicleFitness', label: 'Vehicle Fitness Certificate Expiry Warnings' },
              { key: 'notifyVehiclePollution', label: 'Pollution Certificate Expiry Warnings' },
              { key: 'notifyVehicleService', label: 'Scheduled Maintenance / Service Due Warnings' },
              { key: 'notifyDriverLicense', label: 'Driver Driving License Expiry Warnings' },
              { key: 'notifyOutstandingPayments', label: 'Overdue & Unpaid Invoice Reminders' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between rounded-xl border border-line bg-bg p-3.5 cursor-pointer">
                <span className="font-bold text-ink">{item.label}</span>
                <input
                  type="checkbox"
                  checked={!!settings[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  className="h-4 w-4 rounded text-primary focus:ring-accent"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: USERS & PERMISSIONS */}
      {activeTab === 'Users' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-ink">User Accounts & Role Permissions</h3>
            <p className="text-xs text-ink-soft">Manage Admin & Staff roles. The system requires at least one active Admin account.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold">{u.name}</p>
                      <p className="text-[11px] text-ink-soft">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-primary-50 text-primary' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-line bg-bg px-2.5 py-1 text-xs font-bold text-ink cursor-pointer"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SECURITY & PASSWORD UPDATE */}
      {activeTab === 'Security' && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6 max-w-xl">
          <div className="border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-ink">Account Security & Password</h3>
            <p className="text-xs text-ink-soft">Update account password via Supabase Authentication.</p>
          </div>

          <div className="rounded-xl border border-line bg-bg p-4 space-y-2 text-xs">
            <p className="text-ink-soft font-bold">Authenticated User Email:</p>
            <p className="text-sm font-extrabold text-ink">{user?.email || currentUser?.email || 'admin@navexa.io'}</p>
            <p className="text-[11px] font-bold text-primary">Role: {user?.role || 'Admin'}</p>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-ink mb-1">New Password (min 6 characters)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 font-semibold text-ink"
              />
            </div>

            <button
              type="submit"
              disabled={passwordUpdating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {passwordUpdating ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {passwordUpdating ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

    </div>
  )
}
