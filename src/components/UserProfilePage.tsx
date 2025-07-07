'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, User, Calendar, CheckCircle, DollarSign, Clock, Target, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Updated types for raw data
interface UserProfile {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  department_name: string
  salary: number
  created_at?: string
  // All user fields with *
  [key: string]: any
}

interface AttendanceRecord {
  id: number
  user_id: number
  checkin: string
  checkout: string
  date: string
  cycle_start_date: string
  cycle_end_date: string
  // All attendance fields with *
  [key: string]: any
}

interface TaskRecord {
  id: number
  assignee_id: number
  title: string
  description: string
  status: string
  due_date: string
  created_at: string
  // All task fields with *
  [key: string]: any
}

export default function UserProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // State management for raw data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Permission checks - now takes userProfile as parameter
  const canViewProfile = (targetUserId: number, targetUserProfile: UserProfile | null): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'employee') return user.id === targetUserId
    if (user.role === 'leader') {
      return user.department_id === targetUserProfile?.department_id || user.id === targetUserId
    }
    return false
  }

  const canViewSalary = (): boolean => {
    if (!user || !userProfile) return false
    return user.role === 'admin' || user.id === userProfile.id
  }

  // Calculate stats from raw data
  const calculateAttendanceStats = () => {
    if (!attendanceRecords.length) return null
    
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter(record => record.checkin).length
    const percentage = Math.round((presentDays / totalDays) * 100)
    
    return {
      total_days: totalDays,
      present_days: presentDays,
      attendance_percentage: percentage,
      recent_records: attendanceRecords.slice(0, 5)
    }
  }

  const calculateTaskStats = () => {
    if (!taskRecords.length) return null
    
    const total = taskRecords.length
    const completed = taskRecords.filter(task => task.status === 'completed').length
    const pending = taskRecords.filter(task => task.status === 'pending').length
    const inProgress = taskRecords.filter(task => task.status === 'in_progress').length
    
    const currentDate = new Date()
    const overdue = taskRecords.filter(task => {
      const dueDate = new Date(task.due_date)
      return task.status !== 'completed' && dueDate < currentDate
    }).length
    
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return {
      total_tasks: total,
      completed_tasks: completed,
      pending_tasks: pending,
      in_progress_tasks: inProgress,
      overdue_tasks: overdue,
      completion_percentage: completionPercentage,
      recent_tasks: taskRecords.slice(0, 5)
    }
  }

  // Fetch all data
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user profile first
      const userResponse = await fetch(`/api/employee/profile/${id}`)
      if (!userResponse.ok) throw new Error('Failed to fetch user profile')
      const userData = await userResponse.json()
      
      // Check permissions AFTER fetching user profile
      if (!canViewProfile(Number(id), userData)) {
        throw new Error('You do not have permission to view this profile')
      }

      // Set user profile after permission check passes
      setUserProfile(userData)

      // Fetch attendance records
      const attendanceResponse = await fetch(`/api/employee/attendance/${id}`)
      if (attendanceResponse.ok) {
        const attendance = await attendanceResponse.json()
        setAttendanceRecords(attendance)
      }

      // Fetch task records
      const taskResponse = await fetch(`/api/employee/tasks/${id}`)
      if (taskResponse.ok) {
        const tasks = await taskResponse.json()
        setTaskRecords(tasks)
      }

    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && user) {
      fetchUserProfile()
    }
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const attendanceStats = calculateAttendanceStats()
  const taskStats = calculateTaskStats()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
            <p className="text-muted-foreground">View detailed employee information</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* User Information Card */}
          {userProfile && (
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{userProfile.full_name}</CardTitle>
                    <p className="text-muted-foreground">@{userProfile.username}</p>
                  </div>
                  <Badge variant={userProfile.role === 'admin' ? 'destructive' : userProfile.role === 'leader' ? 'default' : 'secondary'}>
                    {userProfile.role.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{userProfile.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <p className="font-medium">{userProfile.department_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                    <p className="font-medium">#{userProfile.id}</p>
                  </div>
                  {canViewSalary() && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Salary</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        ${userProfile.salary?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance Section */}
          {attendanceStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{attendanceStats.attendance_percentage}%</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.present_days}</p>
                    <p className="text-sm text-muted-foreground">Present Days</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{attendanceStats.total_days}</p>
                    <p className="text-sm text-muted-foreground">Total Days</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.total_days - attendanceStats.present_days}</p>
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Attendance</h4>
                  {attendanceStats.recent_records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">In: {record.checkin ? new Date(record.checkin).toLocaleTimeString() : 'N/A'}</span>
                        <span className="text-red-600">Out: {record.checkout ? new Date(record.checkout).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks Section */}
          {taskStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Task Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{taskStats.completion_percentage}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{taskStats.total_tasks}</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{taskStats.completed_tasks}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{taskStats.in_progress_tasks}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{taskStats.overdue_tasks}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Tasks</h4>
                  {taskStats.recent_tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          task.status === 'completed' ? 'default' : 
                          task.status === 'in_progress' ? 'secondary' : 
                          'destructive'
                        }>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}