"use client"
import { useState, useEffect } from 'react'
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

export default function Tasks () {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

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

  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      // If no user, reset tasks
      setTasks([])
      setLoadingTasks(false)
    }
  }, [user])

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <div className="text-center py-4">
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li key={task.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-700">{task.description}</p>
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    <span className={`capitalize px-2 py-1 rounded ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No tasks assigned to you yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}