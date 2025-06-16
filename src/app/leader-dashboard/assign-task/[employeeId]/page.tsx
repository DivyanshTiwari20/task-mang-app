// app/leader-dashboard/assign-task/[employeeId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth'; // To get current leader's department
// Assuming you have these UI components from shadcn/ui or similar
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar'; // Or your date picker component
import { ChevronLeft } from 'lucide-react'; // For the back button icon

// Define the priority levels
type Priority = 'high' | 'medium' | 'low' | 'critical';

interface AssignTaskPageProps {
  params: {
    employeeId: string;
  };
}

export default function LeaderAssignTaskPage({ params }: AssignTaskPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth(); // Get current user (leader) info
  const { employeeId } = params;

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium'); // Default to medium
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined); // Calendar expects Date object
  const [assigneeName, setAssigneeName] = useState('Employee'); // To display the employee's name
  const [leaderDepartmentId, setLeaderDepartmentId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get leader's department from auth context
    if (user && user.role === 'leader' && user.department_id) {
      setLeaderDepartmentId(user.department_id);
    } else {
      setError('You are not authorized as a leader or your department is not set.');
      setLoading(false);
      return;
    }

    // Fetch employee details to display their name and confirm they are in the leader's department
    const fetchEmployeeDetails = async () => {
      setLoading(true);
      const { data: employee, error: employeeError } = await supabase
        .from('profiles')
        .select('full_name, department_id, role')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('Error fetching employee details:', employeeError?.message);
        setError('Failed to load employee details. Please go back.');
      } else if (employee.department_id !== leaderDepartmentId || employee.role !== 'employee') {
          // Additional check for leaders: Ensure assigned employee is in leader's department and is an employee
          setError('You can only assign tasks to employees within your department.');
          router.back(); // Redirect back if unauthorized
      } else {
        setAssigneeName(employee.full_name || 'Unknown Employee');
      }
      setLoading(false);
    };

    if (employeeId && leaderDepartmentId) { // Only fetch if employeeId and leader's department are known
      fetchEmployeeDetails();
    }
  }, [employeeId, supabase, user, leaderDepartmentId, router]); // Add router to dependency array


  const handleAssignTask = async () => {
    setMessage('');
    setError('');

    if (!taskTitle || !taskDescription || !dueDate || !leaderDepartmentId) {
      setError('Please fill in all required fields (Task Title, Description, Due Date) and ensure your department is loaded.');
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
          department_id: leaderDepartmentId, // Auto-set to the leader's department
          due_date: dueDate.toISOString().split('T')[0], // Format to YYYY-MM-DD
          priority: priority, // Include priority
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task');
      }

      setMessage(data.message);
      // Optionally clear the form or redirect
      setTaskTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
      // router.push('/leader-dashboard'); // Example redirect
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
            <h2 className="text-2xl font-bold text-gray-900">
              Assign Task
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              To: {assigneeName} (Your Department)
            </p>
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
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
              className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <Select onValueChange={(value: Priority) => setPriority(value)} value={priority}>
              <SelectTrigger className="mt-1 w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
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
              className="rounded-md border p-2 mt-1 mx-auto" // Center the calendar
            />
          </div>

          {message && <div className="text-green-600 text-sm mt-2">{message}</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    