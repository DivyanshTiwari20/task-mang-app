// lib/auth.tsx
'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from './supabase'

interface CustomUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'leader' | 'employee';
  department_id: number | null;
}

interface AuthContextType {
  user: CustomUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is stored in localStorage on mount
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && typeof parsedUser.id === 'number') {
            setUser(parsedUser);
          } else {
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, error: null };
      } else {
        const errorMessage = data.error || 'Login failed.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Network error occurred.';
      console.error('Login error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
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

/**
 * Server-side function to get user role and department for API routes
 */
export async function getUserRoleAndDepartment(userId: number): Promise<{ role: 'admin' | 'leader' | 'employee'; department_id: number | null }> {
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role, department_id')
    .eq('id', userId)
    .single();

  if (error || !userProfile) {
    throw new Error('User not found or error fetching user data');
  }

  return {
    role: userProfile.role,
    department_id: userProfile.department_id,
  };
}