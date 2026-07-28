import { useState, useEffect } from 'react'
import {
  Building2, User, Phone, Mail, FileText, MapPin, Globe,
  Coins, Clock, Sliders, Settings, Upload, X, Loader2, CheckCircle2
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useRouter } from '../context/RouterContext'
import { supabase } from '../lib/supabase'

export default function CompanyProfilePage() {
  const { currentUser } = useUser()
  const { navigate } = useRouter()

  // Form State
  const [profileId, setProfileId] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // Branding
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState('')
  const [logoFile, setLogoFile] = useState(null)

  // Preferences
  const [currency, setCurrency] = useState('INR')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [dateFormat, setDateFormat] = useState('12h')

  // Invoice Settings
  const [invoicePrefix, setInvoicePrefix] = useState('NVX')
  const [startingInvoiceNumber, setStartingInvoiceNumber] = useState('000001')

  // Loading & UX States
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)

  // Fetch company profile on mount
  useEffect(() => {
    async function loadCompanyProfile() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('company_profile')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setProfileId(data.id)
          setBusinessName(data.business_name || '')
          setOwnerName(data.owner_name || '')
          setPhone(data.phone || '')
          setEmail(data.email || '')
          setGstNumber(data.gst_number || '')
          setAddress(data.address || '')
          setCity(data.city || '')
          setState(data.state || '')
          setCountry(data.country || '')
          setPostalCode(data.postal_code || '')
          setLogoUrl(data.logo_url || '')
          setLogoPreview(data.logo_url || '')
          setCurrency(data.currency || 'INR')
          setTimezone(data.timezone || 'Asia/Kolkata')
          setDateFormat(data.date_format || '12h')
          setInvoicePrefix(data.invoice_prefix || 'NVX')
          setStartingInvoiceNumber(data.starting_invoice_number || '000001')
        }
      } catch (err) {
        console.error('Error fetching company profile:', err)
        showToast('Failed to load company profile from database.', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      loadCompanyProfile()
    }
  }, [currentUser])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle image upload and local preview
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be smaller than 2MB.', 'error')
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setLogoUrl('')
  }

  // Validation
  const validateForm = () => {
    const errs = {}
    if (!businessName.trim()) errs.businessName = 'Business Name is required.'
    if (!ownerName.trim()) errs.ownerName = 'Owner Name is required.'
    if (!phone.trim()) errs.phone = 'Business Phone is required.'
    if (!address.trim()) errs.address = 'Business Address is required.'
    
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Form Submit
  const handleSave = async (e) => {
    e.preventDefault()
    if (saving) return

    if (!validateForm()) {
      showToast('Please fill all required fields correctly.', 'error')
      return
    }

    setSaving(true)
    try {
      // In a real-world scenario with Supabase Storage configured, we would do:
      // if (logoFile) {
      //   const fileExt = logoFile.name.split('.').pop();
      //   const fileName = `${Math.random()}.${fileExt}`;
      //   const { data: uploadData, error: uploadErr } = await supabase.storage
      //     .from('logos')
      //     .upload(fileName, logoFile);
      //   if (uploadErr) throw uploadErr;
      //   logoUrlPath = supabase.storage.from('logos').getPublicUrl(fileName).data.publicUrl;
      // }
      //
      // Because storage is not pre-configured, we'll store the local object URL
      // or a placeholder identifier to display the preview, keeping it clean and easy to connect.
      let finalLogoUrl = logoUrl
      if (logoFile) {
        // Mock Storage URL
        finalLogoUrl = logoPreview
      }

      const profilePayload = {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        gst_number: gstNumber.trim() || null,
        address: address.trim(),
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        postal_code: postalCode.trim() || null,
        logo_url: finalLogoUrl,
        currency,
        timezone,
        date_format: dateFormat,
        invoice_prefix: invoicePrefix.trim(),
        starting_invoice_number: startingInvoiceNumber.trim(),
        updated_at: new Date().toISOString(),
      }

      if (profileId) {
        // Update existing row
        const { error } = await supabase
          .from('company_profile')
          .update(profilePayload)
          .eq('id', profileId)

        if (error) throw error
        showToast('Company profile updated successfully!')
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from('company_profile')
          .insert({
            ...profilePayload,
            created_by: currentUser.id
          })
          .select('id')
          .single()

        if (error) throw error
        if (data) {
          setProfileId(data.id)
        }
        showToast('Company profile created successfully!')
      }
    } catch (err) {
      console.error('Error saving company profile:', err)
      showToast('An error occurred while saving the profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('Dashboard')
  }

  if (loading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={28} />
          <p className="text-xs font-bold text-ink-soft uppercase tracking-wider">Loading business profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed right-6 top-16 z-50 flex items-center gap-2.5 rounded-xl border p-4 shadow-pop animate-slideDown ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type !== 'error' && <CheckCircle2 size={16} />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-line pb-4">
        <h2 className="text-xl font-extrabold text-ink tracking-tight">Company Profile</h2>
        <p className="text-xs text-ink-soft">Manage your business information and branding.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* LEFT: Business Info Card (Spans 2 cols on desktop) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Business Information Card */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Building2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink">Business Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Business Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value)
                      if (errors.businessName) setErrors(prev => ({ ...prev, businessName: null }))
                    }}
                    placeholder="e.g. Navexa Transport Logistics"
                    className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                      errors.businessName ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                    }`}
                  />
                  {errors.businessName && (
                    <p className="text-[10px] font-semibold text-rose-600">{errors.businessName}</p>
                  )}
                </div>

                {/* Owner Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">
                    Owner Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value)
                      if (errors.ownerName) setErrors(prev => ({ ...prev, ownerName: null }))
                    }}
                    placeholder="e.g. Debanjan Ghosh"
                    className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                      errors.ownerName ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                    }`}
                  />
                  {errors.ownerName && (
                    <p className="text-[10px] font-semibold text-rose-600">{errors.ownerName}</p>
                  )}
                </div>

                {/* Business Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">
                    Business Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: null }))
                    }}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                      errors.phone ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-[10px] font-semibold text-rose-600">{errors.phone}</p>
                  )}
                </div>

                {/* Business Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Business Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors(prev => ({ ...prev, email: null }))
                    }}
                    placeholder="e.g. support@navexa.io"
                    className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                      errors.email ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10px] font-semibold text-rose-600">{errors.email}</p>
                  )}
                </div>

                {/* GST Number */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-ink">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 19AAAAA0000A1Z5"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-ink">
                    Business Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      if (errors.address) setErrors(prev => ({ ...prev, address: null }))
                    }}
                    placeholder="e.g. 12 G.T. Road, Chinsurah"
                    className={`w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none transition-all focus:bg-surface ${
                      errors.address ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-line focus:border-primary focus:ring-2 focus:ring-primary/15'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-[10px] font-semibold text-rose-600">{errors.address}</p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Hooghly"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="West Bengal"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Postal Code */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="712101"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            </div>

            {/* Business Preferences Card */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Sliders size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink">Business Preferences</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Currency */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border bg-bg px-3 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                {/* Time Zone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Time Zone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border bg-bg px-3 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC (Greenwich Mean Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Time Preference</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full rounded-xl border bg-bg px-3 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="12h">12-hour (10:30 AM)</option>
                    <option value="24h">24-hour (10:30)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Branding & Invoice Settings Card */}
          <div className="space-y-6">
            
            {/* Branding Card */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <Settings size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink">Branding</h3>
              </div>

              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-ink-soft">Business Logo</p>
                
                {/* Logo Preview and Upload */}
                {logoPreview ? (
                  <div className="relative group flex flex-col items-center justify-center rounded-2xl border border-line bg-bg p-4.5">
                    <img
                      src={logoPreview}
                      alt="Business Logo Preview"
                      className="max-h-32 max-w-full rounded-xl object-contain bg-white p-2 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute right-3.5 top-3.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Remove logo"
                    >
                      <X size={14} />
                    </button>
                    <span className="text-[10px] text-emerald-600 font-bold mt-2">Preview Ready</span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-bg p-8 hover:bg-slate-50 transition-all hover:border-primary/50 cursor-pointer">
                    <Upload className="text-ink-soft mb-2" size={24} />
                    <span className="text-xs font-bold text-ink">Upload Business Logo</span>
                    <span className="text-[10px] text-ink-soft mt-1">PNG, JPG up to 2MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Invoice Settings Card */}
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  <FileText size={16} />
                </div>
                <h3 className="text-sm font-bold text-ink">Invoice Settings</h3>
              </div>

              <div className="space-y-4">
                {/* Invoice Prefix */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="e.g. NVX"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                {/* Starting Invoice Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink">Starting Invoice Number</label>
                  <input
                    type="text"
                    value={startingInvoiceNumber}
                    onChange={(e) => setStartingInvoiceNumber(e.target.value)}
                    placeholder="e.g. 000001"
                    className="w-full rounded-xl border bg-bg px-3.5 py-2.5 text-xs sm:text-sm border-line text-ink outline-none transition-all focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Buttons Action Bar */}
        <div className="flex items-center justify-end gap-3.5 border-t border-line pt-5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-xl border border-line bg-surface px-5 py-2.5 text-xs sm:text-sm font-bold text-ink shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
