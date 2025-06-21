// app/admin-dashboard/assign-task/[employeeId]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth'; // Import useAuth to get current user's ID
// Assuming you have these UI components from shadcn/ui or similar
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft } from 'lucide-react';
  
// Define the priority levels
type Priority = 'high' | 'medium' | 'low' | 'critical';

export default function AdminAssignTaskPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split('/');
  const employeeId = pathSegments[pathSegments.length - 1];

  const { user } = useAuth(); // Get the current logged-in user from AuthContext

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigneeName, setAssigneeName] = useState('Employee');
  const [assigneeDepartmentId, setAssigneeDepartmentId] = useState<number | null>(null); // Changed type to number | null

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!employeeId || employeeId === '[employeeId]') {
        setError('Employee ID not found in URL.');
        setLoading(false);
        return;
      }

      setLoading(true);
      // Ensure employeeId is converted to a number if your DB uses numbers
      const empIdNum = parseInt(employeeId, 10);
      if (isNaN(empIdNum)) {
        setError('Invalid Employee ID format.');
        setLoading(false);
        return;
      }

      const { data: employee, error } = await supabase
        .from('users')
        .select('full_name, department_id')
        .eq('id', empIdNum) // Query with numeric ID
        .single();

      if (error || !employee) {
        console.error('Error fetching employee details:', error?.message);
        setError('Failed to load employee details. Please go back.');
      } else {
        setAssigneeName(employee.full_name || 'Unknown Employee');
        setAssigneeDepartmentId(employee.department_id);
      }
      setLoading(false);
    };

    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  const handleAssignTask = async () => {
    setMessage('');
    setError('');

    // Ensure current user is available before proceeding
    if (!user) {
      setError('You must be logged in to assign tasks.');
      return;
    }

    if (!taskTitle || !taskDescription || !dueDate || !assigneeDepartmentId || !employeeId || employeeId === '[employeeId]') {
      setError('Please fill in all required fields (Task Title, Description, Due Date), ensure employee department is loaded, and employee ID is valid.');
      return;
    }

    const empIdNum = parseInt(employeeId, 10);
    if (isNaN(empIdNum)) {
      setError('Invalid Employee ID format.');
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
          assignee_id: empIdNum, // Send numeric employee ID
          department_id: assigneeDepartmentId,
          due_date: dueDate.toISOString().split('T')[0],
          priority: priority,
          assigned_by_id: user.id, // IMPORTANT: Send the ID of the current logged-in user
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task');
      }

      setMessage(data.message);
      setTaskTitle('');
      setTaskDescription('');
      setPriority('medium');
      setDueDate(undefined);
  } catch (err: unknown) { // Change any to unknown
  if (err instanceof Error) { // Add type guard
    setError(err.message);
    console.error('Error assigning task:', err);
  } else {
    setError('An unknown error occurred.'); // Generic fallback for non-Error objects
    console.error('An unknown error occurred:', err);
  }
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
              To: {assigneeName}
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
              onChange={(e) => setTaskDescription(e.target.value)}
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
            {/* Conditionally render Calendar only when mounted on client */}
            {hasMounted.current ? (
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                className="rounded-md border p-2 mt-1 mx-auto"
              />
            ) : (
              // This placeholder is consistently rendered on both server and client
              <div className="rounded-md border p-2 mt-1 mx-auto w-full max-w-sm text-center py-12 bg-gray-100 text-gray-500">
                Loading Calendar...
              </div>
            )}
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
