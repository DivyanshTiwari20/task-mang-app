import { useState, useEffect } from 'react'
import { AttendanceCard } from '@/components/AttendanceCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Clock, AlertCircle, CheckCircle2, Calendar } from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  due_date: string
  priority: string
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return <AlertCircle className="w-3 h-3" />
    case 'medium':
      return <Clock className="w-3 h-3" />
    case 'low':
      return <CheckCircle2 className="w-3 h-3" />
    default:
      return <Clock className="w-3 h-3" />
  }
}

export const Tasks = () => {
  const { user } = useAuth()
  const [monthlyAttendance, setMonthlyAttendance] = useState(0)
  const [loadingAttendance, setLoadingAttendance] = useState(true)
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Optimized container with better spacing */}
      <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
        <Card className="w-full shadow-sm border-0 bg-white">
          <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-gray-800">
              <Calendar className="w-5 h-5 text-indigo-600" />
              My Tasks
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading tasks...</span>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="group p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-white hover:bg-gray-50 hover:border-indigo-200"
                  >
                    {/* Task Header - Better mobile layout */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">
                          {task.title}
                        </h3>
                        
                        {/* Priority Badge - Better positioning */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                          {getPriorityIcon(task.priority)}
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      </div>
                      
                      {/* Description with proper line height and truncation */}
                      <div className="pr-2">
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 break-words">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Task Footer - Cleaner spacing */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Days remaining indicator */}
                        <div className="text-xs text-gray-400 font-medium">
                          {(() => {
                            const dueDate = new Date(task.due_date)
                            const today = new Date()
                            const diffTime = dueDate.getTime() - today.getTime()
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                            
                            if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
                            if (diffDays === 0) return 'Due today'
                            if (diffDays === 1) return 'Due tomorrow'
                            return `${diffDays} days left`
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-base font-medium">No tasks assigned</p>
                    <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}