// app/api/employee/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the incoming data for debugging
    console.log('PUT request body:', body)

    // Handle both 'id' and 'userId' fields (frontend sends userId, DB expects id)
    const employeeId = body.userId || body.id
    
    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee ID is required in request body (as userId or id)' 
      }, { status: 400 })
    }

    // Remove both id and userId from update data to avoid conflicts with DB
    const { id, userId, ...updateData } = body

    // Remove empty string values to avoid database issues
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([key, value]) => value !== '')
    )

    console.log('Cleaned data for update:', cleanedData)
    console.log('Employee ID:', employeeId)

    // If no data to update after cleaning, return error
    if (Object.keys(cleanedData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid data to update' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users') // Changed from 'employees' to 'users'
      .update(cleanedData)
      .eq('id', employeeId)
      .select()
      .single()

    if (error) {
      console.error('Supabase PUT error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full_error: JSON.stringify(error, null, 2)
      })
      
      // Also check if the employee exists first
      const { data: existingEmployee, error: checkError } = await supabase
        .from('users') // Changed from 'employees' to 'users'
        .select('id')
        .eq('id', employeeId)
        .single()
      
      if (checkError) {
        console.error('Employee check error:', checkError)
        return NextResponse.json({ 
          error: 'Employee not found',
          details: `No employee with id ${employeeId}`,
          checkError: checkError.message
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message || 'Unknown database error',
        code: error.code,
        employeeId: employeeId,
        updateData: cleanedData
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: data 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
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

    if (error) {
      console.error('Supabase GET error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: error.message 
      }, { status: 400 })
    }

    return NextResponse.json({ profiles: data })
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}