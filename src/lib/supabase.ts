// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Support both variable names (ANON_KEY or PUBLISHABLE_DEFAULT_KEY)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  department?: Department
}

export interface Department {
  id: number
  name: string
}

export interface Attendance {
  id: number
  user_id: number
  check_in: string | null
  check_out: string | null
  date: string
  user?: User
}