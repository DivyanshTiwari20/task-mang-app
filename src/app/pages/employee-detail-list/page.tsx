'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface Employee {
  id: number
  username: string
  email: string
  password?: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  created_at: string
  phone?: string
  address?: string
  gender?: 'male' | 'female'
  employee_id?: string
  position?: string
  manager?: string
  join_date?: string
  salary?: number
  profile_image?: string
  department?: {
    id: string
    name: string
  }
  todayAttendance?: {
    check_in: string | null
    check_out: string | null
  }
  // Today's task stats
  todayTasksTotal?: number
  todayTasksCompleted?: number
}

interface Department {
  id: number
  name: string
}

// Remove 'join_date' from SortField type
type SortField = 'full_name' | 'email' | 'role' | 'department' | 'position' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

export default function EmployeeTablePage() {
  const { user, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [dataLoading, setDataLoading] = useState(true)
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const router = useRouter()

  const getDefaultAvatar = (gender?: string) => {
    switch (gender) {
      case 'female':
        return '/avatars/female-default.png'
      case 'male':
        return '/avatars/male-default.png'
      default:
        return '/avatars/default-avatar.png'
    }
  }

  const fetchDepartments = useCallback(async () => {
    const { data: departmentsData, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching departments:', error)
      return
    }

    setDepartments(departmentsData || [])
  }, [])

  const fetchEmployees = useCallback(async () => {
    if (!user) {
      setDataLoading(false)
      setEmployees([])
      return
    }

    setDataLoading(true)
    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        email,
        full_name,
        role,
        department_id,
        created_at,
        phone,
        address,
        gender,
        employee_id,
        position,
        manager,
        join_date,
        salary,
        profile_image,
        department:departments(id, name)
      `)

    if (user.role === 'admin') {
      query = query.not('role', 'eq', 'admin')
    } else if (user.role === 'leader') {
      query = query
        .eq('department_id', user.department_id)
        .eq('role', 'employee')
    } else {
      setDataLoading(false)
      setEmployees([])
      return
    }

    const { data: usersData, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError.message)
      setDataLoading(false)
      return
    }

    if (usersData) {
      const today = new Date()
      const todayISO = today.toISOString().split('T')[0]

      const employeesWithAttendance = await Promise.all(
        usersData
          .filter((emp: any) => emp.department_id !== null)
          .map(async (emp: any) => {
            const { data: todayData } = await supabase
              .from('attendance')
              .select('check_in, check_out')
              .eq('user_id', emp.id)
              .eq('date', todayISO)
              .single()

            // Get today's tasks for this employee
            const { data: todayTasksData } = await supabase
              .from('tasks')
              .select('id, status')
              .eq('assignee_id', emp.id)
              .eq('due_date', todayISO)

            const todayTasksTotal = todayTasksData?.length || 0
            const todayTasksCompleted = todayTasksData?.filter((t: any) => t.status === 'completed').length || 0

            return {
              ...emp,
              todayAttendance: todayData,
              todayTasksTotal,
              todayTasksCompleted
            } as Employee
          })
      )
      setEmployees(employeesWithAttendance)
    }
    setDataLoading(false)
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchEmployees()
      fetchDepartments()
    }
  }, [user, authLoading, fetchEmployees, fetchDepartments])

  useEffect(() => {
    let filtered = employees.filter(emp => {
      const matchesSearch =
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = selectedDepartment === 'all' ||
        emp.department?.name === selectedDepartment

      const matchesRole = selectedRole === 'all' || emp.role === selectedRole

      return matchesSearch && matchesDepartment && matchesRole
    })

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''

        switch (sortField) {
          case 'full_name':
            aValue = a.full_name || ''
            bValue = b.full_name || ''
            break
          case 'email':
            aValue = a.email || ''
            bValue = b.email || ''
            break
          case 'role':
            aValue = a.role || ''
            bValue = b.role || ''
            break
          case 'department':
            aValue = a.department?.name || ''
            bValue = b.department?.name || ''
            break
          case 'position':
            aValue = a.position || ''
            bValue = b.position || ''
            break
          // Removed 'join_date' from sorting
          case 'created_at':
            aValue = a.created_at || ''
            bValue = b.created_at || ''
            break
        }

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    setFilteredEmployees(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [employees, searchTerm, selectedDepartment, selectedRole, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
      if (sortDirection === 'desc') {
        setSortField('full_name')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />
    if (sortDirection === 'desc') return <ArrowDown className="ml-2 h-4 w-4" />
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageEmployees = getCurrentPageEmployees()
      setSelectedEmployees(new Set(currentPageEmployees.map(emp => emp.id)))
    } else {
      setSelectedEmployees(new Set())
    }
  }

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    const newSelected = new Set(selectedEmployees)
    if (checked) {
      newSelected.add(employeeId)
    } else {
      newSelected.delete(employeeId)
    }
    setSelectedEmployees(newSelected)
  }

  const isCheckedInToday = (attendance?: { check_in: string | null }) => {
    return !!attendance?.check_in
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'EMPTY'
    return new Date(dateString).toLocaleDateString()
  }

  // Changed to INR
  const formatSalary = (salary?: number) => {
    if (!salary) return 'EMPTY'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(salary)
  }

  const getCurrentPageEmployees = () => {
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filteredEmployees.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage)
  const currentPageEmployees = getCurrentPageEmployees()

  const isAllSelected = currentPageEmployees.length > 0 &&
    currentPageEmployees.every(emp => selectedEmployees.has(emp.id))

  const isSomeSelected = currentPageEmployees.some(emp => selectedEmployees.has(emp.id))

  // Determine if the current user is an admin
  const isAdmin = user?.role === 'admin'
  const isLeader = user?.role === 'leader'

  if (authLoading || dataLoading) {
    return <div className="text-center py-8">Loading employees...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their information
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="leader">Leader</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Actions */}
      {selectedEmployees.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedEmployees.size} employee(s) selected
          </span>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon('full_name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Email
                  {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Role
                  {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center">
                  Department
                  {getSortIcon('department')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center">
                  Position
                  {getSortIcon('position')}
                </div>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Manager</TableHead>
              {/* Removed Join Date column */}
              {/* Only show Salary column if user is admin */}
              {isAdmin && <TableHead>Salary</TableHead>}
              <TableHead>Tasks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 12 : 11} className="text-center py-8 text-muted-foreground">
                  {filteredEmployees.length === 0
                    ? "No employees found or you do not have permission to view this list."
                    : "No employees match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              currentPageEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.has(employee.id)}
                      onCheckedChange={(checked) =>
                        handleSelectEmployee(employee.id, checked as boolean)
                      }
                      aria-label={`Select ${employee.full_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div
                        className="cursor-pointer"
                        tabIndex={0}
                        role="button"
                        aria-label={`View profile of ${employee.username || 'EMPTY'}`}
                        onClick={() => router.push(`/pages/profile/${employee.id}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            router.push(`/pages/profile/${employee.id}`)
                          }
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <img
                              src={employee.profile_image || getDefaultAvatar(employee.gender)}
                              alt={`${employee.full_name} avatar`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = getDefaultAvatar(employee.gender)
                              }}
                            />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        {/* <div className="font-medium">{employee.employee_id || 'EMPTY'}</div>   */}
                        <div
                          className="text-sm text-muted-foreground cursor-pointer hover:underline"
                          onClick={() => router.push(`/pages/profile/${employee.id}`)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              router.push(`/pages/profile/${employee.id}`)
                            }
                          }}
                          aria-label={`View profile of ${employee.username || 'EMPTY'}`}
                        >
                          {employee.username || 'EMPTY'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {employee.full_name ? (
                      <span

                        aria-label={`View profile of ${employee.full_name}`}
                      >
                        {employee.full_name}
                      </span>
                    ) : (
                      'EMPTY'
                    )}
                  </TableCell>
                  <TableCell>{employee.email || 'EMPTY'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1) || 'EMPTY'}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.department?.name || 'EMPTY'}</TableCell>
                  <TableCell>{employee.position || 'EMPTY'}</TableCell>
                  <TableCell>{employee.phone || 'EMPTY'}</TableCell>
                  <TableCell>{employee.manager || 'EMPTY'}</TableCell>
                  {/* Removed Join Date cell */}
                  {/* Only show Salary cell if user is admin */}
                  {isAdmin && (
                    <TableCell>{formatSalary(employee.salary)}</TableCell>
                  )}
                  <TableCell>
                    {(employee.todayTasksTotal !== undefined && employee.todayTasksTotal > 0) ? (
                      <Badge
                        variant="outline"
                        className={
                          employee.todayTasksCompleted === employee.todayTasksTotal
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        }
                      >
                        {employee.todayTasksCompleted}/{employee.todayTasksTotal}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isCheckedInToday(employee.todayAttendance) ? "default" : "secondary"}
                      className={isCheckedInToday(employee.todayAttendance)
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : ""
                      }
                    >
                      {isCheckedInToday(employee.todayAttendance) ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${rowsPerPage}`}
            onValueChange={(value) => {
              setRowsPerPage(Number(value))
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}