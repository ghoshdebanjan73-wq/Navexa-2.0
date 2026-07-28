/**
 * settingsStore.js
 * Central Data Manager for Navexa Settings & Admin Controls.
 * Bi-directionally syncs with Supabase `company_profile` table.
 * Validates invoice numbers against collision & manages user permissions and password updates.
 */

import { supabase } from '../lib/supabase'
import { liveInvoices } from './invoiceStore'

const STORAGE_KEY = 'navexa_system_settings'

export const DEFAULT_SETTINGS = {
  // General Preferences
  language: 'English',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',

  // Business Details (Syncs with company_profile)
  businessName: 'Navexa Transport & Logistics',
  ownerName: 'Debanjan Ghosh',
  phone: '+91 98765 43210',
  email: 'contact@navexa.io',
  address: 'Grand Trunk Road',
  city: 'Hooghly',
  state: 'West Bengal',
  country: 'India',
  postalCode: '712101',
  gstNumber: '19ABCDE1234F1Z5',
  logoUrl: '',

  // Invoice Preferences
  invoicePrefix: 'NVX',
  startingInvoiceNumber: '000001',
  defaultDuePeriodDays: '15',
  defaultNotes: 'Thank you for choosing Navexa. Payment due within 15 days.',
  defaultTaxRate: '5',

  // Notification Preferences
  notifyUpcomingTrips: true,
  notifyVehicleInsurance: true,
  notifyVehiclePermit: true,
  notifyVehicleFitness: true,
  notifyVehiclePollution: true,
  notifyVehicleService: true,
  notifyDriverLicense: true,
  notifyOutstandingPayments: true,
  expiryLeadTimeDays: '7',
}

/**
 * Fetch settings from Supabase company_profile or fallback to local cache
 */
export async function loadSystemSettings() {
  try {
    const { data, error } = await supabase
      .from('company_profile')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (data) {
      const settings = {
        id: data.id,
        businessName: data.company_name || data.business_name || DEFAULT_SETTINGS.businessName,
        ownerName: data.owner_name || DEFAULT_SETTINGS.ownerName,
        phone: data.phone || DEFAULT_SETTINGS.phone,
        email: data.email || DEFAULT_SETTINGS.email,
        address: data.address || DEFAULT_SETTINGS.address,
        city: data.city || DEFAULT_SETTINGS.city,
        state: data.state || DEFAULT_SETTINGS.state,
        country: data.country || DEFAULT_SETTINGS.country,
        postalCode: data.postal_code || DEFAULT_SETTINGS.postalCode,
        gstNumber: data.gst_number || DEFAULT_SETTINGS.gstNumber,
        logoUrl: data.logo_url || DEFAULT_SETTINGS.logoUrl,
        currency: data.currency || DEFAULT_SETTINGS.currency,
        timezone: data.timezone || DEFAULT_SETTINGS.timezone,
        dateFormat: data.date_format || DEFAULT_SETTINGS.dateFormat,
        timeFormat: data.time_format || DEFAULT_SETTINGS.timeFormat,
        invoicePrefix: data.invoice_prefix || DEFAULT_SETTINGS.invoicePrefix,
        startingInvoiceNumber: data.starting_invoice_number || DEFAULT_SETTINGS.startingInvoiceNumber,
        defaultDuePeriodDays: data.default_due_period || DEFAULT_SETTINGS.defaultDuePeriodDays,
        defaultNotes: data.default_notes || DEFAULT_SETTINGS.defaultNotes,
        defaultTaxRate: data.default_tax_rate || DEFAULT_SETTINGS.defaultTaxRate,
        notifyUpcomingTrips: data.notify_upcoming_trips ?? true,
        notifyVehicleInsurance: data.notify_vehicle_insurance ?? true,
        notifyVehiclePermit: data.notify_vehicle_permit ?? true,
        notifyVehicleFitness: data.notify_vehicle_fitness ?? true,
        notifyVehiclePollution: data.notify_vehicle_pollution ?? true,
        notifyVehicleService: data.notify_vehicle_service ?? true,
        notifyDriverLicense: data.notify_driver_license ?? true,
        notifyOutstandingPayments: data.notify_outstanding_payments ?? true,
        expiryLeadTimeDays: data.expiry_lead_time || DEFAULT_SETTINGS.expiryLeadTimeDays,
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      }
      return settings
    }
  } catch (err) {
    console.error('Error fetching settings from Supabase:', err)
  }

  // Local Storage fallback
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      } catch {
        return DEFAULT_SETTINGS
      }
    }
  }

  return DEFAULT_SETTINGS
}

/**
 * Save settings to Supabase company_profile table
 */
export async function saveSystemSettings(settings) {
  const payload = {
    company_name: settings.businessName,
    business_name: settings.businessName,
    owner_name: settings.ownerName,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    city: settings.city,
    state: settings.state,
    country: settings.country,
    postal_code: settings.postalCode,
    gst_number: settings.gstNumber,
    logo_url: settings.logoUrl,
    currency: settings.currency,
    timezone: settings.timezone,
    date_format: settings.dateFormat,
    time_format: settings.timeFormat,
    invoice_prefix: settings.invoicePrefix,
    starting_invoice_number: settings.startingInvoiceNumber,
    default_due_period: settings.defaultDuePeriodDays,
    default_notes: settings.defaultNotes,
    default_tax_rate: settings.defaultTaxRate,
    notify_upcoming_trips: settings.notifyUpcomingTrips,
    notify_vehicle_insurance: settings.notifyVehicleInsurance,
    notify_vehicle_permit: settings.notifyVehiclePermit,
    notify_vehicle_fitness: settings.notifyVehicleFitness,
    notify_vehicle_pollution: settings.notifyVehiclePollution,
    notify_vehicle_service: settings.notifyVehicleService,
    notify_driver_license: settings.notifyDriverLicense,
    notify_outstanding_payments: settings.notifyOutstandingPayments,
    expiry_lead_time: settings.expiryLeadTimeDays,
    updated_at: new Date().toISOString(),
  }

  if (settings.id) {
    const { error } = await supabase
      .from('company_profile')
      .update(payload)
      .eq('id', settings.id)

    if (error) throw error
  } else {
    const { data, error } = await supabase
      .from('company_profile')
      .insert({ id: `CP-${Date.now()}`, ...payload })
      .select('id')
      .single()

    if (error) throw error
    if (data) settings.id = data.id
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  return settings
}

/**
 * Validate next invoice number against existing invoices to prevent collisions
 */
export function validateNextInvoiceNumber(prefix, startingNumStr) {
  const cleanPrefix = (prefix || 'NVX').replace(/[-_\s]+$/, '')
  const formattedTarget = `${cleanPrefix}-${startingNumStr.padStart(6, '0')}`

  const exists = liveInvoices.some(inv => inv.invoiceNumber === formattedTarget)

  if (exists) {
    return {
      valid: false,
      error: `Invoice number "${formattedTarget}" already exists! Please choose a higher starting number.`,
    }
  }

  return { valid: true, formattedNumber: formattedTarget }
}

/**
 * Load user accounts for Users & Permissions tab
 */
export async function loadUserAccounts() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')

    if (!error && data && data.length > 0) {
      return data.map(u => ({
        id: u.id,
        name: u.full_name || u.name || 'User',
        email: u.email,
        role: u.role || 'Staff',
        status: u.status || 'Active',
      }))
    }
  } catch (err) {
    console.error('Error fetching users from Supabase:', err)
  }

  // Default fallback user accounts
  return [
    { id: 'usr-1', name: 'Debanjan Ghosh', email: 'debanjan@navexa.io', role: 'Admin', status: 'Active' },
    { id: 'usr-2', name: 'Operations Staff', email: 'staff@navexa.io', role: 'Staff', status: 'Active' },
  ]
}

/**
 * Change Account Password via Supabase Auth
 */
export async function updateAccountPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' }
  }

  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error updating password via Supabase Auth:', err)
    return { success: false, error: err.message || 'Unable to update password.' }
  }
}
