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
  cycle_start_date: string | null
  cycle_end_date: string | null
}

// Utility functions for cycle management
const getCurrentCycle = () => {
  const today = new Date()
  const currentDate = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let cycleStart: Date
  let cycleEnd: Date

  if (currentDate >= 26) {
    // Current cycle: 26th of this month to 25th of next month
    cycleStart = new Date(currentYear, currentMonth, 26)
    cycleEnd = new Date(currentYear, currentMonth + 1, 25)
  } else {
    // Current cycle: 26th of last month to 25th of this month
    cycleStart = new Date(currentYear, currentMonth - 1, 26)
    cycleEnd = new Date(currentYear, currentMonth, 25)
  }

  return {
    start: cycleStart.toISOString().split('T')[0],
    end: cycleEnd.toISOString().split('T')[0]
  }
}

const isSunday = (date: Date) => {
  return date.getDay() === 0
}

const isWorkingDay = () => {
  const today = new Date()
  return !isSunday(today)
}

export function AttendanceCard() {
  const { user } = useAuth()
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    check_in: null,
    check_out: null,
    cycle_start_date: null,
    cycle_end_date: null
  })
  const [currentCycle, setCurrentCycle] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      const cycle = getCurrentCycle()
      setCurrentCycle(cycle)
      fetchTodayAttendance()
    }
  }, [user])

  const fetchTodayAttendance = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const cycle = getCurrentCycle()

    const { data } = await supabase
      .from('attendance')
      .select('check_in, check_out, cycle_start_date, cycle_end_date')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (data) {
      setTodayAttendance(data)
    } else {
      // Set cycle info even if no attendance record exists
      setTodayAttendance(prev => ({
        ...prev,
        cycle_start_date: cycle.start,
        cycle_end_date: cycle.end
      }))
    }
  }

  const isWithinCheckInTime = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    start.setHours(10, 0, 0, 0)
    end.setHours(10, 30, 0, 0)
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
    if (!isWorkingDay()) return

    setLoading(true)
    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]
    const cycle = getCurrentCycle()

    const { error } = await supabase
      .from('attendance')
      .upsert({
        user_id: user.id,
        date: today,
        check_in: now,
        cycle_start_date: cycle.start,
        cycle_end_date: cycle.end
      })

    if (!error) {
      setTodayAttendance(prev => ({ 
        ...prev, 
        check_in: now,
        cycle_start_date: cycle.start,
        cycle_end_date: cycle.end
      }))
    }
    setLoading(false)
  }

  const handleCheckOut = async () => {
    if (!user) return
    if (!isAfter6PM()) return
    if (!isWorkingDay()) return

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
  const isTodaySunday = isSunday(new Date())

  return (
    <Card className='bg-card border-muted shadow-md'>
      <CardHeader>
        <CardTitle className="text-lg text-foreground font-semibold">Today&apos;s Attendance</CardTitle>
        {/* <div className="text-xs text-gray-600">
          Current Cycle: {currentCycle.start} to {currentCycle.end}
        </div> */}
      </CardHeader>
      <CardContent className="space-y-4">
        {isTodaySunday && (
          <div className="text-start text-sm text-muted-foreground font-medium p-2 ">
            🏖️ Today is Sunday - No attendance required
          </div>
        )}

        {!isTodaySunday && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Check In:</span>
              <span className="font-medium">
                {formatTime(todayAttendance.check_in)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Check Out:</span>
              <span className="font-medium">
                {formatTime(todayAttendance.check_out)}
              </span>
            </div>

            <div className="pt-2 space-y-2">
              {!isCheckedIn && isWithinCheckInTime() && (
                <Button 
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Checking In...' : 'Check In'}
                </Button>
              )}

              {!isCheckedIn && !isWithinCheckInTime() && (
                <div className="text-center text-sm text-red-600 font-medium text-muted-foreground">
                  Check-in time: 10:00 AM - 10:30 AM
                </div>
              )}

              {isCheckedIn && !isCheckedOut && isAfter6PM() && (
                <Button 
                onClick={handleCheckOut}
                disabled={loading}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 text-muted-foreground"
                >
                  {loading ? 'Checking Out...' : 'Check Out'}
                </Button>
              )}

              {isCheckedIn && !isCheckedOut && !isAfter6PM() && (
                  <div className="text-center text-sm text-orange-600 font-medium text-muted-foreground">
                  Check-out available after 6:00 PM
                </div>
              )}

              {isCheckedIn && isCheckedOut && (
                <div className="text-center text-sm text-green-600 font-medium text-muted-foreground">
                  ✓ Attendance marked for today
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}