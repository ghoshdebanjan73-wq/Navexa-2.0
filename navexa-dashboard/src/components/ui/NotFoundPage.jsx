import { MapPin } from 'lucide-react'
import { useRouter } from '../../context/RouterContext'

/**
 * NotFoundPage
 * Displayed when a user navigates to an unknown URL.
 * Provides clear messaging and a way back to Dashboard.
 */
export default function NotFoundPage() {
  const { navigate } = useRouter()

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
            <MapPin size={32} className="text-primary" />
          </div>
        </div>
        <div>
          <p className="text-5xl font-black text-ink mb-1">404</p>
          <h1 className="text-lg font-bold text-ink mb-1">Page not found</h1>
          <p className="text-sm text-ink-soft">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => navigate('Dashboard', true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-700 transition-colors cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
