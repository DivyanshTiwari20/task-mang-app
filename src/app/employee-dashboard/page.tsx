// src/app/employee-dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AttendanceCard } from '@/components/AttendanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Task {
  id: number
  title: string
  description: string
  due_date: string
  priority: string
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [monthlyAttendance, setMonthlyAttendance] = useState(0)
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMonthlyAttendance()
      fetchTasks()
    }
  }, [user])

  const fetchMonthlyAttendance = async () => {
    if (!user) return

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

  const fetchTasks = async () => {
    if (!user) return

    setLoadingTasks(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, due_date, priority')
      .eq('assignee_id', user.id)
      .order('due_date', { ascending: true })

    if (data) {
      setTasks(data)
    } else {
      console.error('Error fetching tasks:', error)
    }
    setLoadingTasks(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.full_name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Attendance Card */}
          <div className="lg:col-span-1">
            <AttendanceCard />
          </div>

          {/* Monthly Attendance */}
          <Card>
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

          {/* Department Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {user.department_id?.number || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <p>Loading tasks...</p>
              ) : tasks.length > 0 ? (
                <ul className="space-y-4">
                  {tasks.map(task => (
                    <li key={task.id} className="p-4 border rounded-lg">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-700">{task.description}</p>
                      <div className="mt-2 text-xs text-gray-500 flex justify-between">
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">No tasks assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
