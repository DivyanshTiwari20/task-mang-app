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
  const [formLoading, setFormLoading] = useState(false) // Use a separate loading state for the form submission
  const [formError, setFormError] = useState('') // Use a separate error state for form submission messages
  const { login, loading: authLoading, user } = useAuth() // Destructure login, authLoading, and user from useAuth
  const router = useRouter()

  // This useEffect handles redirection based on user's role after login or on initial load
  useEffect(() => {
    // Only redirect if user data is loaded and not currently in an authentication loading state
    if (user && !authLoading) {
      if (user.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (user.role === 'leader') {
        router.push('/leader-dashboard');
      } else if (user.role === 'employee') {
        router.push('/employee-dashboard');
      } else {
        // Fallback for roles not explicitly handled, e.g., redirect to a general dashboard
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]); // Dependencies for useEffect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); // Start form loading
    setFormError(''); // Clear previous form errors

    if (!username || !password) {
      setFormError('Please enter both username and password.');
      setFormLoading(false);
      return;
    }

    // Call the login function from AuthContext
    const { success, error: loginError } = await login(username, password);

    if (success) {
      console.log('Login successful!');
      // Redirection will be handled by the useEffect above
    } else {
      setFormError(loginError || 'Invalid username or password.'); // Display error from login function or a generic one
    }

    setFormLoading(false); // End form loading
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-black rounded-sm"></div>
            <CardTitle className="text-2xl font-bold">Askus</CardTitle>
          </div>
          <p className="text-gray-600">Sign in to your account</p>
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
            {formError && ( // Display form-specific error
              <p className="text-red-500 text-sm text-center">{formError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={formLoading || authLoading} // Disable if form is submitting or auth is loading
            >
              {formLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
