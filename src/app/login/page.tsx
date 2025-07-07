// src/app/login/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { login, loading: authLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'admin') {
        router.push('/admin-dashboard')
      } else if (user.role === 'leader') {
        router.push('/leader-dashboard')
      } else if (user.role === 'employee') {
        router.push('/employee-dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    if (!username || !password) {
      setFormError('Please enter both username and password.')
      setFormLoading(false)
      return
    }

    const { success, error: loginError } = await login(username, password)

    if (success) {
      // Redirection handled by useEffect
    } else {
      setFormError(loginError || 'Invalid username or password.')
    }

    setFormLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg border border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-primary rounded-sm"></div>
            <CardTitle className="text-2xl font-bold text-foreground">Askus</CardTitle>
          </div>
          <p className="text-muted-foreground">Login to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {formError && (
              <p className="text-destructive text-sm text-center">{formError}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={formLoading || authLoading}
            >
              {formLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
