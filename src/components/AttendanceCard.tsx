// src/components/AttendanceCard.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

interface TodayAttendance {
  check_in: string | null
  check_out: string | null
}

export function AttendanceCard() {
  const { user } = useAuth()
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    check_in: null,
    check_out: null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTodayAttendance()
    }
  }, [user])

  const fetchTodayAttendance = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('attendance')
      .select('check_in, check_out')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (data) {
      setTodayAttendance(data)
    }
  }

  const isWithinCheckInTime = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    start.setHours(10, 0, 0, 0)
    end.setHours(10, 15, 0, 0)
    return now >= start && now <= end
  }

  const isAfter6PM = () => {
    const now = new Date()
    const sixPM = new Date()
    sixPM.setHours(18, 0, 0, 0)
    return now >= sixPM
  }

  const handleCheckIn = async () => {
    if (!user) return
    if (!isWithinCheckInTime()) return

    setLoading(true)
    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('attendance')
      .upsert({
        user_id: user.id,
        date: today,
        check_in: now
      })

    if (!error) {
      setTodayAttendance(prev => ({ ...prev, check_in: now }))
    }
    setLoading(false)
  }

  const handleCheckOut = async () => {
    if (!user) return
    if (!isAfter6PM()) return

    setLoading(true)
    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('user_id', user.id)
      .eq('date', today)

    if (!error) {
      setTodayAttendance(prev => ({ ...prev, check_out: now }))
    }
    setLoading(false)
  }

  const isCheckedIn = !!todayAttendance.check_in
  const isCheckedOut = !!todayAttendance.check_out

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Check In:</span>
          <span className="font-medium">
            {formatTime(todayAttendance.check_in)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Check Out:</span>
          <span className="font-medium">
            {formatTime(todayAttendance.check_out)}
          </span>
        </div>

        <div className="pt-2 space-y-2">
          {!isCheckedIn && isWithinCheckInTime() && (
            <Button 
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Checking In...' : 'Check In'}
            </Button>
          )}

          {isCheckedIn && !isCheckedOut && isAfter6PM() && (
            <Button 
            onClick={handleCheckOut}
            disabled={loading}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              {loading ? 'Checking Out...' : 'Check Out'}
            </Button>
          )}

          {isCheckedIn && isCheckedOut && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✓ Attendance marked for today
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
