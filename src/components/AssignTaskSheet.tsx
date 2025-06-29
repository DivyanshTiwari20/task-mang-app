// components/AssignTaskSheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon,
  User,
  Building,
  Mail,
  Clock,
  FileText,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Priority = 'critical' | 'high' | 'medium' | 'low';

interface Employee {
  id: number;
  full_name: string;
  email: string;
  department_id: number;
  department?: {
    name: string;
  };
}

interface AssignTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function AssignTaskSheet({ isOpen, onClose, employee }: AssignTaskSheetProps) {
  const { user } = useAuth();

  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<Date>();
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // User details for assignment tracking
  const [assignerDetails, setAssignerDetails] = useState<{
    name: string;
    email: string;
    department: string;
  } | null>(null);

  // Fetch current user details for assignment tracking
  useEffect(() => {
    // In components/AssignTaskSheet.tsx - Replace the fetchAssignerDetails function
    const fetchAssignerDetails = async () => {
      if (!user) return;

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
        full_name,
        email,
        department_id,
        departments!inner(name)
      `)
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setAssignerDetails({
          name: userData.full_name || 'Unknown',
          email: userData.email || '',
          department: userData.departments?.[0]?.name || 'Unknown Department'
        });
      } catch (error) {
        console.error('Error fetching assigner details:', error);
        // Set default values if query fails
        setAssignerDetails({
          name: user.full_name || 'Unknown',
          email: user.email || '',
          department: 'Unknown Department'
        });
      }
    };

    if (isOpen && user) {
      fetchAssignerDetails();
    }
  }, [isOpen, user]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setTaskTitle('');
      setTaskDescription('');
      setPriority('medium');
      setDueDate(undefined);
      setAssignmentNotes('');
      setIsCalendarOpen(false);
    }
  }, [isOpen]);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleAssignTask = async () => {

    if (!user || !employee || !assignerDetails) {
      toast.error('Missing required information');
      return;
    }

    if (!taskTitle.trim() || !taskDescription.trim() || !dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      toast.error('Due date cannot be in the past');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          assignee_id: employee.id,
          department_id: employee.department_id,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          priority: priority,
          assigned_by_id: user.id,
          assigned_by_name: assignerDetails.name,
          assigned_by_email: assignerDetails.email,
          assigned_by_department: assignerDetails.department,
          assignment_notes: assignmentNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign task');
      }

      toast.success(
        `Task "${taskTitle}" successfully assigned to ${employee.full_name}`,
        {
          description: `Due: ${format(dueDate, 'PPP')} • Priority: ${priority.toUpperCase()}`,
          duration: 4000,
        }
      );

      onClose();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign task',
        {
          description: 'Please try again or contact support',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Assign New Task
          </SheetTitle>
          <SheetDescription className="text-base">
            Create and assign a task to the selected employee
          </SheetDescription>

          {/* Employee Info Card */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Assigning to:
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{employee.full_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                {employee.email}
              </div>
              {employee.department && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3 w-3" />
                  {employee.department.name}
                </div>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-medium">
              Task Title *
            </Label>
            <Input
              id="task-title"
              placeholder="Enter a clear, descriptive task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description" className="text-sm font-medium">
              Task Description *
            </Label>
            <Textarea
              id="task-description"
              placeholder="Provide detailed instructions and requirements for the task"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority *</Label>
              <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Critical
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Low
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date *</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-11 justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignment-notes" className="text-sm font-medium">
              Assignment Notes
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="assignment-notes"
              placeholder="Add any additional context or notes about this assignment"
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Assigner Info */}
          {assignerDetails && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                Assignment Details
              </div>
              <div className="text-xs space-y-1">
                <p>Assigned by: <span className="font-medium">{assignerDetails.name}</span></p>
                <p>Department: <span className="font-medium">{assignerDetails.department}</span></p>
                <p>Time: <span className="font-medium">{format(new Date(), 'PPp')}</span></p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTask}
              disabled={loading || !taskTitle.trim() || !taskDescription.trim() || !dueDate}
              className={cn("flex-1", getPriorityColor(priority))}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Assign Task
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}