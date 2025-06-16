// app/login/page.tsx (Example Login Page)
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth'; // Import useAuth hook
// Import your UI components (Input, Button etc.)
import { Input } from '@/components/ui/input'; // Assuming shadcn/ui Input
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();
  const { login, loading, user } = useAuth(); // Destructure login, loading, and user from useAuth

  // Optional: Redirect if user is already logged in
  // This useEffect triggers when `user` or `loading` state changes from useAuth
  React.useEffect(() => {
    if (user && !loading) {
      if (user.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (user.role === 'leader') {
        router.push('/leader-dashboard');
      } else if (user.role === 'employee') {
        router.push('/employee-dashboard');
      }
      // If user has no specific role or role not recognized, redirect to a default dashboard
      // else {
      //   router.push('/dashboard');
      // }
    }
  }, [user, loading, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    // Call the login function provided by the AuthContext
    const { success, error } = await login(email, password);

    if (success) {
      // Login successful, the useEffect above will handle redirection
      console.log('Login successful!');
    } else {
      // Display error message from the login function
      setFormError(error || 'An unexpected error occurred during login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>

          {formError && (
            <p className="text-red-500 text-sm text-center">{formError}</p>
          )}

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
