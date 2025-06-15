// src/components/EmployeeList.tsx
'use client'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { supabase, User } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface EmployeeListProps {
  showAssignTask?: boolean
}

interface EmployeeWithAttendance extends User {
  todayAttendance?: {
    check_in: string | null
    check_out: string | null
  }
  monthlyAttendance?: number
}

export function EmployeeList({ showAssignTask = false }: EmployeeListProps) {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAttendance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [user])

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter(emp => 
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEmployees(filtered)
  }, [employees, searchTerm])

  const fetchEmployees = async () => {
    if (!user) return

    let query = supabase
      .from('users')
      .select(`
        *,
        department:departments(*)
      `)

    // If leader, only show their department employees
    if (user.role === 'leader') {
      query = query.eq('department_id', user.department_id)
    }

    const { data: usersData } = await query

    if (usersData) {
      // Fetch attendance data for each user
      const employeesWithAttendance = await Promise.all(
        usersData.map(async (emp) => {
          // Get today's attendance
          const today = new Date().toISOString().split('T')[0]
          const { data: todayData } = await supabase
            .from('attendance')
            .select('check_in, check_out')
            .eq('user_id', emp.id)
            .eq('date', today)
            .single()

          // Get monthly attendance count
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()
          const { data: monthlyData } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', emp.id)
            .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
            .not('check_in', 'is', null)

          return {
            ...emp,
            todayAttendance: todayData,
            monthlyAttendance: monthlyData?.length || 0
          }
        })
      )

      setEmployees(employeesWithAttendance)
    }
    setLoading(false)
  }

  const getAttendancePercentage = (monthlyAttendance: number) => {
    const workingDaysThisMonth = new Date().getDate() // Simplified calculation
    return Math.round((monthlyAttendance / workingDaysThisMonth) * 100)
  }

  const isCheckedInToday = (attendance?: { check_in: string | null }) => {
    return !!attendance?.check_in
  }

  if (loading) {
    return <div className="text-center py-4">Loading employees...</div>
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee List */}
      <div className="space-y-3">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="font-medium text-gray-900">
                  {employee.full_name}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{employee.department?.name}</span>
                  <span>•</span>
                  <span>{getAttendancePercentage(employee.monthlyAttendance || 0)}% attendance</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge 
                    variant={isCheckedInToday(employee.todayAttendance) ? "default" : "secondary"}
                    className={isCheckedInToday(employee.todayAttendance) ? "bg-green-100 text-green-800" : ""}
                  >
                    {isCheckedInToday(employee.todayAttendance) ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                </div>
              </div>
            </div>

            {showAssignTask && (
              <Button variant="outline" size="sm">
                Assign Task
              </Button>
            )}
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees found
          </div>
        )}
      </div>
    </div>
  )
}