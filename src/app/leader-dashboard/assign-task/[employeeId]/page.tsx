'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft } from 'lucide-react';

type Priority = 'high' | 'medium' | 'low' | 'critical';

export default function LeaderAssignTaskPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  const employeeId = pathSegments[pathSegments.length - 1];
  const { user } = useAuth();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigneeName, setAssigneeName] = useState('Employee');
  const [leaderDepartmentId, setLeaderDepartmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role === 'leader' && user.department_id) {
      setLeaderDepartmentId(user.department_id);
    } else if (!user) {
      setError('User not authenticated.');
      return;
    } else {
      setError('You are not authorized as a leader or your department is not set.');
      return;
    }

    const fetchEmployeeDetails = async () => {
      if (!employeeId || employeeId === '[employeeId]') {
        setError('Employee ID not found in URL.');
        return;
      }

      setLoading(true);
      const { data: employee, error: employeeError } = await supabase
        .from('users')
        .select('full_name, department_id, role')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('Error fetching employee details:', employeeError?.message);
        setError('Failed to load employee details. Please go back.');
      } else if (employee.department_id !== leaderDepartmentId || employee.role !== 'employee') {
        setError('You can only assign tasks to employees within your department.');
        router.back();
      } else {
        setAssigneeName(employee.full_name || 'Unknown Employee');
      }
      setLoading(false);
    };

    if (employeeId && leaderDepartmentId) {
      fetchEmployeeDetails();
    }
  }, [employeeId, user, leaderDepartmentId, router]);

  const handleAssignTask = async () => {
    setMessage('');
    setError('');

    if (!taskTitle || !taskDescription || !dueDate || !leaderDepartmentId || !employeeId || employeeId === '[employeeId]') {
      setError('Please fill in all required fields (Task Title, Description, Due Date), ensure your department is loaded, and employee ID is valid.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          assignee_id: employeeId,
          assigned_by_id: user?.id, // Fixed: Added missing assigned_by_id
          department_id: leaderDepartmentId,
          due_date: dueDate.toISOString().split('T')[0],
          priority: priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task');
      }

      setMessage(data.message);
      setTaskTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
    } catch (err: any) {
      setError(err.message);
      console.error('Error assigning task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assign Task</h2>
            <p className="mt-1 text-sm text-gray-600">To: {assigneeName} (Your Department)</p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleAssignTask(); }}>
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">Task Title</label>
            <Input
              id="task-title"
              name="task-title"
              type="text"
              autoComplete="off"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700">Task Description</label>
            <Textarea
              id="task-description"
              name="task-description"
              required
              value={taskDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <Select onValueChange={(value: Priority) => setPriority(value)} value={priority}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Deadline Date</label>
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              className="rounded-md border p-2 mt-1 mx-auto"
            />
          </div>

          {message && <div className="text-green-600 text-sm mt-2">{message}</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}