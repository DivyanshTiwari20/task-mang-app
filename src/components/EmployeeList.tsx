// src/components/EmployeeList.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase' // Directly import supabase client
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

// Use CustomUser from lib/auth.tsx to ensure consistent type definition
import type { CustomUser } from '@/lib/auth';

interface EmployeeListProps {
  showAssignTask?: boolean
}

// Extend CustomUser to include attendance data for display purposes
interface EmployeeWithAttendance extends CustomUser {
  todayAttendance?: {
    check_in: string | null
    check_out: string | null
  }
  monthlyAttendance?: number
  department?: { // Ensure this matches your 'departments' table structure for the join
    id: string;
    name: string;
  }
}

export function EmployeeList({ showAssignTask = false }: EmployeeListProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataLoading, setDataLoading] = useState(true); // Separate loading state for data fetching

  // Ref to track if component has mounted on client
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true; // Set to true when component mounts on client
    // Only fetch employees once authentication status is determined AND on client
    if (!authLoading && hasMounted.current) {
      fetchEmployees();
    }
    // Cleanup function (optional, but good practice for refs)
    return () => {
      hasMounted.current = false;
    };
  }, [user, authLoading]);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter(emp =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const fetchEmployees = async () => {
    if (!user) {
      setDataLoading(false);
      setEmployees([]); // Clear any previous data
      return;
    }

    setDataLoading(true); // Start data loading
    let query = supabase
      .from('users') // Querying the 'users' table
      .select(`
        id,
        full_name,
        username,
        role,
        department_id,
        department:departments(id, name)
      `);

    // Conditional filtering based on the logged-in user's role
    if (user.role === 'admin') {
      // Admins can see all users (no additional role filter here)
      // If you specifically wanted to exclude 'admin' from the list itself, you could add:
      // query = query.not('role', 'eq', 'admin');
    } else if (user.role === 'leader') {
      // Leaders can only see employees within their own department
      query = query
        .eq('department_id', user.department_id) // Filter by leader's department
        .eq('role', 'employee'); // Only show 'employee' roles for leaders
    } else {
      // For 'employee' role or any unrecognized role, they shouldn't see this list in its current form
      console.log('Employee or unauthorized user attempting to view employee list.');
      setDataLoading(false);
      setEmployees([]); // Ensure list is empty
      return;
    }

    const { data: usersData, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError.message);
      setDataLoading(false);
      return;
    }

    if (usersData) {
      // Date calculations should ideally be done consistently or on client after mount
      // For hydration, ensure these dates are stable if used in initial render.
      // Since fetchEmployees is in useEffect, these should be client-side.
      const today = new Date();
      const todayISO = today.toISOString().split('T')[0];
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const employeesWithAttendance = await Promise.all(
        usersData.map(async (emp) => {
          // Get today's attendance
          const { data: todayData, error: todayError } = await supabase
            .from('attendance')
            .select('check_in, check_out')
            .eq('user_id', emp.id)
            .eq('date', todayISO) // Use consistent todayISO
            .single();

          if (todayError && todayError.code !== 'PGRST116') { // PGRST116 means no rows found (which is fine)
              console.error(`Error fetching today's attendance for ${emp.id}:`, todayError.message);
          }

          // Get monthly attendance count
          const { data: monthlyData, error: monthlyError } = await supabase
            .from('attendance')
            .select('id') // Just fetch ID to count rows
            .eq('user_id', emp.id)
            .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
            .not('check_in', 'is', null); // Count only days with a check-in

          if (monthlyError) {
            console.error(`Error fetching monthly attendance for ${emp.id}:`, monthlyError.message);
          }

          return {
            ...emp,
            todayAttendance: todayData,
            monthlyAttendance: monthlyData?.length || 0
          };
        })
      );
      setEmployees(employeesWithAttendance);
    }
    setDataLoading(false); // End data loading
  };

  const getAttendancePercentage = (monthlyAttendance: number) => {
    // Only calculate this if the component has mounted to prevent SSR vs Client mismatches
    if (!hasMounted.current) return 0; // Return 0 or a placeholder during SSR

    const today = new Date(); // Recalculate on client for accuracy
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const workingDaysThisMonth = Math.max(0, today.getDate());
    if (workingDaysThisMonth === 0) return 0;
    return Math.round((monthlyAttendance / workingDaysThisMonth) * 100);
  };

  const isCheckedInToday = (attendance?: { check_in: string | null }) => {
    return !!attendance?.check_in;
  };

  const handleAssignTaskClick = (employeeId: string, employeeRole: string) => {
    if (user?.role === 'admin') {
      router.push(`/admin-dashboard/assign-task/${employeeId}`);
    } else if (user?.role === 'leader') {
      router.push(`/leader-dashboard/assign-task/${employeeId}`);
    }
  };

  if (authLoading || dataLoading) { // Show loading if authentication or data is still loading
    return <div className="text-center py-4">Loading employees...</div>;
  }

  // Only render employee list if data is loaded and hasMounted
  // This ensures the client-side rendering matches what's expected after hydration
  if (!hasMounted.current) {
    // This state indicates the component is still in its SSR phase or just hydrating
    // Return a minimal placeholder to prevent mismatches
    return <div className="text-center py-4">Loading...</div>;
  }


  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee List */}
      <div className="space-y-3">
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees found or you do not have permission to view this list.
          </div>
        )}
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {employee.full_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="font-medium text-gray-900">
                  {employee.full_name}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{employee.department?.name}</span>
                  <span>•</span>
                  {/* Ensure percentage is calculated only after mount */}
                  <span>{getAttendancePercentage(employee.monthlyAttendance || 0)}% attendance</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge
                    variant={isCheckedInToday(employee.todayAttendance) ? "default" : "secondary"}
                    className={isCheckedInToday(employee.todayAttendance) ? "bg-green-100 text-green-800" : ""}
                  >
                    {isCheckedInToday(employee.todayAttendance) ? 'Checked In' : 'Not Checked In'}
                  </Badge>
                  {/* Display role badge for any role other than 'employee' (or for all if desired) */}
                  {employee.role && employee.role !== 'employee' && (
                     <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                     </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Only show Assign Task button if showAssignTask is true AND the user is an admin or leader
                AND the employee in the list is actually an 'employee' role (as per the task assignment logic) */}
            {showAssignTask && user && (user.role === 'admin' || user.role === 'leader') && employee.role === 'employee' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAssignTaskClick(employee.id, employee.role)}
              >
                Assign Task
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
