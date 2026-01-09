'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Search,
    Filter,
    Calendar,
    User,
    MoreHorizontal,
    CheckCircle,
    Clock,
    AlertCircle,
    PlayCircle,
    XCircle,
    Eye,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
} from 'lucide-react'

interface Task {
    id: number
    title: string
    description: string
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
    assignee_id: number
    department_id: number
    due_date: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    assigned_by_id: number
    created_at: string
    assigned_by_name: string
    assigned_at: string
    assignment_notes: string
    updated_at: string
}

type SortField = 'title' | 'status' | 'priority' | 'due_date' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'on_hold', label: 'On Hold', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
]

const PRIORITY_OPTIONS = [
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
]

export default function MyTasksPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [tasks, setTasks] = useState<Task[]>([])
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<SortField>('due_date')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage] = useState(10)

    // Status update dialog
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [newStatus, setNewStatus] = useState<string>('')
    const [updating, setUpdating] = useState(false)

    // Create task dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        isCompleted: false
    })

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('assignee_id', user.id)
                .order('due_date', { ascending: true })

            if (error) {
                console.error('Error fetching tasks:', error.message)
                return
            }

            setTasks(data || [])
        } catch (err) {
            console.error('Error fetching tasks:', err)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (!authLoading && user) {
            fetchTasks()
        }
    }, [authLoading, user, fetchTasks])

    // Filter and sort tasks
    useEffect(() => {
        let filtered = tasks.filter(task => {
            const matchesSearch =
                task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus = statusFilter === 'all' || task.status === statusFilter
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

            return matchesSearch && matchesStatus && matchesPriority
        })

        // Apply sorting
        if (sortField && sortDirection) {
            filtered.sort((a, b) => {
                let aValue: any = ''
                let bValue: any = ''

                switch (sortField) {
                    case 'title':
                        aValue = a.title || ''
                        bValue = b.title || ''
                        break
                    case 'status':
                        aValue = a.status || ''
                        bValue = b.status || ''
                        break
                    case 'priority':
                        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                        aValue = priorityOrder[a.priority] ?? 4
                        bValue = priorityOrder[b.priority] ?? 4
                        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
                    case 'due_date':
                        aValue = a.due_date || ''
                        bValue = b.due_date || ''
                        break
                    case 'created_at':
                        aValue = a.created_at || ''
                        bValue = b.created_at || ''
                        break
                }

                if (typeof aValue === 'string') {
                    return sortDirection === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
        }

        setFilteredTasks(filtered)
        setCurrentPage(1)
    }, [tasks, searchTerm, statusFilter, priorityFilter, sortField, sortDirection])

    // Handle sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
            if (sortDirection === 'desc') {
                setSortField('due_date')
            }
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
        if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
        if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />
        return <ArrowUpDown className="ml-2 h-4 w-4" />
    }

    // Update task status
    const handleStatusUpdate = async () => {
        if (!selectedTask || !newStatus) return

        setUpdating(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedTask.id)

            if (error) {
                console.error('Error updating status:', error.message)
                return
            }

            // Update local state
            setTasks(prev => prev.map(task =>
                task.id === selectedTask.id
                    ? { ...task, status: newStatus as Task['status'], updated_at: new Date().toISOString() }
                    : task
            ))

            setStatusDialogOpen(false)
            setSelectedTask(null)
            setNewStatus('')
        } catch (err) {
            console.error('Error updating status:', err)
        } finally {
            setUpdating(false)
        }
    }

    // Quick status change
    const handleQuickStatusChange = async (task: Task, status: string) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (error) {
                console.error('Error updating status:', error.message)
                return
            }

            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { ...t, status: status as Task['status'], updated_at: new Date().toISOString() }
                    : t
            ))
        } catch (err) {
            console.error('Error updating status:', err)
        } finally {
            setUpdating(false)
        }
    }

    // Quick priority change
    const handleQuickPriorityChange = async (task: Task, priority: string) => {
        setUpdating(true)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    priority: priority,
                    updated_at: new Date().toISOString()
                })
                .eq('id', task.id)

            if (error) {
                console.error('Error updating priority:', error.message)
                return
            }

            setTasks(prev => prev.map(t =>
                t.id === task.id
                    ? { ...t, priority: priority as Task['priority'], updated_at: new Date().toISOString() }
                    : t
            ))
        } catch (err) {
            console.error('Error updating priority:', err)
        } finally {
            setUpdating(false)
        }
    }

    // Create new personal task
    const handleCreateTask = async () => {
        if (!user || !newTask.title.trim()) return

        setCreating(true)
        try {
            const today = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title: newTask.title.trim(),
                    description: newTask.description.trim() || null,
                    status: newTask.isCompleted ? 'completed' : 'pending',
                    assignee_id: user.id,
                    assigned_by_id: user.id,
                    assigned_by_name: user.full_name + ' (Self)',
                    department_id: user.department_id,
                    due_date: today,
                    priority: 'medium',
                    assigned_at: new Date().toISOString(),
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating task:', error.message)
                return
            }

            // Add to local state
            if (data) {
                setTasks(prev => [data, ...prev])
            }

            // Reset form and close dialog
            setNewTask({ title: '', description: '', isCompleted: false })
            setCreateDialogOpen(false)
        } catch (err) {
            console.error('Error creating task:', err)
        } finally {
            setCreating(false)
        }
    }

    // Status badge
    const getStatusBadge = (status: string) => {
        const config = STATUS_OPTIONS.find(s => s.value === status)
        if (!config) return <Badge variant="secondary">{status}</Badge>

        const Icon = config.icon
        return (
            <Badge variant="secondary" className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    // Priority badge
    const getPriorityBadge = (priority: string) => {
        const config = PRIORITY_OPTIONS.find(p => p.value === priority)
        if (!config) return <Badge variant="outline">{priority}</Badge>

        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        )
    }

    // Check if overdue
    const isOverdue = (dueDate: string, status: string): boolean => {
        if (status === 'completed' || status === 'cancelled') return false
        return new Date(dueDate) < new Date()
    }

    // Pagination
    const totalPages = Math.ceil(filteredTasks.length / rowsPerPage)
    const paginatedTasks = filteredTasks.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    )

    // Task statistics
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => isOverdue(t.due_date, t.status)).length,
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading tasks...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto text-center py-12">
                    <p>Please log in to view your tasks.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">My Tasks</h1>
                        <p className="text-muted-foreground">Manage your personal and assigned tasks</p>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            <p className="text-sm text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                            <p className="text-sm text-muted-foreground">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            <p className="text-sm text-muted-foreground">Completed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                            <p className="text-sm text-muted-foreground">Overdue</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {STATUS_OPTIONS.map(status => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    {PRIORITY_OPTIONS.map(priority => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                            {priority.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tasks Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Task List ({filteredTasks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50 min-w-[300px]"
                                            onClick={() => handleSort('title')}
                                        >
                                            <div className="flex items-center">
                                                Task
                                                {getSortIcon('title')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Status
                                                {getSortIcon('status')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('priority')}
                                        >
                                            <div className="flex items-center">
                                                Priority
                                                {getSortIcon('priority')}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('due_date')}
                                        >
                                            <div className="flex items-center">
                                                Due Date
                                                {getSortIcon('due_date')}
                                            </div>
                                        </TableHead>
                                        <TableHead>Assigned By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {tasks.length === 0
                                                    ? "No tasks assigned to you yet."
                                                    : "No tasks match your filters."
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedTasks.map((task) => (
                                            <TableRow key={task.id} className={isOverdue(task.due_date, task.status) ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                                                <TableCell className="min-w-[300px]">
                                                    <div
                                                        className="cursor-pointer space-y-2"
                                                        onClick={() => router.push(`/pages/task-detail/${task.id}`)}
                                                    >
                                                        <p className="font-semibold text-base text-primary hover:underline">{task.title}</p>
                                                        {task.description && (
                                                            <div className="bg-muted/50 rounded-md px-3 py-2 border-l-4 border-primary/30">
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {task.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={task.status}
                                                        onValueChange={(value) => handleQuickStatusChange(task, value)}
                                                        disabled={updating}
                                                    >
                                                        <SelectTrigger className="w-[140px] h-8">
                                                            <SelectValue>{getStatusBadge(task.status)}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map(status => (
                                                                <SelectItem key={status.value} value={status.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <status.icon className="h-4 w-4" />
                                                                        {status.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={task.priority}
                                                        onValueChange={(value) => handleQuickPriorityChange(task, value)}
                                                        disabled={updating}
                                                    >
                                                        <SelectTrigger className="w-[110px] h-8">
                                                            <SelectValue>{getPriorityBadge(task.priority)}</SelectValue>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PRIORITY_OPTIONS.map(priority => (
                                                                <SelectItem key={priority.value} value={priority.value}>
                                                                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${priority.color}`}>
                                                                        {priority.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : ''}>
                                                            {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                        {isOverdue(task.due_date, task.status) && (
                                                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span>{task.assigned_by_name || 'Unknown'}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <span className="text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Update Dialog */}
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Task Status</DialogTitle>
                            <DialogDescription>
                                Change the status of "{selectedTask?.title}"
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(status => (
                                        <SelectItem key={status.value} value={status.value}>
                                            <div className="flex items-center gap-2">
                                                <status.icon className="h-4 w-4" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleStatusUpdate} disabled={updating || !newStatus}>
                                {updating ? 'Updating...' : 'Update Status'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Task Dialog */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Personal Task</DialogTitle>
                            <DialogDescription>
                                Add a new task to your personal to-do list
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-title">Title *</Label>
                                <Input
                                    id="task-title"
                                    placeholder="Enter task title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="task-description">Description *</Label>
                                <Textarea
                                    id="task-description"
                                    placeholder="Add more details about your task..."
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Description is required for all tasks</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="task-completed"
                                    checked={newTask.isCompleted}
                                    onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isCompleted: checked as boolean }))}
                                />
                                <Label htmlFor="task-completed" className="text-sm font-normal cursor-pointer">
                                    Mark as completed
                                </Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTask}
                                disabled={creating || !newTask.title.trim() || !newTask.description.trim()}
                            >
                                {creating ? 'Creating...' : 'Create Task'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
