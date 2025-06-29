// src/app/leader-dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { EmployeeList } from '@/components/EmployeeList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { LeaderCards } from '@/components/cards/LeaderCards'

export default function LeaderDashboard() {
  const { user } = useAuth()
  const [departmentStats, setDepartmentStats] = useState({
    totalTeamMembers: 0,
    todayCheckedIn: 0,
    myMonthlyAttendance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'leader') {
      fetchDepartmentStats()
    }
  }, [user])

  const fetchDepartmentStats = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    // Get team members in same department (excluding leaders and admin)
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .eq('department_id', user.department_id)
      .eq('role', 'employee')

    // Get today's check-ins for team members
    const teamMemberIds = teamMembers?.map(member => member.id) || []
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('user_id')
      .in('user_id', teamMemberIds)
      .eq('date', today)
      .not('check_in', 'is', null)

    // Get leader's own monthly attendance
    const { data: myAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
      .not('check_in', 'is', null)

    setDepartmentStats({
      totalTeamMembers: teamMembers?.length || 0,
      todayCheckedIn: todayAttendance?.length || 0,
      myMonthlyAttendance: myAttendance?.length || 0
    })
    setLoading(false)
  }

  if (user?.role !== 'leader') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          {/* <h1 className="text-2xl font-bold text-gray-900">Leader Dashboard</h1> */}
          {/* <p className="text-foreground">Manage your {user.department?.name} team</p> */}
        </div>
        <LeaderCards />

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Team  {user.department?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeList showAssignTask={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}