import { useState, useEffect } from 'react'
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

export const Tasks = () => {
  const { user } = useAuth()
    const [monthlyAttendance, setMonthlyAttendance] = useState(0)
    const [loadingAttendance, setLoadingAttendance] = useState(true)
  
    const [tasks, setTasks] = useState<Task[]>([])
    const [loadingTasks, setLoadingTasks] = useState(true)
  
  return (
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
  )
}
