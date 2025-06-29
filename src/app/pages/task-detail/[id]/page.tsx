'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { 
  Calendar, 
  User, 
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  Mail,
  UserCheck,
  MessageSquare,
  Send,
  Building2
} from 'lucide-react'

// Import shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'

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

interface Comment {
  id: number
  task_id: number
  user_id: number
  comment: string
  created_at: string
  updated_at: string
  user_name?: string
  user_role?: string
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
      return <Clock className="w-4 h-4" />
    case 'in_progress':
      return <AlertCircle className="w-4 h-4" />
    case 'completed':
      return <CheckCircle2 className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const TaskDetail = () => {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const taskId = params.id

  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Fetch user role
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
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [user])

  // Fetch task details
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return
      
      try {
        // Fetch task with assignee and assigned_by details
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single()

        if (taskError) throw taskError

        // Get assignee details
        const { data: assigneeData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', taskData.assignee_id)
          .single()

        // Get assigned_by details
        const { data: assignedByData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', taskData.assigned_by)
          .single()

        // Get department details
        const { data: departmentData } = await supabase
          .from('departments')
          .select('name')
          .eq('id', taskData.department_id)
          .single()

        setTask({
          ...taskData,
          assignee_name: assigneeData?.full_name || 'Unknown User',
          assignee_email: assigneeData?.email || '',
          assigned_by_name: assignedByData?.full_name || 'Unknown User',
          department_name: departmentData?.name || 'Unknown Department'
        })

      } catch (error) {
        console.error('Error fetching task:', error)
      }
    }

    fetchTask()
  }, [taskId])

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!taskId) return

      try {
        const { data: commentsData, error } = await supabase
          .from('comments')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Get user details for each comment
        const commentsWithUsers = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name, role')
              .eq('id', comment.user_id)
              .single()

            return {
              ...comment,
              user_name: userData?.full_name || 'Unknown User',
              user_role: userData?.role || 'user'
            }
          })
        )

        setComments(commentsWithUsers)
      } catch (error) {
        console.error('Error fetching comments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [taskId])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task || !user?.id) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      setTask({ ...task, status: newStatus })
      
      // Add a system comment about status change
      await supabase
        .from('comments')
        .insert({
          task_id: task.id,
          user_id: user.id,
          comment: `Status updated to: ${newStatus}`,
          created_at: new Date().toISOString()
        })

      // Refresh comments
      window.location.reload()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !user?.id) return

    setSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          task_id: task.id,
          user_id: user.id,
          comment: newComment.trim(),
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setNewComment('')
      // Refresh comments
      window.location.reload()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const canUpdateStatus = () => {
    if (!task || !user?.id) return false
    
    // Assignee can update status
    if (task.assignee_id === user.id) return true
    
    // Admin can update any task status
    if (userRole === 'admin') return true
    
    // Leader can update status of tasks they assigned
    if (userRole === 'leader' && task.assigned_by === user.id) return true
    
    return false
  }

  const canCompleteTask = () => {
    if (!task || !user?.id) return false
    
    // Only admin and leader (for their assigned tasks) can mark as completed
    if (userRole === 'admin') return true
    if (userRole === 'leader' && task.assigned_by === user.id) return true
    
    return false
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading || !task) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Task Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Info Card */}
          <Card className={isOverdue(task.due_date) ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
                  <p className="text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={getPriorityVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                  <Badge variant={getStatusVariant(task.status || 'pending')} className="flex items-center gap-1">
                    {getStatusIcon(task.status || 'pending')}
                    {task.status || 'Pending'}
                  </Badge>
                  {isOverdue(task.due_date) && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Update Section */}
              {canUpdateStatus() && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Update Status</h3>
                  <div className="flex gap-2">
                    <Select 
                      value={task.status || 'pending'} 
                      onValueChange={handleStatusUpdate}
                      disabled={updatingStatus}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        {canCompleteTask() && <SelectItem value="completed">Completed</SelectItem>}
                        {canCompleteTask() && <SelectItem value="cancelled">Cancelled</SelectItem>}
                      </SelectContent>
                    </Select>
                    {updatingStatus && <div className="text-sm text-muted-foreground">Updating...</div>}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Task Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{task.assignee_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {task.assignee_email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Assigned by</div>
                      <div className="font-medium">{task.assigned_by_name}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Due Date</div>
                      <div className={`font-medium ${isOverdue(task.due_date) ? 'text-destructive' : ''}`}>
                        {formatDate(task.due_date)}
                      </div>
                    </div>
                  </div>
                  
                  {task.department_name && (
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Department</div>
                        <div className="font-medium">{task.department_name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Timestamps */}
              <div className="pt-4 border-t text-sm text-muted-foreground space-y-1">
                <div>Created: {formatDateTime(task.created_at)}</div>
                {task.assigned_at && <div>Assigned: {formatDateTime(task.assigned_at)}</div>}
                {task.updated_at && <div>Last Updated: {formatDateTime(task.updated_at)}</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  size="sm"
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
              
              <Separator />
              
              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.user_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {comment.user_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail