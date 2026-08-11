/**
 * auditStore.js
 * Central Append-Only Audit Log Manager for Navexa.
 * Logs WHO did WHAT, WHEN, and WHICH record was affected across all business modules.
 * Persists records in Supabase `public.audit_logs` and localStorage.
 */

import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'navexa_audit_logs'

function loadLogsFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (err) {
    console.error('Error loading audit logs from storage:', err)
  }
  return []
}

function persistLogs() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveAuditLogs))
  } catch (err) {
    console.error('Error persisting audit logs:', err)
  }
}

export const liveAuditLogs = loadLogsFromStorage()

const listeners = new Set()

export function subscribeAuditLogs(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notifyAuditListeners() {
  listeners.forEach(fn => fn(liveAuditLogs))
}

/** Cloud sync audit logs from Supabase */
export async function syncAuditLogs(userId) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      const mapped = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        user_name: item.user_name || 'System User',
        user_role: item.user_role || 'Admin',
        action: item.action,
        entity_type: item.entity_type,
        entity_id: item.entity_id || '',
        entity_label: item.entity_label || item.entity_type,
        description: item.description,
        old_values: item.old_values,
        new_values: item.new_values,
        metadata: item.metadata,
        created_at: item.created_at,
      }))

      liveAuditLogs.length = 0
      liveAuditLogs.push(...mapped)
      persistLogs()
      notifyAuditListeners()
    }
  } catch (err) {
    console.error('Error syncing audit logs from Supabase:', err)
  }
}

/**
 * Log an audit event
 */
export async function logAuditEvent({
  action, // 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'PAYMENT' | 'LOGIN'
  entityType, // 'Customer' | 'Trip' | 'Driver' | 'Vehicle' | 'Invoice' | 'Finance' | 'Settings' | 'User'
  entityId = '',
  entityLabel = '',
  description,
  oldValues = null,
  newValues = null,
  metadata = null,
  user = null,
}) {
  const userName = user?.name || user?.user_metadata?.full_name || 'Debanjan Ghosh'
  const userRole = user?.role || 'Admin'
  const userId = user?.id || null

  const newLog = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action,
    entity_type: entityType,
    entity_id: String(entityId || ''),
    entity_label: String(entityLabel || entityId || entityType),
    description,
    old_values: oldValues,
    new_values: newValues,
    metadata,
    created_at: new Date().toISOString(),
  }

  // Prepend locally
  liveAuditLogs.unshift(newLog)
  persistLogs()
  notifyAuditListeners()

  // Sync to Supabase
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        id: newLog.id,
        user_id: newLog.user_id,
        user_name: newLog.user_name,
        user_role: newLog.user_role,
        action: newLog.action,
        entity_type: newLog.entity_type,
        entity_id: newLog.entity_id,
        entity_label: newLog.entity_label,
        description: newLog.description,
        old_values: newLog.old_values,
        new_values: newLog.new_values,
        metadata: newLog.metadata,
        created_at: newLog.created_at,
      })

    if (error) {
      console.warn('Supabase audit_logs sync notice (using local store):', error.message)
    }
  } catch (err) {
    console.error('Error syncing audit log to Supabase:', err)
  }

  return newLog
}

/** Alias export for backward compatibility */
export const addAuditLog = logAuditEvent

/**
 * Fetch and filter audit logs
 */
export function getFilteredAuditLogs({
  search = '',
  entityType = 'All',
  action = 'All',
  dateRange = 'All',
  page = 1,
  pageSize = 25,
}) {
  let result = [...liveAuditLogs]

  // Module filter
  if (entityType && entityType !== 'All') {
    result = result.filter(log => log.entity_type === entityType)
  }

  // Action filter
  if (action && action !== 'All') {
    result = result.filter(log => log.action === action)
  }

  // Date Range filter
  if (dateRange && dateRange !== 'All') {
    const now = new Date()
    if (dateRange === 'Today') {
      const todayStr = now.toISOString().split('T')[0]
      result = result.filter(log => (log.created_at || '').startsWith(todayStr))
    } else if (dateRange === 'Last 7 Days') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(log => new Date(log.created_at) >= past7)
    } else if (dateRange === 'Last 30 Days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter(log => new Date(log.created_at) >= past30)
    }
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter(log => {
      const haystack = `${log.user_name} ${log.action} ${log.entity_type} ${log.entity_label} ${log.description}`.toLowerCase()
      return haystack.includes(q)
    })
  }

  const totalCount = result.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const paginatedLogs = result.slice(startIndex, startIndex + pageSize)

  return {
    logs: paginatedLogs,
    totalCount,
    totalPages,
    currentPage: page,
  }
}
