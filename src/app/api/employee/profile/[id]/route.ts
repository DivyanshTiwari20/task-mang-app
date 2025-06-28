// app/api/employee/profile/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params before accessing its properties
    const { id } = await params

    const { data, error } = await supabase
      .from('users') // Changed from 'employees' to 'users'
      .select(`
        id,
        fullname,
        email,
        phone,
        address,
        profile_image,
        gender,
        employee_id,
        department,
        position,
        manager,
        join_date,
        salary
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}