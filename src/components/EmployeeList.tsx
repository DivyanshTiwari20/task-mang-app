'use client'
import { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import AssignTaskSheet from '@/components/AssignTaskSheet'
import type { CustomUser } from '@/lib/auth'
import Link from 'next/link'

interface EmployeeListProps {
  showAssignTask?: boolean
}

interface EmployeeWithAttendance {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  gender?: 'male' | 'female'
  profile_image?: string
  todayAttendance?: {
    check_in: string | null
    check_out: string | null
  }
  monthlyAttendance?: number
  totalWorkingDays?: number
  department?: {
    id: string
    name: string
  }
  // Today's task stats
  todayTasksTotal?: number
  todayTasksCompleted?: number
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
    start: cycleStart,
    end: cycleEnd,
    startISO: cycleStart.toISOString().split('T')[0],
    endISO: cycleEnd.toISOString().split('T')[0]
  }
}

const getWorkingDaysInCycle = (cycleStart: Date, cycleEnd: Date) => {
  let workingDays = 0
  const today = new Date()

  // Only count up to today if we're in the current cycle
  const endDate = cycleEnd > today ? today : cycleEnd

  const currentDate = new Date(cycleStart)

  while (currentDate <= endDate) {
    // Skip Sundays (getDay() returns 0 for Sunday)
    if (currentDate.getDay() !== 0) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}

const getTotalWorkingDaysInCycle = (cycleStart: Date, cycleEnd: Date) => {
  let workingDays = 0
  const currentDate = new Date(cycleStart)

  while (currentDate <= cycleEnd) {
    // Skip Sundays (getDay() returns 0 for Sunday)
    if (currentDate.getDay() !== 0) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}

export function EmployeeList({ showAssignTask = false }: EmployeeListProps) {
  const { user, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAttendance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isAssignSheetOpen, setIsAssignSheetOpen] = useState(false)

  const getDefaultAvatar = (gender?: string) => {
    switch (gender) {
      case 'female':
        return '/avatars/female-default.png'
      case 'male':
        return '/avatars/male-default.png'
      default:
        return '/avatars/default-avatar.png'
    }
  }

  // fetchEmployees should not depend on user object directly, only on user.id, user.role, user.department_id
  const fetchEmployees = useCallback(async (role: string | undefined, department_id: number | undefined) => {
    if (!role) {
      setDataLoading(false)
      setEmployees([])
      return
    }

    setDataLoading(true)
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        username,
        role,
        gender,
        profile_image,
        department_id,
        department:departments(id, name)
      `)

    if (role === 'admin') {
      query = query.not('role', 'eq', 'admin')
    } else if (role === 'leader') {
      query = query
        .eq('department_id', department_id)
        .eq('role', 'employee')
    } else {
      setDataLoading(false)
      setEmployees([])
      return
    }

    const { data: usersData, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError.message)
      setDataLoading(false)
      return
    }

    if (usersData) {
      const today = new Date()
      const todayISO = today.toISOString().split('T')[0]
      const cycle = getCurrentCycle()

      const employeesWithAttendance = await Promise.all(
        usersData
          .filter((emp: any) => emp.department_id !== null)
          .map(async (emp: any) => {
            // Get today's attendance
            const { data: todayData } = await supabase
              .from('attendance')
              .select('check_in, check_out')
              .eq('user_id', emp.id)
              .eq('date', todayISO)
              .single()

            // Get cycle attendance - only count records with check_in
            const { data: cycleData } = await supabase
              .from('attendance')
              .select('id, date')
              .eq('user_id', emp.id)
              .gte('date', cycle.startISO)
              .lte('date', cycle.endISO)
              .not('check_in', 'is', null)

            // Calculate working days in current cycle (up to today)
            const workingDaysUpToToday = getWorkingDaysInCycle(cycle.start, cycle.end)
            const totalWorkingDaysInCycle = getTotalWorkingDaysInCycle(cycle.start, cycle.end)

            // Get today's tasks for this employee
            const { data: todayTasksData } = await supabase
              .from('tasks')
              .select('id, status')
              .eq('assignee_id', emp.id)
              .eq('due_date', todayISO)

            const todayTasksTotal = todayTasksData?.length || 0
            const todayTasksCompleted = todayTasksData?.filter((t: any) => t.status === 'completed').length || 0

            return {
              ...emp,
              todayAttendance: todayData,
              monthlyAttendance: cycleData?.length || 0,
              totalWorkingDays: workingDaysUpToToday,
              todayTasksTotal,
              todayTasksCompleted
            } as EmployeeWithAttendance
          })
      )
      setEmployees(employeesWithAttendance)
    }
    setDataLoading(false)
  }, [])

  // Only call fetchEmployees when user is ready and only when relevant user fields change
  useEffect(() => {
    if (!authLoading && user) {
      fetchEmployees(user.role, user.department_id ?? undefined)
    }
    // Only depend on user.role and user.department_id, not the whole user object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.role, user?.department_id, fetchEmployees])

  useEffect(() => {
    const filtered = employees.filter(emp =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEmployees(filtered)
  }, [employees, searchTerm])

  const getAttendancePercentage = (monthlyAttendance: number, totalWorkingDays: number) => {
    if (totalWorkingDays === 0) return 0
    return Math.round((monthlyAttendance / totalWorkingDays) * 100)
  }

  const isCheckedInToday = (attendance?: { check_in: string | null }) => {
    return !!attendance?.check_in
  }

  const handleAssignTaskClick = (employeeId: number) => {
    setSelectedEmployeeId(employeeId.toString())
    setIsAssignSheetOpen(true)
  }

  const shouldShowAssignTaskButton = (employee: EmployeeWithAttendance) => {
    if (!showAssignTask || !user) return false

    if (user.role === 'admin') {
      return employee.role === 'employee' || employee.role === 'leader'
    }

    if (user.role === 'leader') {
      return employee.role === 'employee'
    }

    return false
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center py-8 min-h-[120px]">
        <span className="text-center text-base sm:text-lg">Loading employees...</span>
      </div>
    )
  }

  return (
    <div
      className="
        space-y-4
        w-full
        max-w-3xl
        mx-auto
        px-2 sm:px-4
        md:max-w-5xl
        lg:max-w-6xl
        xl:max-w-7xl
        2xl:max-w-[1200px]
      "
      style={{ width: '100%' }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="space-y-3">
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-base sm:text-lg">
            {employees.length === 0
              ? "No employees found or you do not have permission to view this list."
              : "No employees match your search criteria."
            }
          </div>
        )}

        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border border-border transition-shadow hover:shadow-md w-full"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <img
                    src={employee.profile_image || getDefaultAvatar(employee.gender)}
                    alt={`${employee.full_name} avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultAvatar(employee.gender)
                    }}
                  />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/pages/profile/${employee.id}`}
                  className="text-card-foreground font-semibold text-base sm:text-lg truncate hover:underline"
                >
                  {employee.full_name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
                  <span className="truncate max-w-[120px] sm:max-w-[180px]">{employee.department?.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>
                    {getAttendancePercentage(employee.monthlyAttendance || 0, employee.totalWorkingDays || 0)}% attendance
                    ({employee.monthlyAttendance || 0}/{employee.totalWorkingDays || 0} days)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    variant={isCheckedInToday(employee.todayAttendance) ? "default" : "secondary"}
                    className={
                      (isCheckedInToday(employee.todayAttendance)
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : ""
                      ) +
                      " px-2 py-1 text-xs sm:text-sm"
                    }
                  >
                    {isCheckedInToday(employee.todayAttendance) ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                  {employee.role && employee.role !== 'employee' && (
                    <Badge
                      variant="outline"
                      className="bg-muted text-muted-foreground px-2 py-1 text-xs sm:text-sm"
                    >
                      {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                    </Badge>
                  )}
                  {/* Today's Tasks Badge */}
                  {(employee.todayTasksTotal !== undefined && employee.todayTasksTotal > 0) && (
                    <Badge
                      variant="outline"
                      className={
                        employee.todayTasksCompleted === employee.todayTasksTotal
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 text-xs sm:text-sm"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 text-xs sm:text-sm"
                      }
                    >
                      Tasks: {employee.todayTasksCompleted}/{employee.todayTasksTotal}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {shouldShowAssignTaskButton(employee) && (
              <div className="flex justify-end sm:justify-center w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAssignTaskClick(employee.id)}
                  className="bg-muted hover:bg-muted/80 w-full sm:w-auto mt-2 sm:mt-0"
                >
                  Assign Task
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assign Task Sheet */}
      {selectedEmployeeId && (
        <AssignTaskSheet
          isOpen={isAssignSheetOpen}
          onClose={() => {
            setIsAssignSheetOpen(false)
            setSelectedEmployeeId(null)
          }}
          employee={filteredEmployees.find(emp => emp.id.toString() === selectedEmployeeId) || null}
        />
      )}
    </div>
  )
}