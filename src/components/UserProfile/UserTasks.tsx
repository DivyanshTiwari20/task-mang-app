'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Edit, Calendar, User, Building } from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  status: string
  assignee_id: number
  department_id: number
  due_date: string
  priority: string
  assigned_by_id: number
  created_at: string
  assigned_by_name: string
  assigned_at: string
  assignment_notes: string
  updated_at: string
}

interface UserTasksProps {
  userId: string
  userProfile: any
}

export default function UserTasks({ userId, userProfile }: UserTasksProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Permission check for edit button
  const canEditTasks = (): boolean => {
    if (!user) return false
    return user.role === 'admin' || user.role === 'leader'
  }

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      overdue: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800' },
      medium: { color: 'bg-yellow-100 text-yellow-800' },
      high: { color: 'bg-orange-100 text-orange-800' },
      urgent: { color: 'bg-red-100 text-red-800' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    
    return (
      <Badge variant="secondary" className={config.color}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  // Check if task is overdue
  const isOverdue = (dueDate: string, status: string): boolean => {
    if (status === 'completed') return false
    return new Date(dueDate) < new Date()
  }

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching tasks for user:', userId)
      const response = await fetch(`/api/employee/tasks/${userId}`)
      console.log('Tasks response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Tasks fetch error:', errorText)
        throw new Error(`Failed to fetch tasks: ${response.status} ${errorText}`)
      }

      const tasksData = await response.json()
      console.log('Tasks data received:', tasksData)
      
      setTasks(tasksData || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchTasks()
    }
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tasks assigned yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {tasks.filter(t => isOverdue(t.due_date, t.status)).length}
              </p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Task</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Due Date</th>
                  <th className="text-left p-3 font-medium">Assigned By</th>
                  <th className="text-left p-3 font-medium">Created</th>
     
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-muted">
                    <td className="p-3">
                      <div
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer"
                        onClick={() => router.push(`/pages/task-detail/${task.id}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            router.push(`/pages/task-detail/${task.id}`)
                          }
                        }}
                      >
                        <p className="font-medium text-primary hover:underline">{task.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="p-3">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isOverdue(task.due_date, task.status) ? 'text-red-600' : ''}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{task.assigned_by_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                       
                        {canEditTasks() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // You can implement edit logic here
                              console.log('Edit task:', task.id)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}