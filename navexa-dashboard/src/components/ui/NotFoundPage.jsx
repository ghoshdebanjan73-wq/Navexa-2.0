import { MapPin } from 'lucide-react'
import { useRouter } from '../../context/RouterContext'
import Button from './Button'

/**
 * NotFoundPage
 * Displayed when a user navigates to an unknown route.
 * Provides clear messaging and a way back to Dashboard.
 */
export default function NotFoundPage() {
  const { navigate } = useRouter()

  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full text-center space-y-4 rounded-2xl border border-line bg-surface p-8 shadow-xs">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary shadow-xs">
            <MapPin size={28} />
          </div>
        </div>
        <div>
          <p className="text-4xl font-extrabold text-ink num tracking-tight">404</p>
          <h1 className="text-base font-bold text-ink mt-1">Page not found</h1>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            The requested page does not exist or may have been moved.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => navigate('Dashboard', true)}
            variant="primary"
            size="md"
            fullWidth
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
