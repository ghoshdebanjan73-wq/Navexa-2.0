import { useEffect, useState } from 'react'
import { UserProvider, useUser } from './context/UserContext'
import { RouterProvider, useRouter } from './context/RouterContext'
import TopNav from './components/layout/TopNav'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './pages/Dashboard'
import TripsPage from './pages/Trips'
import CustomersPage from './pages/Customers'
import FinancePage from './pages/Finance'
import VehiclesPage from './pages/Vehicles'
import SignInPage from './pages/SignIn'
import SignUpPage from './pages/SignUp'
import PlaceholderPage from './components/ui/PlaceholderPage'
import CompanyProfilePage from './pages/CompanyProfile'
import { Shield, User, Settings, Loader2 } from 'lucide-react'

function AppContent() {
  const { activeRoute, navigate } = useRouter()
  const { currentUser, loading } = useUser()
  const [redirectToAfterLogin, setRedirectToAfterLogin] = useState(null)

  useEffect(() => {
    if (loading) return // Wait until session checking is finished

    if (!currentUser) {
      if (activeRoute !== 'SignIn' && activeRoute !== 'SignUp') {
        setRedirectToAfterLogin(activeRoute)
        navigate('SignIn')
      }
    } else {
      // Role protection - Redirect Staff users trying to visit Admin pages
      const isStaff = currentUser?.role === 'Staff'
      if (isStaff && ['Finance', 'Customers', 'Users', 'Settings', 'CompanyProfile'].includes(activeRoute)) {
        navigate('Dashboard')
      } else if (activeRoute === 'SignIn' || activeRoute === 'SignUp') {
        if (redirectToAfterLogin) {
          navigate(redirectToAfterLogin)
          setRedirectToAfterLogin(null)
        } else {
          navigate('Dashboard')
        }
      }
    }
  }, [currentUser, loading, activeRoute, navigate, redirectToAfterLogin])

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg text-ink">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">Checking session...</p>
        </div>
      </div>
    )
  }

  if (activeRoute === 'SignIn') {
    return <SignInPage />
  }

  if (activeRoute === 'SignUp') {
    return <SignUpPage />
  }

  const renderContent = () => {
    switch (activeRoute) {
      case 'Trips':
        return <TripsPage />
      case 'Customers':
        return <CustomersPage />
      case 'Finance':
        return <FinancePage />
      case 'Vehicles':
        return <VehiclesPage />
      case 'Users':
        return <PlaceholderPage title="Users" icon={Shield} desc="Manage dispatcher accounts, driver profiles, and system access." />
      case 'Profile':
        return <PlaceholderPage title="Profile" icon={User} desc="Manage user profile details and personal preferences." />
      case 'Settings':
        return <PlaceholderPage title="Settings" icon={Settings} desc="Configure application settings, notifications, and preferences." />
      case 'CompanyProfile':
        return <CompanyProfilePage />
      case 'Dashboard':
      default:
        return <Dashboard onNavigate={navigate} />
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink">
      {/* 🖥️ Desktop & Tablet Left Sidebar */}
      <Sidebar activeRoute={activeRoute} onNavigate={navigate} />

      {/* Main Content Viewport Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav pageTitle={activeRoute} />
        <main className="flex-1 w-full">
          {renderContent()}
        </main>
      </div>

      {/* 📱 Mobile Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <UserProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </UserProvider>
  )
}
