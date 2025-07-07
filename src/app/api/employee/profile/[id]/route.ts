// / 1. app/api/employee/profile/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params 
    const userId = parseInt(id)
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }
    
    // Fetch user profile data with *
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Supabase error:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get department name separately
    let departmentName = 'Unknown Department'
    if (user.department_id) {
      const { data: department } = await supabase
        .from('departments')
        .select('name')
        .eq('id', user.department_id)
        .single()
      
      if (department) {
        departmentName = department.name
      }
    }

    // Add department name to user data
    const userWithDepartment = {
      ...user,
      department_name: departmentName
    }

    return NextResponse.json(userWithDepartment)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}