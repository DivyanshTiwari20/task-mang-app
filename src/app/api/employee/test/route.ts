// app/api/employee/test/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection and check if employee with id 1 exists
    const { data: employee, error } = await supabase
      .from('users') // Changed from 'employees' to 'users'
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Test error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      })
    }

    return NextResponse.json({
      success: true, 
      employee,
      columns: Object.keys(employee)
    })
    
  } catch (error) {
    console.error('Test catch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}