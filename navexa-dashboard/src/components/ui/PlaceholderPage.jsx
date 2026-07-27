import { useRouter } from '../../context/RouterContext'

export default function PlaceholderPage({ title, icon: Icon, desc }) {
  const { navigate } = useRouter()

  return (
    <div className="mx-auto max-w-[1440px] w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">{title}</h1>
        <p className="text-xs text-ink-soft mt-0.5">{desc}</p>
      </div>

      {/* Placeholder Content Card */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 sm:p-12 text-center shadow-xs">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-4 shadow-xs">
          <Icon size={28} strokeWidth={2.25} />
        </div>
        <h2 className="text-base font-bold text-ink">{title} Module</h2>
        <p className="mt-1 max-w-sm text-xs text-ink-soft leading-relaxed">
          {desc} This area is part of the Navexa navigation system.
        </p>
        <button
          onClick={() => navigate('Dashboard')}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
