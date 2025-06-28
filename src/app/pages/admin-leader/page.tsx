'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  Calendar, 
  User, 
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  due_date: string
  priority: string
  assignee_id: number
  assigned_by: number
  department_id: number
  created_at: string
  assignee_name?: string
  assignee_email?: string
  department_name?: string
}

const getPriorityBadge = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">High</span>
    case 'medium':
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Medium</span>
    case 'low':
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Low</span>
    default:
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">{priority}</span>
  }
}

const Tasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [userDepartment, setUserDepartment] = useState<number | null>(null)

  // Fetch user role and department
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, department_id')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        setUserRole(userData.role)
        setUserDepartment(userData.department_id)
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [user])

  // Fetch tasks based on user role - showing tasks they assigned to others
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id || !userRole) return
      
      setLoadingTasks(true)
      
      try {
        // First, let's try a simpler query to get basic task data
        let query = supabase.from('tasks').select('*')

        // Apply role-based filtering
        if (userRole === 'admin') {
          // Admin sees all tasks in the system
          console.log('Admin mode - fetching all tasks')
        } else if (userRole === 'leader') {
          // Leader sees tasks they have assigned
          console.log('Leader mode - user.id:', user.id, 'type:', typeof user.id)
          query = query.eq('assigned_by_id', user.id)
        } else {
          // Regular users see tasks they have assigned
          console.log('User mode - user.id:', user.id, 'type:', typeof user.id)
          query = query.eq('assigned_by_id', user.id)
        }

        const { data: tasksData, error } = await query.order('due_date', { ascending: true })
        
        if (error) throw error

        // Now fetch assignee names for each task
        const tasksWithAssignees = await Promise.all(
          (tasksData || []).map(async (task) => {
            // Get assignee name
            const { data: assigneeData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', task.assignee_id)
              .single()

            return {
              ...task,
              assignee_name: assigneeData?.name || 'Unknown User',
              assignee_email: assigneeData?.email || ''
            }
          })
        )

        setTasks(tasksWithAssignees)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchTasks()
  }, [user, userRole, userDepartment])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

if (loadingTasks) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-6">
          My Active Tasks
        </h1>
        
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">No tasks found</div>
            <div className="text-sm text-muted-foreground/70">
              {userRole === 'admin' ? 'No tasks in the system' : 'You haven\'t assigned any tasks yet'}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-card-foreground truncate">
                          {task.title}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {task.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-card-foreground">
                        {task.assignee_name || 'Unknown User'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary hover:text-primary/80 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tasks