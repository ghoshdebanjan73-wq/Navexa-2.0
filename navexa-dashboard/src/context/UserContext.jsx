import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { syncAllStores, setupRealtimeSubscription } from '../data/syncManager'

// Centralized mock user records for Navexa
export const MOCK_USERS = {
  Banjo: {
    id: 'U-01',
    name: 'Banjo',
    email: 'banjo@navexa.io',
    role: 'Admin',
    avatar: null,
  },
  Ranjan: {
    id: 'U-02',
    name: 'Ranjan',
    email: 'ranjan@navexa.io',
    role: 'Admin',
    avatar: null,
  },
}

// Utility function to compute avatar initials safely
export const getInitials = (name = 'Banjo') => {
  if (!name || typeof name !== 'string') return 'B'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'B'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let realtimeChannel = null

    const handleUserSession = async (session) => {
      setLoading(true)
      if (session) {
        const sbUser = session.user
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', sbUser.id)
            .maybeSingle()

          const userRole = data?.role || sbUser.user_metadata?.role || 'Staff'
          const userName = data?.name || sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email.split('@')[0]

          setCurrentUser({
            id: sbUser.id,
            email: sbUser.email,
            name: userName,
            role: userRole,
            avatar: null,
          })
          syncAllStores(sbUser.id)

          // Sub to Postgres Realtime changes
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
          }
          realtimeChannel = setupRealtimeSubscription(sbUser.id)
        } catch (err) {
          console.error('Error fetching user profile from public.users:', err)
          setCurrentUser({
            id: sbUser.id,
            email: sbUser.email,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email.split('@')[0],
            role: sbUser.user_metadata?.role || 'Staff',
            avatar: null,
          })
          syncAllStores(sbUser.id)

          // Sub to Postgres Realtime changes
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
          }
          realtimeChannel = setupRealtimeSubscription(sbUser.id)
        } finally {
          setLoading(false)
        }
      } else {
        setCurrentUser(null)
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel)
          realtimeChannel = null
        }
        setLoading(false)
      }
    }

    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session)
    }).catch(err => {
      console.error('Error fetching session:', err)
      setLoading(false)
    })

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Clear all local caches on fresh sign-in to avoid stale cross-session data
        localStorage.removeItem('navexa_trips')
        localStorage.removeItem('navexa_customers')
        localStorage.removeItem('navexa_vehicles')
        localStorage.removeItem('navexa_payments')
        localStorage.removeItem('navexa_maintenance')
        localStorage.removeItem('navexa_invoices')
        localStorage.removeItem('navexa_finance_transactions')
        localStorage.removeItem('navexa_audit_logs')
      }
      handleUserSession(session)
    })

    return () => {
      subscription.unsubscribe()
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [])

  const setUserByName = (nameKey) => {
    if (MOCK_USERS[nameKey]) {
      setCurrentUser(MOCK_USERS[nameKey])
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setCurrentUser(null)
      return { success: true }
    } catch (err) {
      console.error('Supabase signOut error:', err)
      return { success: false, error: err.message || 'Unable to sign out. Please try again.' }
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        currentUser,
        setCurrentUser,
        setUserByName,
        loading,
        signOut,
        initials: getInitials(currentUser?.name),
        getInitials,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    // Fallback if component is used outside Provider
    return {
      user: MOCK_USERS.Banjo,
      currentUser: MOCK_USERS.Banjo,
      setCurrentUser: () => {},
      setUserByName: () => {},
      loading: false,
      signOut: () => Promise.resolve({ success: true }),
      initials: 'B',
      getInitials,
    }
  }
  return context
}
