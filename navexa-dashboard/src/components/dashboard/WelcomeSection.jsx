import { useUser } from '../../context/UserContext'

// Helper to compute greeting prefix based on current hour
const getGreetingPrefix = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function WelcomeSection() {
  const { user } = useUser()
  const firstName = user?.firstName || (user?.name ? user.name.trim().split(' ')[0] : 'Admin')
  const greeting = `${getGreetingPrefix()}, ${firstName}`
  const isStaff = user?.role === 'Staff'

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-0.5 transition-all">
      {/* Left: Dynamic Greeting & Supporting Text */}
      <div className="text-left space-y-0.5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
          {greeting}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-ink-soft">
          {isStaff 
            ? "Here's your schedule and operational updates for today."
            : "Here's what's happening with your business today."}
        </p>
      </div>

      {/* Right: Dynamic Date */}
      <div className="text-left sm:text-right shrink-0">
        <p className="text-xs font-semibold text-ink-soft">
          {todayDate}
        </p>
      </div>
    </div>
  )
}
