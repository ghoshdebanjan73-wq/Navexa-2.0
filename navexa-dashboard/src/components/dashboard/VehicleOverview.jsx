import { useState, useEffect } from 'react'
import { Car, ChevronRight } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { liveVehicles, subscribeVehicles } from '../../data/vehicleStore'
import { useRouter } from '../../context/RouterContext'

export default function VehicleOverview() {
  const [vehicles, setVehicles] = useState([...liveVehicles])
  const { navigate } = useRouter()

  useEffect(() => {
    const unsub = subscribeVehicles(snap => setVehicles([...snap]))
    return unsub
  }, [])

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">Vehicle Overview</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
            {vehicles.length}
          </span>
        </div>
        <button
          onClick={() => navigate('Vehicles')}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          View All <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {vehicles.slice(0, 6).map((v) => (
          <div
            key={v.id}
            onClick={() => navigate('Vehicles')}
            className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-slate-300 cursor-pointer"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <Car size={16} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{v.name}</p>
              <p className="text-xs text-ink-soft num">{v.reg}</p>
            </div>
            <StatusBadge status={v.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
