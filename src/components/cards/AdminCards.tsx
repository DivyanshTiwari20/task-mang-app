import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'


export const AdminCards = () => {
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
  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Quick Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : `${todayCheckedIn}/${totalEmployees}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Checked In Today
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : totalEmployees}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active Team Members
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? '...' : totalEmployees > 0 ? `${Math.round((todayCheckedIn / totalEmployees) * 100)}%` : '0%'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Today&apos;s Rate
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
