// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        department:departments(*)
      `)
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}