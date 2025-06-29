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
  CheckCircle2,
  Mail,
  UserCheck,
  Filter
} from 'lucide-react'

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  assigned_by_name?: string
  assigned_at?: string
  updated_at?: string
  status?: string
  assignee_name?: string
  assignee_email?: string
  department_name?: string
}

const getPriorityVariant = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'outline'
  }
}

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'outline'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return <Clock className="w-3 h-3" />
    case 'in_progress':
      return <AlertCircle className="w-3 h-3" />
    case 'completed':
      return <CheckCircle2 className="w-3 h-3" />
    default:
      return <Clock className="w-3 h-3" />
  }
}

const Tasks = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [userRole, setUserRole] = useState<string>('')
  const [userDepartment, setUserDepartment] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

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

  // Fetch tasks based on user role
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id || !userRole) return
      
      setLoadingTasks(true)
      
      try {
        let query = supabase.from('tasks').select(`
          *,
          assigned_by_name,
          assigned_at,
          updated_at,
          status
        `)

        if (userRole === 'admin') {
          console.log('Admin mode - fetching all tasks')
        } else if (userRole === 'leader') {
          console.log('Leader mode - user.id:', user.id, 'type:', typeof user.id)
          query = query.eq('assigned_by_id', user.id)
        } else {
          console.log('User mode - user.id:', user.id, 'type:', typeof user.id)
          query = query.eq('assigned_by_id', user.id)
        }

        const { data: tasksData, error } = await query.order('due_date', { ascending: true })
        
        if (error) throw error

        const tasksWithAssignees = await Promise.all(
          (tasksData || []).map(async (task) => {
            const { data: assigneeData } = await supabase
              .from('users')
              .select('full_name, email')
              .eq('id', task.assignee_id)
              .single()

            return {
              ...task,
              assignee_name: assigneeData?.full_name || 'Unknown User',
              assignee_email: assigneeData?.email || '',
            }
          })
        )

        setTasks(tasksWithAssignees)
        setFilteredTasks(tasksWithAssignees)
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoadingTasks(false)
      }
    }

    fetchTasks()
  }, [user, userRole, userDepartment])

  // Filter tasks based on status and priority
  useEffect(() => {
    let filtered = tasks

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status?.toLowerCase() === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority.toLowerCase() === priorityFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, statusFilter, priorityFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  if (loadingTasks) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tasks</h1>
          <p className="text-muted-foreground">
            {userRole === 'admin' ? 'All tasks in the system' : 'Tasks you have assigned'}
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTasks.length === 0 ? (
        <Card className="text-center p-12">
          <div className="text-muted-foreground mb-2">
            {tasks.length === 0 ? 'No tasks found' : 'No tasks match your filters'}
          </div>
          <div className="text-sm text-muted-foreground/70">
            {userRole === 'admin' ? 'No tasks in the system' : 'You haven\'t assigned any tasks yet'}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <Card key={task.id} className={`transition-all hover:shadow-md ${
                isOverdue(task.due_date) ? 'border-destructive/50 bg-destructive/5' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {task.title}
                      </CardTitle>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(task.status || 'pending')} className="flex items-center gap-1">
                      {getStatusIcon(task.status || 'pending')}
                      {task.status || 'Pending'}
                    </Badge>
                  </div>

                  {/* Assignee Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {task.assignee_name || 'Unknown User'}
                        </div>
                        {task.assignee_email && (
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {task.assignee_email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned By */}
                    {task.assigned_by_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCheck className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Assigned by {task.assigned_by_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <span className={`font-medium ${isOverdue(task.due_date) ? 'text-destructive' : ''}`}>
                          Due: {formatDate(task.due_date)}
                        </span>
                        {isOverdue(task.due_date) && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {task.assigned_at && (
                      <div className="text-xs text-muted-foreground">
                        Assigned: {formatDateTime(task.assigned_at)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Footer Info */}
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default Tasks