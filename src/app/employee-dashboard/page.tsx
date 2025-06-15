// src/app/employee-dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AttendanceCard } from '@/components/AttendanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [monthlyAttendance, setMonthlyAttendance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMonthlyAttendance()
    }
  }, [user])

  const fetchMonthlyAttendance = async () => {
    if (!user) return

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .not('check_in', 'is', null)

    if (data) {
      setMonthlyAttendance(data.length)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attendance Card */}
          <div className="lg:col-span-1">
            <AttendanceCard />
          </div>

          {/* Monthly Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {loading ? '...' : monthlyAttendance}
                </div>
                <div className="text-sm text-gray-600">
                  Current Month Attendance
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {user.department?.name || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future task section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Task management will be available soon!</p>
                <p className="text-sm mt-2">Focus on attendance tracking for now.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}