import { useRouter } from '../../context/RouterContext'
import Button from './Button'

export default function PlaceholderPage({ title, icon: Icon, desc }) {
  const { navigate } = useRouter()

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="border-b border-line pb-4">
        <h1 className="page-title">{title}</h1>
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
        <Button
          onClick={() => navigate('Dashboard')}
          variant="primary"
          size="md"
          className="mt-5"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}
