'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type UserRole = 'VOLUNTEER' | 'ORGANIZER' | 'ADMIN'

export interface DbUser {
  id: string
  email: string
  role: UserRole
  total_points: number
  social_links: Record<string, string>
}

interface AuthContextType {
  user: User | null
  dbUser: DbUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshDbUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function fetchDbUser(token: string): Promise<DbUser | null> {
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = createClient()

  const refreshDbUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) { setDbUser(null); return }
    const db = await fetchDbUser(token)
    setDbUser(db)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (data.session?.access_token) {
        const db = await fetchDbUser(data.session.access_token)
        setDbUser(db)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.access_token) {
        const db = await fetchDbUser(session.access_token)
        setDbUser(db)
      } else {
        setDbUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.user && !data.user.email_confirmed_at) {
      await supabase.auth.signOut()
      return { error: 'Verifică-ți emailul înainte de autentificare. Caută un email de confirmare în inbox.' }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setDbUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signIn, signUp, signOut, refreshDbUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
