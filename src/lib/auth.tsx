// src/lib/auth.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from './supabase'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}