import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { syncAllStores, setupRealtimeSubscription } from '../data/syncManager'
import { logAuditEvent } from '../data/auditStore'

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
        const userMeta = sbUser.user_metadata || {}

        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, first_name, last_name, role')
            .eq('id', sbUser.id)
            .maybeSingle()

          let fn = data?.first_name || userMeta.first_name || ''
          let ln = data?.last_name || userMeta.last_name || ''

          if (!fn && (data?.name || userMeta.full_name || userMeta.name)) {
            const rawName = (data?.name || userMeta.full_name || userMeta.name).trim()
            const parts = rawName.split(' ')
            fn = parts[0]
            ln = parts.slice(1).join(' ')
          }

          if (!fn && sbUser.email) {
            const prefix = sbUser.email.split('@')[0]
            fn = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[^a-zA-Z]/g, '')
          }

          if (!fn) fn = 'Admin'

          const fullName = `${fn}${ln ? ` ${ln}` : ''}`.trim()
          const userRole = data?.role || userMeta.role || 'Admin'

          setCurrentUser({
            id: sbUser.id,
            email: sbUser.email,
            name: fullName,
            firstName: fn,
            lastName: ln,
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

          let fn = userMeta.first_name || ''
          let ln = userMeta.last_name || ''

          if (!fn && (userMeta.full_name || userMeta.name)) {
            const rawName = (userMeta.full_name || userMeta.name).trim()
            const parts = rawName.split(' ')
            fn = parts[0]
            ln = parts.slice(1).join(' ')
          }

          if (!fn && sbUser.email) {
            const prefix = sbUser.email.split('@')[0]
            fn = prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[^a-zA-Z]/g, '')
          }

          if (!fn) fn = 'Admin'

          const fullName = `${fn}${ln ? ` ${ln}` : ''}`.trim()

          setCurrentUser({
            id: sbUser.id,
            email: sbUser.email,
            name: fullName,
            firstName: fn,
            lastName: ln,
            role: userMeta.role || 'Admin',
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
        const u = session?.user
        if (u) {
          const userMeta = u.user_metadata || {}
          const name = userMeta.full_name || userMeta.name || userMeta.first_name || u.email?.split('@')[0] || 'User'
          logAuditEvent({
            action: 'LOGIN',
            entityType: 'Session',
            entityId: u.id,
            entityLabel: 'User Session',
            description: `User ${name} (${u.email}) logged into Navexa successfully.`,
            user: { id: u.id, name, email: u.email, role: userMeta.role || 'Admin' }
          })
        }
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Clean URL fragment hash if redirect contained access_token or confirmation parameters
        if (typeof window !== 'undefined' && window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=signup'))) {
          try {
            window.history.replaceState(null, '', window.location.pathname)
          } catch (e) {
            // Ignore history mutation errors if blocked by browser policy
          }
        }
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
      if (currentUser) {
        logAuditEvent({
          action: 'LOGOUT',
          entityType: 'Session',
          entityId: currentUser.id || 'U-LOGOUT',
          entityLabel: 'User Session',
          description: `User ${currentUser.name} (${currentUser.email || 'Admin'}) signed out of Navexa.`,
          user: currentUser,
        })
      }
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setCurrentUser(null)
      return { success: true }
    } catch (err) {
      console.error('Supabase signOut error:', err)
      return { success: false, error: err.message || 'Unable to sign out. Please try again.' }
    }
  }

  const verifyPassword = async (password) => {
    if (!password || !password.trim()) {
      return { success: false, error: 'Password is required.' }
    }

    const cleanPass = password.trim()

    // 1. If user is authenticated via Supabase Auth
    if (currentUser?.email) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: cleanPass,
        })

        if (error || !data.user) {
          return { success: false, error: 'Incorrect password. Verification failed.' }
        }

        return { success: true }
      } catch (err) {
        console.error('Supabase password verification error:', err)
        return { success: false, error: err.message || 'Incorrect password. Verification failed.' }
      }
    }

    // 2. Demo environment fallback
    if (cleanPass === 'admin123' || cleanPass === 'navexa123' || cleanPass === 'password') {
      return { success: true }
    }

    return { success: false, error: 'Incorrect password. Verification failed.' }
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
        verifyPassword,
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
      verifyPassword: (pass) => Promise.resolve({ success: pass === 'admin123' || pass === 'navexa123' }),
      initials: 'B',
      getInitials,
    }
  }
  return context
}
