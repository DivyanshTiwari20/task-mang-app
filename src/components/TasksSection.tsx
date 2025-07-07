// components/TasksSection.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, Plus, Eye } from 'lucide-react'

interface TaskData {
  assigned_tasks: number
  completed_tasks: number
  incomplete_tasks: number
  overdue_tasks: number
  task_completion_percentage: number
  // Add new task fields here
}

interface TasksSectionProps {
  taskData: TaskData
  userId: number
  canAssignTasks: boolean
}

export default function TasksSection({ taskData, userId, canAssignTasks }: TasksSectionProps) {
  // Calculate task performance status
  const getTaskStatus = (percentage: number): { label: string; color: string } => {
    if (percentage >= 80) return { label: 'Excellent', color: 'text-green-600' }
    if (percentage >= 60) return { label: 'Good', color: 'text-blue-600' }
    if (percentage >= 40) return { label: 'Average', color: 'text-yellow-600' }
    return { label: 'Needs Improvement', color: 'text-red-600' }
  }

  const taskStatus = getTaskStatus(taskData.task_completion_percentage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Tasks Overview
          </CardTitle>
          <div className="flex gap-2">
            {canAssignTasks && (
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Assign Task
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Task completion progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Task Completion Rate</span>
              <span className="text-sm font-semibold">{taskData.task_completion_percentage}%</span>
            </div>
            <Progress value={taskData.task_completion_percentage} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Performance: <span className={taskStatus.color}>{taskStatus.label}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {taskData.completed_tasks} of {taskData.assigned_tasks} tasks completed
              </span>
            </div>
          </div>

          {/* Task statistics cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{taskData.assigned_tasks}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{taskData.completed_tasks}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{taskData.incomplete_tasks}</p>
              <p className="text-xs text-muted-foreground">Incomplete</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{taskData.overdue_tasks}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>

          {/* Task status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {taskData.assigned_tasks} Total Tasks
            </Badge>
            {taskData.overdue_tasks > 0 && (
              <Badge variant="destructive">
                {taskData.overdue_tasks} Overdue
              </Badge>
            )}
            {taskData.incomplete_tasks > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                {taskData.incomplete_tasks} Pending
              </Badge>
            )}
            {taskData.completed_tasks > 0 && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                {taskData.completed_tasks} Completed
              </Badge>
            )}
          </div>

          {/* Task performance summary */}
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Performance Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Completion Rate:</span>
                <span className={`ml-2 font-medium ${taskStatus.color}`}>
                  {taskData.task_completion_percentage}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={`ml-2 font-medium ${taskStatus.color}`}>
                  {taskStatus.label}
                </span>
              </div>
              
              {/* 
                Add new performance metrics here:
                <div>
                  <span className="text-muted-foreground">Avg. Task Time:</span>
                  <span className="ml-2 font-medium">{taskData.avg_completion_time}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quality Score:</span>
                  <span className="ml-2 font-medium">{taskData.quality_score}/10</span>
                </div>
              */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}