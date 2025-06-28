// src/app/admin-dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { EmployeeList } from '@/components/EmployeeList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { AdminCards } from '@/components/cards/AdminCards'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [todayCheckedIn, setTodayCheckedIn] = useState(0)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    const today = new Date().toISOString().split('T')[0]

    // Get total employees (excluding admin)
    const { data: allUsers } = await supabase
      .from('users')
      .select('id')
      .neq('role', 'admin')

    // Get today's check-ins
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('user_id')
      .eq('date', today)
      .not('check_in', 'is', null)

    setTotalEmployees(allUsers?.length || 0)
    setTodayCheckedIn(todayAttendance?.length || 0)
    setLoading(false)
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
     
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          {/* <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1> */}
          {/* <p className="text-muted-foreground">Manage your team&apos;s attendance and tasks</p> */}
        </div>

        {/* Stats Cards */}
        <AdminCards/>
        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Employee List</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeList showAssignTask={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}