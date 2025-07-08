// src/app/employee-dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { EmployeeCards } from '@/components/cards/EmployeeCards'
import UserTasks from '@/components/UserProfile/UserTasks'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Welcome back, {user.full_name}</p>
        </div>
        
        {/* Main Content Grid */}
        <div className="space-y-8">
          <EmployeeCards />
       <UserTasks userId={String(user.id)} userProfile={user} />
        </div>
      </div>
    </div>
  )
}