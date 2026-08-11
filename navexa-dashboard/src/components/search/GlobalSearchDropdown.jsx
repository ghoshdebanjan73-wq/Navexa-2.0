import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, X, Users, Route, Car, UserCheck, FileText, ArrowRight, Clock, Loader2, Command
} from 'lucide-react'
import { performGlobalSearch as doSearch, getRecentSearches, addRecentSearch, clearRecentSearches } from '../../data/searchStore'
import { useRouter } from '../../context/RouterContext'
import { useUser } from '../../context/UserContext'
import { liveCustomers } from '../../data/customerStore'
import { liveTrips } from '../../data/tripStore'
import CustomerDetailPanel from '../customers/CustomerDetailPanel'
import TripDetailPanel from '../trips/TripDetailPanel'

export default function GlobalSearchDropdown({ isMobileOpen = false, onCloseMobile }) {
  const { navigate } = useRouter()
  const { user } = useUser()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentList, setRecentList] = useState([])

  // Modal triggers
  const [selectedCustomerForPanel, setSelectedCustomerForPanel] = useState(null)
  const [selectedTripForModal, setSelectedTripForModal] = useState(null)

  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // 1. Keyboard Shortcut Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        if (inputRef.current) inputRef.current.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // 2. Debounce Search Query (300ms)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setDebouncedQuery('')
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // 3. Load Recent Searches when input opens
  useEffect(() => {
    if (isOpen) {
      setRecentList(getRecentSearches())
    }
  }, [isOpen])

  // 4. Perform Search
  const results = useMemo(() => {
    return doSearch({ query: debouncedQuery, role: user?.role, limitPerCategory: 5 })
  }, [debouncedQuery, user?.role])

  // Flat list of all result items for keyboard arrow navigation
  const flatResults = useMemo(() => {
    const list = []
    if (results.customers) results.customers.forEach(item => list.push({ category: 'Customer', ...item }))
    if (results.trips) results.trips.forEach(item => list.push({ category: 'Trip', ...item }))
    if (results.vehicles) results.vehicles.forEach(item => list.push({ category: 'Vehicle', ...item }))
    if (results.drivers) results.drivers.forEach(item => list.push({ category: 'Driver', ...item }))
    if (results.invoices) results.invoices.forEach(item => list.push({ category: 'Invoice', ...item }))
    return list
  }, [results])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [debouncedQuery])

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (item) => {
    addRecentSearch(query)
    setIsOpen(false)
    if (onCloseMobile) onCloseMobile()

    if (item.category === 'Customer') {
      const match = liveCustomers.find(c => c.name.toLowerCase() === item.name.toLowerCase())
      if (match) setSelectedCustomerForPanel(match)
      else navigate('Customers')
    } else if (item.category === 'Trip') {
      const match = liveTrips.find(t => t.id === item.id)
      if (match) setSelectedTripForModal(match)
      else navigate('Trips')
    } else if (item.category === 'Vehicle') {
      navigate('Vehicles')
    } else if (item.category === 'Driver') {
      navigate('Drivers')
    } else if (item.category === 'Invoice') {
      navigate('Invoices')
    }
  }

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      if (onCloseMobile) onCloseMobile()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        e.preventDefault()
        handleSelectResult(flatResults[selectedIndex])
      } else if (query.trim().length >= 2) {
        e.preventDefault()
        addRecentSearch(query)
        setIsOpen(false)
        if (onCloseMobile) onCloseMobile()
        if (typeof window !== 'undefined') {
          window.history.pushState({ route: 'Search' }, '', `/search?q=${encodeURIComponent(query.trim())}`)
        }
        navigate('Search')
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Container */}
      <div className="relative w-full">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          aria-label="Global search"
          placeholder="Search trips, customers, vehicles..."
          className="h-9 w-full rounded-lg border border-line bg-bg pl-9 pr-14 text-xs font-medium text-ink placeholder:text-ink-soft/80 transition-all focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/15"
        />

        {/* Loading Spinner or Cmd+K Badge */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : query ? (
            <button
              onClick={() => { setQuery(''); setDebouncedQuery('') }}
              className="text-ink-soft hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none hidden md:inline-flex items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft shadow-2xs">
              <Command size={10} />K
            </kbd>
          )}
        </div>
      </div>

      {/* Global Search Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-line bg-surface p-2.5 shadow-pop animate-scaleUp max-h-[80vh] overflow-y-auto space-y-3 text-xs">
          
          {/* 1. Empty Query State (Show Recent Searches) */}
          {debouncedQuery.length < 2 && (
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                <span>Recent Searches</span>
                {recentList.length > 0 && (
                  <button
                    onClick={() => { clearRecentSearches(); setRecentList([]) }}
                    className="hover:underline text-[10px] text-ink-soft cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {recentList.length === 0 ? (
                <p className="text-xs text-ink-soft italic py-2">Type at least 2 characters to search across customers, trips, vehicles, and invoices.</p>
              ) : (
                <div className="space-y-1">
                  {recentList.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(term); setDebouncedQuery(term) }}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-left font-semibold text-ink hover:bg-slate-50 cursor-pointer"
                    >
                      <Clock size={13} className="text-ink-soft" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Searching Loader */}
          {isSearching && debouncedQuery.length >= 2 && (
            <div className="flex items-center justify-center py-6 text-ink-soft gap-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>Searching business records...</span>
            </div>
          )}

          {/* 3. Search Results Panel */}
          {!isSearching && debouncedQuery.length >= 2 && results.totalCount === 0 && (
            <div className="py-8 text-center text-xs text-ink-soft space-y-1">
              <p className="font-bold text-ink">No matching records found</p>
              <p className="text-[11px]">No customers, trips, vehicles or invoices matched "{debouncedQuery}".</p>
            </div>
          )}

          {!isSearching && debouncedQuery.length >= 2 && results.totalCount > 0 && (
            <div className="space-y-3">
              
              {/* CUSTOMERS CATEGORY */}
              {results.customers.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase text-ink-soft">
                    <Users size={12} className="text-primary" /> Customers ({results.totalCustomersCount})
                  </div>
                  {results.customers.map((c, i) => {
                    const globalIdx = flatResults.findIndex(item => item.category === 'Customer' && item.id === c.id)
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectResult({ category: 'Customer', ...c })}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 text-primary font-bold' : 'hover:bg-slate-50 text-ink'}`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{c.name}</p>
                          <p className="text-[11px] text-ink-soft num">{c.phone} {c.companyName ? `• ${c.companyName}` : ''}</p>
                        </div>
                        <ArrowRight size={13} className="text-ink-soft shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* TRIPS CATEGORY */}
              {results.trips.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase text-ink-soft">
                    <Route size={12} className="text-primary" /> Trips ({results.totalTripsCount})
                  </div>
                  {results.trips.map((t) => {
                    const globalIdx = flatResults.findIndex(item => item.category === 'Trip' && item.id === t.id)
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectResult({ category: 'Trip', ...t })}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 text-primary font-bold' : 'hover:bg-slate-50 text-ink'}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-primary num">{t.id}</span>
                            <span className="font-bold truncate">{t.customer}</span>
                          </div>
                          <p className="text-[11px] text-ink-soft truncate">{t.pickupLocation} ➔ {t.destination}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink shrink-0">
                          {t.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* VEHICLES CATEGORY */}
              {results.vehicles.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase text-ink-soft">
                    <Car size={12} className="text-primary" /> Vehicles ({results.totalVehiclesCount})
                  </div>
                  {results.vehicles.map((v) => {
                    const globalIdx = flatResults.findIndex(item => item.category === 'Vehicle' && item.id === v.id)
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleSelectResult({ category: 'Vehicle', ...v })}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 text-primary font-bold' : 'hover:bg-slate-50 text-ink'}`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{v.name}</p>
                          <p className="text-[11px] text-ink-soft num font-semibold">{v.registration} {v.brand ? `• ${v.brand}` : ''}</p>
                        </div>
                        <ArrowRight size={13} className="text-ink-soft shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* DRIVERS CATEGORY */}
              {results.drivers.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase text-ink-soft">
                    <UserCheck size={12} className="text-primary" /> Drivers ({results.totalDriversCount})
                  </div>
                  {results.drivers.map((d) => {
                    const globalIdx = flatResults.findIndex(item => item.category === 'Driver' && item.id === d.id)
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <div
                        key={d.id}
                        onClick={() => handleSelectResult({ category: 'Driver', ...d })}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 text-primary font-bold' : 'hover:bg-slate-50 text-ink'}`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{d.fullName}</p>
                          <p className="text-[11px] text-ink-soft num">{d.phone} {d.licenseNumber ? `• License: ${d.licenseNumber}` : ''}</p>
                        </div>
                        <ArrowRight size={13} className="text-ink-soft shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* INVOICES CATEGORY */}
              {results.invoices.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-[10px] font-extrabold uppercase text-ink-soft">
                    <FileText size={12} className="text-primary" /> Invoices ({results.totalInvoicesCount})
                  </div>
                  {results.invoices.map((inv) => {
                    const globalIdx = flatResults.findIndex(item => item.category === 'Invoice' && item.id === inv.id)
                    const isSelected = selectedIndex === globalIdx
                    return (
                      <div
                        key={inv.id}
                        onClick={() => handleSelectResult({ category: 'Invoice', ...inv })}
                        className={`flex items-center justify-between rounded-lg p-2 transition-colors cursor-pointer ${isSelected ? 'bg-primary-50 text-primary font-bold' : 'hover:bg-slate-50 text-ink'}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-primary num">{inv.invoiceNumber}</span>
                            <span className="font-bold truncate">{inv.customerName}</span>
                          </div>
                          <p className="text-[11px] text-ink-soft num font-bold">Due: ₹{inv.balanceDue}</p>
                        </div>
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                          {inv.paymentStatus}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* VIEW ALL FULL RESULTS BUTTON */}
              <div className="border-t border-line pt-2 text-center">
                <button
                  onClick={() => {
                    addRecentSearch(query)
                    setIsOpen(false)
                    if (onCloseMobile) onCloseMobile()
                    if (typeof window !== 'undefined') {
                      window.history.pushState({ route: 'Search' }, '', `/search?q=${encodeURIComponent(query.trim())}`)
                    }
                    navigate('Search')
                  }}
                  className="text-[11px] font-extrabold text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  View all {results.totalCount} results for "{debouncedQuery}" <ArrowRight size={13} />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Customer 360 Drawer */}
      {selectedCustomerForPanel && (
        <CustomerDetailPanel
          customer={selectedCustomerForPanel}
          isOpen={!!selectedCustomerForPanel}
          onClose={() => setSelectedCustomerForPanel(null)}
        />
      )}

      {/* Trip Details Modal */}
      {selectedTripForModal && (
        <TripDetailPanel
          trip={selectedTripForModal}
          isOpen={!!selectedTripForModal}
          onClose={() => setSelectedTripForModal(null)}
        />
      )}

    </div>
  )
}
