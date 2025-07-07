// types/profile.ts
// Type definitions for user profile, attendance, tasks, and salary

export interface UserProfile {
    id: number
    username: string
    email: string
    full_name: string
    role: 'admin' | 'leader' | 'employee'
    department_id: number | null
    department_name: string
    // Add new user fields here as needed
    // phone?: string
    // address?: string
    // hire_date?: string
    // employee_id?: string
  }
  
  export interface AttendanceData {
    attendance_percentage: number
    available_leaves: number
    total_working_days: number
    present_days: number
    // Add new attendance fields here as needed
    // late_arrivals?: number
    // early_departures?: number
    // overtime_hours?: number
  }
  
  export interface TaskData {
    assigned_tasks: number
    completed_tasks: number
    incomplete_tasks: number
    overdue_tasks: number
    task_completion_percentage: number
    // Add new task fields here as needed
    // avg_completion_time?: number
    // quality_score?: number
    // high_priority_tasks?: number
  }
  
  export interface SalaryData {
    total_salary: number
    deductions: number
    net_salary: number
    // Add new salary fields here as needed
    // basic_salary?: number
    // allowances?: number
    // bonus?: number
    // tax_deductions?: number
  }