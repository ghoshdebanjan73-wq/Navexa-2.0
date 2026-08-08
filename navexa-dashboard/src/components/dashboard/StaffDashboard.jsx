import { useState, useEffect } from 'react'
import { Route, CheckCircle2, Car, Wrench, ShieldAlert } from 'lucide-react'
import StatCard from '../ui/StatCard'
import WelcomeSection from './WelcomeSection'
import AttentionAlerts from './AttentionAlerts'
import UpcomingTrips from './UpcomingTrips'
import RecentActivity from './RecentActivity'
import VehicleOverview from './VehicleOverview'
import { subscribeTrips, getTripCounts } from '../../data/tripStore'
import { subscribeVehicles, liveVehicles } from '../../data/vehicleStore'

export default function StaffDashboard({ onNavigate }) {
  const [toastMessage, setToastMessage] = useState(null)
  const [tripCounts, setTripCounts] = useState(getTripCounts())
  const [vehicleStats, setVehicleStats] = useState({ available: 0, maintenance: 0 })

  useEffect(() => {
    // Subscribe to trip updates
    const unsubTrips = subscribeTrips(() => {
      setTripCounts(getTripCounts())
    })

    // Compute vehicle stats
    const updateVehicleStats = () => {
      const stats = liveVehicles.reduce(
        (acc, v) => {
          if (v.status === 'Available') acc.available++
          else if (v.status === 'Maintenance') acc.maintenance++
          return acc
        },
        { available: 0, maintenance: 0 }
      )
      setVehicleStats(stats)
    }

    updateVehicleStats()
    const unsubVehicles = subscribeVehicles(updateVehicleStats)

    return () => {
      unsubTrips()
      unsubVehicles()
    }
  }, [])

  const handleGoToTrips = () => {
    if (onNavigate) onNavigate('Trips')
  }

  return (
    <div className="page-container relative space-y-5 lg:space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 shadow-lg animate-slideDown">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Welcome / Context */}
      <WelcomeSection />

      {/* LEVEL 1 — Attention Items */}
      <AttentionAlerts onNavigate={onNavigate} />

      {/* 2. Staff Stats - Operations Focused */}
      <section className="w-full space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
          Fleet Operations Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div onClick={handleGoToTrips} className="cursor-pointer">
            <StatCard
              icon={Route}
              title="Upcoming Trips"
              value={tripCounts.upcoming}
              infoText="Check Schedule"
              direction="neutral"
              format="plain"
            />
          </div>
          <StatCard
            icon={Car}
            title="Available Vehicles"
            value={vehicleStats.available}
            infoText="Ready for dispatch"
            direction="neutral"
            format="plain"
            highlighted
          />
          <StatCard
            icon={Wrench}
            title="Under Maintenance"
            value={vehicleStats.maintenance}
            infoText="Active repair logs"
            direction="neutral"
            format="plain"
          />
          <StatCard
            icon={ShieldAlert}
            title="Ongoing Trips"
            value={tripCounts.ongoing}
            infoText="Currently on road"
            direction="neutral"
            format="plain"
          />
        </div>
      </section>

      {/* 3. Operational Grid: Upcoming Trips + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full items-start">
        <div className="lg:col-span-2">
          <UpcomingTrips onViewAll={handleGoToTrips} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>

      {/* 4. Fleet Status Overview Snapshot */}
      <div className="w-full">
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-ink">Fleet Status Summary</h3>
            <p className="text-[11px] font-medium text-ink-soft">Real-time status tracking of all registered vehicles.</p>
          </div>
          <VehicleOverview />
        </div>
      </div>
    </div>
  )
}
