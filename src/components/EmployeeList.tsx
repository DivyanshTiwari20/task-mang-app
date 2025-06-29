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

interface EmployeeListProps {
  showAssignTask?: boolean
}

interface EmployeeWithAttendance {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number  // Changed from 'number | null' to 'number'
  gender?: 'male' | 'female'
  profile_image?: string
  todayAttendance?: {
    check_in: string | null
    check_out: string | null
  }
  monthlyAttendance?: number
  department?: {
    id: string
    name: string
  }
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

  const fetchEmployees = useCallback(async () => {
    if (!user) {
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

    if (user.role === 'admin') {
      query = query.not('role', 'eq', 'admin')
    } else if (user.role === 'leader') {
      query = query
        .eq('department_id', user.department_id)
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
      const currentMonth = today.getMonth() + 1
      const currentYear = today.getFullYear()

      const employeesWithAttendance = await Promise.all(
        usersData
          .filter((emp: any) => emp.department_id !== null) // Filter out employees without department_id
          .map(async (emp: any) => {
            // Fetch today's attendance
            const { data: todayData } = await supabase
              .from('attendance')
              .select('check_in, check_out')
              .eq('user_id', emp.id)
              .eq('date', todayISO)
              .single()

            // Fetch monthly attendance count
            const { data: monthlyData } = await supabase
              .from('attendance')
              .select('id')
              .eq('user_id', emp.id)
              .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
              .not('check_in', 'is', null)

            return {
              ...emp,
              todayAttendance: todayData,
              monthlyAttendance: monthlyData?.length || 0
            } as EmployeeWithAttendance
          })
      )
      setEmployees(employeesWithAttendance)
    }
    setDataLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchEmployees()
    }
  }, [user, authLoading, fetchEmployees])

  useEffect(() => {
    const filtered = employees.filter(emp =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEmployees(filtered)
  }, [employees, searchTerm])

  const getAttendancePercentage = (monthlyAttendance: number) => {
    const today = new Date()
    const workingDaysThisMonth = Math.max(1, today.getDate())
    return Math.round((monthlyAttendance / workingDaysThisMonth) * 100)
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
    return <div className="text-center py-4">Loading employees...</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {employees.length === 0 
              ? "No employees found or you do not have permission to view this list."
              : "No employees match your search criteria."
            }
          </div>
        )}
        
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
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

              <div>
                <div className="font-medium text-card-foreground">
                  {employee.full_name}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{employee.department?.name}</span>
                  <span>•</span>
                  <span>{getAttendancePercentage(employee.monthlyAttendance || 0)}% attendance</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={isCheckedInToday(employee.todayAttendance) ? "default" : "secondary"}
                    className={isCheckedInToday(employee.todayAttendance) 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                      : ""
                    }
                  >
                    {isCheckedInToday(employee.todayAttendance) ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                  {employee.role && employee.role !== 'employee' && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {shouldShowAssignTaskButton(employee) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignTaskClick(employee.id)}
                className="bg-muted hover:bg-muted/80"
              >
                Assign Task
              </Button>
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