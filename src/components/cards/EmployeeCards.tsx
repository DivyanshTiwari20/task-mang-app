'use client'
import { useState, useEffect } from 'react'
import { AttendanceCard } from '@/components/AttendanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export const EmployeeCards = () => {
    const { user } = useAuth()
    const [monthlyAttendance, setMonthlyAttendance] = useState(0)
    const [loadingAttendance, setLoadingAttendance] = useState(true)

    useEffect(() => {
        if (user) {
            fetchMonthlyAttendance()
        }
    }, [user])

    const fetchMonthlyAttendance = async () => {
        if (!user) return null

        setLoadingAttendance(true)
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`

        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .not('check_in', 'is', null)

        if (data) {
            setMonthlyAttendance(data.length)
        } else {
            console.error('Error fetching attendance:', error)
        }
        setLoadingAttendance(false)
    }
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Attendance Card */}
                <div className="lg:col-span-1">
                    <AttendanceCard />
                </div>

                {/* Monthly Attendance */}
                <Card className='bg-amber-200'>
                    <CardHeader>
                        <CardTitle className="text-lg">My Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {loadingAttendance ? '...' : monthlyAttendance}
                            </div>
                            <div className="text-sm text-gray-600">Current Month Attendance</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Department Info
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-gray-800 mb-1">
                                {/* {user.department_id?.number || 'N/A'} */}
                            {/* </div>
                            <div className="text-sm text-gray-600">
                                Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </div>
                        </div> */}
                    {/* // </CardContent> */}
                {/* // </Card> */} 
            </div>
        </div>
    )
}
