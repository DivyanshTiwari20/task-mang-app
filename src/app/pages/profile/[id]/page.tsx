    'use client'
    // app/profile/[id]/page.tsx
    import UserProfilePage from '@/components/UserProfilePage'
    import { useParams } from 'next/navigation'
    export default function ProfilePage() {
    return <UserProfilePage />
    }

    // --- utils/permissions.ts ---
    // Helper functions for permissions, as used by the profile page

    /**
     * Check if the current user can view the target user's profile.
     * - Admin: can view all profiles
     * - Employee: can only view their own profile
     * - Leader: can view users in their department or their own profile
     */
    export function checkProfileAccess(
    currentUser: { id: number; role: string; department_id?: number } | null | undefined,
    targetUserId: number,
    targetUserDepartment?: number
    ): boolean {
    if (!currentUser) return false

    if (currentUser.role === 'admin') return true
    if (currentUser.role === 'employee') return currentUser.id === targetUserId
    if (currentUser.role === 'leader') {
        return (
        currentUser.department_id === targetUserDepartment ||
        currentUser.id === targetUserId
        )
    }
    return false
    }

    /**
     * Check if the current user can view the target user's salary.
     * - Admin: can view all salaries
     * - User: can view their own salary
     */
    export function checkSalaryAccess(
    currentUser: { id: number; role: string } | null | undefined,
    targetUserId: number
    ): boolean {
    if (!currentUser) return false
    return currentUser.role === 'admin' || currentUser.id === targetUserId
    }

    // --- types/profile.ts ---
    // Type definitions for user profile, attendance, tasks, and salary

    export interface UserProfile {
    id: number
    username: string
    email: string
    full_name: string
    role: 'admin' | 'leader' | 'employee'
    department_id: number
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

    // --- constants/departments.ts ---
    // Department and role color mappings

    export const DEPARTMENTS: { [key: number]: string } = {
    1: 'Development Team',
    2: 'Social Media Team',
    3: 'HR Team',
    4: 'Management',
    5: 'Production Team',
    6: 'Design Team',
    7: 'Marketing Team',
    8: 'Sales Team',
    // Add new departments here
    }

    export const ROLE_COLORS: { [key: string]: string } = {
    admin: 'bg-red-500',
    leader: 'bg-blue-500',
    employee: 'bg-green-500',
    // Add new roles here
    }

    // // --- README.md ---
    // // Documentation for easy modification
    // /*
    // # User Profile Page

    // ## How to Add New Fields

    // ### 1. Adding User Information Fields
    // - Add new fields to `UserProfile` interface in `types/profile.ts`
    // - Update the API route in `app/api/employee/profile/[id]/route.ts`
    // - Add the display in `UserInfoSection.tsx` component

    // ### 2. Adding Attendance Fields
    // - Add new fields to `AttendanceData` interface in `types/profile.ts`
    // - Update the calculation logic in `app/api/employee/attendance/[id]/route.ts`
    // - Add the display in `AttendanceSection.tsx` component

    // ### 3. Adding Task Fields
    // - Add new fields to `TaskData` interface in `types/profile.ts`
    // - Update the calculation logic in `app/api/employee/tasks/[id]/route.ts`
    // - Add the display in `TasksSection.tsx` component

    // ### 4. Adding Salary Fields
    // - Add new fields to `SalaryData` interface in `types/profile.ts`
    // - Update the calculation logic in `app/api/employee/salary/[id]/route.ts`
    // - Add the display in `SalarySection.tsx` component

    // ### 5. Adding New Sections
    // - Create a new component (e.g., `AddressSection.tsx`)
    // - Add the interface for the new data type
    // - Create the API route for the new data
    // - Import and use in the main `UserProfilePage.tsx`

    // ### 6. Modifying Permissions
    // - Update `checkProfileAccess` function in `utils/permissions.ts`
    // - Add new permission checks as needed
    // - Update the role-based visibility logic

    // ### 7. Adding New Departments
    // - Update the `DEPARTMENTS` object in `constants/departments.ts`
    // - The changes will automatically reflect in the UI

    // ### 8. Adding New Roles
    // - Update the `ROLE_COLORS` object in `constants/departments.ts`
    // - Update the `CustomUser` interface in `lib/auth.tsx`
    // - Update permission functions as needed

    // ## File Structure