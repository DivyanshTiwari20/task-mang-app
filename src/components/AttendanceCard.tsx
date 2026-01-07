// src/components/AttendanceCard.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'

interface TodayAttendance {
  check_in: string | null
  check_out: string | null
  cycle_start_date: string | null
  cycle_end_date: string | null
  attendance_type: 'full_day' | 'half_day' | null
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
    cycle_end_date: null,
    attendance_type: null
  })
  const [currentCycle, setCurrentCycle] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      const cycle = getCurrentCycle()
      setCurrentCycle(cycle)
      fetchTodayAttendance()
    }
  }, [user])

  // Auto check-out logic: runs when time changes
  useEffect(() => {
    if (user && todayAttendance.check_in && !todayAttendance.check_out && isAfter6PM()) {
      handleAutoCheckOut()
    }
  }, [currentTime, todayAttendance.check_in, todayAttendance.check_out])

  const fetchTodayAttendance = async () => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const cycle = getCurrentCycle()

    const { data } = await supabase
      .from('attendance')
      .select('check_in, check_out, cycle_start_date, cycle_end_date, attendance_type')
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

  // Check-in window: 10:00 AM - 10:15 AM for FULL DAY
  const isWithinFullDayCheckInTime = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    start.setHours(10, 0, 0, 0)
    end.setHours(10, 15, 0, 0)
    return now >= start && now <= end
  }

  // After 10:15 AM but before 6 PM - HALF DAY check-in allowed
  const isWithinHalfDayCheckInTime = () => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    start.setHours(10, 15, 0, 0)
    end.setHours(18, 0, 0, 0)
    return now > start && now < end
  }

  // Can check-in (either full or half day)
  const canCheckIn = () => {
    return isWithinFullDayCheckInTime() || isWithinHalfDayCheckInTime()
  }

  const isAfter6PM = () => {
    const now = new Date()
    const sixPM = new Date()
    sixPM.setHours(18, 0, 0, 0)
    return now >= sixPM
  }

  const isBefore10AM = () => {
    const now = new Date()
    const tenAM = new Date()
    tenAM.setHours(10, 0, 0, 0)
    return now < tenAM
  }

  const handleCheckIn = async () => {
    if (!user) return
    if (!canCheckIn()) return
    if (!isWorkingDay()) return

    setLoading(true)
    const now = new Date().toISOString()
    const today = new Date().toISOString().split('T')[0]
    const cycle = getCurrentCycle()

    // Determine attendance type based on check-in time
    const attendanceType = isWithinFullDayCheckInTime() ? 'full_day' : 'half_day'

    const { error } = await supabase
      .from('attendance')
      .upsert({
        user_id: user.id,
        date: today,
        check_in: now,
        cycle_start_date: cycle.start,
        cycle_end_date: cycle.end,
        attendance_type: attendanceType
      })

    if (!error) {
      setTodayAttendance(prev => ({
        ...prev,
        check_in: now,
        cycle_start_date: cycle.start,
        cycle_end_date: cycle.end,
        attendance_type: attendanceType
      }))
    }
    setLoading(false)
  }

  // Auto check-out at 6 PM - no user action needed
  const handleAutoCheckOut = async () => {
    if (!user) return
    if (!isWorkingDay()) return

    setLoading(true)
    const now = new Date()
    // Set checkout time to exactly 6 PM
    now.setHours(18, 0, 0, 0)
    const checkOutTime = now.toISOString()
    const today = new Date().toISOString().split('T')[0]

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: checkOutTime })
      .eq('user_id', user.id)
      .eq('date', today)

    if (!error) {
      setTodayAttendance(prev => ({ ...prev, check_out: checkOutTime }))
    }
    setLoading(false)
  }

  const isCheckedIn = !!todayAttendance.check_in
  const isCheckedOut = !!todayAttendance.check_out
  const isTodaySunday = isSunday(new Date())

  const getAttendanceTypeBadge = () => {
    if (!todayAttendance.attendance_type) return null

    if (todayAttendance.attendance_type === 'full_day') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Full Day
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          Half Day
        </Badge>
      )
    }
  }

  return (
    <Card className='bg-card border-muted shadow-md'>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-foreground font-semibold">Today&apos;s Attendance</CardTitle>
          {isCheckedIn && getAttendanceTypeBadge()}
        </div>
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
                {isCheckedIn && !isCheckedOut && !isAfter6PM() && (
                  <span className="text-xs text-muted-foreground ml-2">(Auto at 6 PM)</span>
                )}
              </span>
            </div>

            <div className="pt-2 space-y-2">
              {/* Before 10 AM - waiting message */}
              {!isCheckedIn && isBefore10AM() && (
                <div className="text-center text-sm text-muted-foreground font-medium p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  ⏰ Check-in opens at 10:00 AM
                </div>
              )}

              {/* Full day check-in window: 10:00 - 10:15 AM */}
              {!isCheckedIn && isWithinFullDayCheckInTime() && (
                <>
                  <div className="text-center text-xs text-green-600 font-medium mb-2">
                    ✓ Full Day Check-in Window (10:00 - 10:15 AM)
                  </div>
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? 'Checking In...' : 'Check In (Full Day)'}
                  </Button>
                </>
              )}

              {/* Half day check-in window: After 10:15 AM */}
              {!isCheckedIn && isWithinHalfDayCheckInTime() && (
                <>
                  <div className="text-center text-xs text-yellow-600 font-medium mb-2">
                    ⚠️ Late check-in - Will be marked as Half Day
                  </div>
                  <Button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {loading ? 'Checking In...' : 'Check In (Half Day)'}
                  </Button>
                </>
              )}

              {/* After 6 PM - too late */}
              {!isCheckedIn && isAfter6PM() && (
                <div className="text-center text-sm text-red-600 font-medium p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  ❌ Check-in time has passed for today
                </div>
              )}

              {/* Checked in, waiting for auto checkout */}
              {isCheckedIn && !isCheckedOut && !isAfter6PM() && (
                <div className="text-center text-sm text-orange-600 font-medium p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  ⏳ Auto check-out at 6:00 PM
                </div>
              )}

              {/* Fully complete */}
              {isCheckedIn && isCheckedOut && (
                <div className="text-center text-sm text-green-600 font-medium p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  ✓ Attendance marked for today
                  {todayAttendance.attendance_type === 'half_day' && ' (Half Day)'}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
