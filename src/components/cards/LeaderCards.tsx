
'use client'
import { useState, useEffect } from 'react'
import { AttendanceCard } from '@/components/AttendanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const LeaderCards = () => {
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

  return (
    <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Leader's Attendance Card */}
          <div className="lg:col-span-1">
            <AttendanceCard />
          </div>

          {/* Department Stats */}
          <Card className='bg-amber-200'>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Team Attendance Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${departmentStats.todayCheckedIn}/${departmentStats.totalTeamMembers}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Team Members Checked In
              </div>
            </CardContent>
          </Card>

          <Card className='bg-purple-200'>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                My Monthly Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : departmentStats.myMonthlyAttendance}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Days This Month
              </div>
            </CardContent>
          </Card>

          <Card className='bg-amber-200'>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : departmentStats.totalTeamMembers}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {user.department?.name} Members
              </div>
            </CardContent>
          </Card>
    </div>
    </div>
  )
}
