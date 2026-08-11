import { useState, useEffect, useMemo } from 'react'
import {
  History, Search, Filter, Calendar, Users, Route, Car, UserCheck, FileText,
  DollarSign, Settings, Eye, ChevronLeft, ChevronRight, X, ArrowRight
} from 'lucide-react'
import { getFilteredAuditLogs, subscribeAuditLogs } from '../data/auditStore'
import EmptyState from '../components/ui/EmptyState'
import { useUser } from '../context/UserContext'
import { useRouter } from '../context/RouterContext'

export default function ActivityLogPage() {
  const { user } = useUser()
  const { navigate } = useRouter()

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [dateRange, setDateRange] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAuditItem, setSelectedAuditItem] = useState(null)

  const [logsState, setLogsState] = useState(() =>
    getFilteredAuditLogs({
      search,
      entityType: moduleFilter,
      action: actionFilter,
      dateRange,
      page: currentPage,
      pageSize: 25,
    })
  )

  // Subscribe to live audit log updates
  useEffect(() => {
    const unsubscribe = subscribeAuditLogs(() => {
      setLogsState(
        getFilteredAuditLogs({
          search,
          entityType: moduleFilter,
          action: actionFilter,
          dateRange,
          page: currentPage,
          pageSize: 25,
        })
      )
    })
    return unsubscribe
  }, [search, moduleFilter, actionFilter, dateRange, currentPage])

  // Re-run filter when controls change
  useEffect(() => {
    setLogsState(
      getFilteredAuditLogs({
        search,
        entityType: moduleFilter,
        action: actionFilter,
        dateRange,
        page: currentPage,
        pageSize: 25,
      })
    )
  }, [search, moduleFilter, actionFilter, dateRange, currentPage])

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN': return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold'
      case 'LOGOUT': return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
      case 'CREATE': return 'bg-emerald-50 text-emerald-800 border-emerald-200'
      case 'UPDATE': return 'bg-sky-50 text-sky-800 border-sky-200'
      case 'STATUS_CHANGE': return 'bg-purple-50 text-purple-800 border-purple-200'
      case 'PAYMENT': return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'DELETE': return 'bg-rose-50 text-rose-800 border-rose-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getModuleIcon = (type) => {
    switch (type) {
      case 'Customer': return <Users size={14} className="text-primary" />
      case 'Trip': return <Route size={14} className="text-primary" />
      case 'Driver': return <UserCheck size={14} className="text-primary" />
      case 'Vehicle': return <Car size={14} className="text-primary" />
      case 'Invoice': return <FileText size={14} className="text-primary" />
      case 'Finance': return <DollarSign size={14} className="text-primary" />
      case 'Session':
      case 'Auth':
      case 'User': return <UserCheck size={14} className="text-primary" />
      case 'Settings': return <Settings size={14} className="text-primary" />
      default: return <History size={14} className="text-primary" />
    }
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return ''
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div className="page-container">
      
      {/* Header Bar */}
      <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <History className="text-primary" size={24} /> Activity Log
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">Track important business changes and user sign-in/out events across Navexa.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink-soft">
            Total {logsState.totalCount} Event(s)
          </span>
        </div>
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface border border-line p-4 rounded-2xl shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            placeholder="Search by actor, action, description, record..."
            className="h-9.5 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-xs font-semibold text-ink placeholder:text-ink-soft/80 focus:border-accent focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1) }}
            className="rounded-xl border border-line bg-bg px-3 py-2 font-bold text-ink cursor-pointer"
          >
            <option value="All">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1) }}
            className="rounded-xl border border-line bg-bg px-3 py-2 font-bold text-ink cursor-pointer"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>

        </div>
      </div>

      {/* Module Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line pb-3">
        {[
          'All', 'Session', 'Customers', 'Trips', 'Drivers', 'Vehicles', 'Invoice', 'Finance', 'Settings'
        ].map(mod => (
          <button
            key={mod}
            onClick={() => { setModuleFilter(mod); setCurrentPage(1) }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              moduleFilter === mod
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-slate-50'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* Main Results Section */}
      {logsState.logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity recorded yet"
          description="Important business activity and changes made across Navexa will appear here."
        />
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-bg text-[10px] font-bold uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                {logsState.logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-ink-soft font-semibold num">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold">{log.user_name}</p>
                      <p className="text-[10px] text-ink-soft">{log.user_role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                        {getModuleIcon(log.entity_type)} {log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold line-clamp-1">{log.description}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedAuditItem(log)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Activity Cards View */}
          <div className="md:hidden space-y-3">
            {logsState.logs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedAuditItem(log)}
                className="rounded-2xl border border-line bg-surface p-4 space-y-2 shadow-xs cursor-pointer hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getActionBadgeClass(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-ink-soft font-semibold num">{formatDate(log.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getModuleIcon(log.entity_type)}
                  <span className="text-xs font-extrabold text-ink">{log.entity_type}</span>
                  <span className="text-xs text-ink-soft">• {log.user_name} ({log.user_role})</span>
                </div>
                <p className="text-xs font-semibold text-ink">{log.description}</p>
              </div>
            ))}
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line pt-4 text-xs font-semibold text-ink-soft">
            <span>
              Showing Page {logsState.currentPage} of {logsState.totalPages} ({logsState.totalCount} entries)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-ink hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                disabled={currentPage >= logsState.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, logsState.totalPages))}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-ink hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedAuditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-pop space-y-4 animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <History className="text-primary" size={20} />
                <h3 className="text-base font-extrabold text-ink">Activity Details</h3>
              </div>
              <button onClick={() => setSelectedAuditItem(null)} className="text-ink-soft hover:text-ink cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-line bg-bg p-3">
                <div>
                  <p className="text-ink-soft font-bold">Performed By</p>
                  <p className="font-extrabold text-ink">{selectedAuditItem.user_name}</p>
                </div>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-[10px] font-bold text-primary">
                  {selectedAuditItem.user_role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-bg p-3">
                  <p className="text-ink-soft font-bold">Action Type</p>
                  <span className={`inline-flex mt-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${getActionBadgeClass(selectedAuditItem.action)}`}>
                    {selectedAuditItem.action}
                  </span>
                </div>
                <div className="rounded-xl border border-line bg-bg p-3">
                  <p className="text-ink-soft font-bold">Module</p>
                  <p className="font-extrabold text-ink mt-0.5">{selectedAuditItem.entity_type}</p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3 space-y-1">
                <p className="text-ink-soft font-bold">Affected Record</p>
                <p className="font-extrabold text-primary">{selectedAuditItem.entity_label || selectedAuditItem.entity_id || 'N/A'}</p>
              </div>

              <div className="rounded-xl border border-line bg-bg p-3 space-y-1">
                <p className="text-ink-soft font-bold">Description</p>
                <p className="font-semibold text-ink">{selectedAuditItem.description}</p>
              </div>

              {/* Safe Diffs / Values */}
              {selectedAuditItem.old_values && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-1">
                  <p className="text-rose-800 font-bold">Previous Values</p>
                  <pre className="text-[11px] font-mono text-rose-900 whitespace-pre-wrap">{JSON.stringify(selectedAuditItem.old_values, null, 2)}</pre>
                </div>
              )}

              {selectedAuditItem.new_values && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
                  <p className="text-emerald-800 font-bold">Updated / New Values</p>
                  <pre className="text-[11px] font-mono text-emerald-900 whitespace-pre-wrap">{JSON.stringify(selectedAuditItem.new_values, null, 2)}</pre>
                </div>
              )}

              <div className="text-[11px] text-ink-soft text-right font-semibold num">
                Logged at: {formatDate(selectedAuditItem.created_at)}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedAuditItem(null)}
                className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-ink hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
