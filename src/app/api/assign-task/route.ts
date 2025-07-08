// app/api/assign-task/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      assignee_id,
      department_id,
      due_date,
      priority,
      assigned_by_id,
      assigned_by_name,
      assigned_by_email,
      assigned_by_department,
      assignment_notes
    } = body;

    // Validate required fields
    if (!title || !description || !assignee_id || !department_id || !due_date || !priority || !assigned_by_id) {
      return NextResponse.json(
        { 
          message: 'Missing required fields',
          required: ['title', 'description', 'assignee_id', 'department_id', 'due_date', 'priority', 'assigned_by_id']
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { message: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Validate due date format
    const dueDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dueDateRegex.test(due_date)) {
      return NextResponse.json(
        { message: 'Invalid due date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check if due date is not in the past
    const today = new Date();
    const taskDueDate = new Date(due_date);
    today.setHours(0, 0, 0, 0);
    taskDueDate.setHours(0, 0, 0, 0);
    
    if (taskDueDate < today) {
      return NextResponse.json(
        { message: 'Due date cannot be in the past' },
        { status: 400 }
      );
    }

    // Verify assignee exists - Fixed query to match your schema
    const { data: assignee, error: assigneeError } = await supabase
      .from('users')
      .select('id, full_name, email, department_id')
      .eq('id', assignee_id)
      .single();

    if (assigneeError || !assignee) {
      console.error('Assignee lookup error:', assigneeError);
      return NextResponse.json(
        { message: 'Assignee not found' },
        { status: 404 }
      );
    }

    // Verify assigner exists - Removed is_active check
    const { data: assigner, error: assignerError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', assigned_by_id)
      .single();

    if (assignerError || !assigner) {
      console.error('Assigner lookup error:', assignerError);
      return NextResponse.json(
        { message: 'Assigner not found' },
        { status: 404 }
      );
    }

    // Check if assigner has permission (assuming admin or manager roles can assign)
    const allowedRoles = ['admin', 'manager', 'supervisor'];
    if (!allowedRoles.includes(assigner.role?.toLowerCase())) {
      return NextResponse.json(
        { message: 'Insufficient permissions to assign tasks' },
        { status: 403 }
      );
    }

    // Insert the task - Now with all required fields
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description.trim(),
        assignee_id: parseInt(assignee_id),
        department_id: parseInt(department_id), 
        due_date,
        priority,
        assigned_by_id: parseInt(assigned_by_id),
        assigned_by_name,
        assigned_by_email,
        assigned_by_department,
        assignment_notes: assignment_notes?.trim() || null,
        assigned_at: new Date().toISOString(),
        status: 'pending'
        // created_at and updated_at will be set automatically by database defaults
      })
      .select()
      .single();

    if (taskError) {
      console.error('Database error:', taskError);
      return NextResponse.json(
        { 
          message: 'Failed to create task',
          error: process.env.NODE_ENV === 'development' ? taskError.message : 'Database error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: `Task "${title}" successfully assigned to ${assignee.full_name}`,
        task: {
          id: task.id,
          title: task.title,
          assignee_name: assignee.full_name,
          assignee_email: assignee.email,
          due_date: task.due_date,
          priority: task.priority,
          assigned_by: assigned_by_name,
          assigned_at: task.assigned_at
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}