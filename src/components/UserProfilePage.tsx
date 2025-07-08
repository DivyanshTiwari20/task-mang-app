'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, AlertCircle, Mail, Phone, MapPin, Building } from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Updated types for raw data
interface UserProfile {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  department_name: string
  salary: number
  phone?: string
  location?: string
  created_at?: string
  [key: string]: any
}

interface AttendanceRecord {
  id: number
  user_id: number
  check_in: string | null
  check_out: string | null
  date: string
  cycle_start_date: string
  cycle_end_date: string
  [key: string]: any
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

// Helper function to format salary in INR
function formatINR(amount: number | undefined): string {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A'
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

export default function UserProfilePage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined
  const router = useRouter()
  const { user } = useAuth()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  // Permission checks
  const canViewProfile = (targetUserId: number, targetUserProfile: UserProfile | null): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'employee') return user.id === targetUserId
    if (user.role === 'leader') {
      return user.department_id === targetUserProfile?.department_id || user.id === targetUserId
    }
    return false
  }

  const canViewSalary = (): boolean => {
    if (!user || !userProfile) return false
    return user.role === 'admin' || user.id === userProfile.id
  }

  // Helper function to check if a date string is valid
  const isValidDate = (dateString: string | null): boolean => {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  // Calculate stats from raw data
  const calculateAttendanceStats = () => {
    console.log('Calculating attendance stats for records:', attendanceRecords)

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('No attendance records found')
      return null
    }

    // Get cycle dates from the first record (assuming all records have same cycle)
    const firstRecord = attendanceRecords[0]
    const cycleStartDate = new Date(firstRecord.cycle_start_date)
    const cycleEndDate = new Date(firstRecord.cycle_end_date)
    const today = new Date()

    // Use today if cycle hasn't ended yet, otherwise use cycle end date
    const effectiveEndDate = today < cycleEndDate ? today : cycleEndDate

    console.log('Cycle start:', cycleStartDate.toDateString())
    console.log('Cycle end:', cycleEndDate.toDateString())
    console.log('Effective end:', effectiveEndDate.toDateString())

    // Helper function to calculate working days (excluding Sundays)
    const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
      let count = 0
      const current = new Date(startDate)

      while (current <= endDate) {
        // Skip Sundays (0 = Sunday)
        if (current.getDay() !== 0) {
          count++
        }
        current.setDate(current.getDate() + 1)
      }

      return count
    }
    // Calculate total working days (excluding Sundays) in the cycle period
    const totalWorkingDays = calculateWorkingDays(cycleStartDate, effectiveEndDate)
    console.log('Total working days in cycle:', totalWorkingDays)

    // Count present days from attendance records
    const presentDays = attendanceRecords.filter(record => {
      const hasCheckin = record.check_in && record.check_in !== '' && record.check_in !== null
      console.log(`Record ${record.id}: check_in=${record.check_in}, hasCheckin=${hasCheckin}`)
      return hasCheckin
    }).length

    const absentDays = totalWorkingDays - presentDays
    const percentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0

    console.log(`Present: ${presentDays}, Total Working Days: ${totalWorkingDays}, Absent: ${absentDays}, Percentage: ${percentage}%`)

    // Calculate working hours (same as before)
    const totalHours = attendanceRecords.reduce((acc, record) => {
      if (record.check_in && record.check_out &&
        isValidDate(record.check_in) && isValidDate(record.check_out)) {
        const checkinTime = new Date(record.check_in).getTime()
        const checkoutTime = new Date(record.check_out).getTime()

        if (checkoutTime > checkinTime) {
          const hours = (checkoutTime - checkinTime) / (1000 * 60 * 60)
          console.log(`Record ${record.id}: ${hours.toFixed(2)} hours`)
          return acc + hours
        }
      }
      return acc
    }, 0)

    console.log('Total hours:', totalHours)

    // Prepare chart data
    const pieChartData = [
      { name: 'Present', value: presentDays, color: '#10b981' },
      { name: 'Absent', value: absentDays, color: '#ef4444' }
    ]

    // Prepare daily attendance data for bar chart (last 7 days)
    // Prepare daily attendance data for bar chart (last 7 days)
    const sortedRecords = [...attendanceRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const last7Records = sortedRecords.slice(0, 7).reverse()

    const barChartData = last7Records.map(record => {
      let hours = 0
      if (record.check_in && record.check_out &&
        isValidDate(record.check_in) && isValidDate(record.check_out)) {
        const checkinTime = new Date(record.check_in).getTime()
        const checkoutTime = new Date(record.check_out).getTime()
        if (checkoutTime > checkinTime) {
          hours = Math.round(((checkoutTime - checkinTime) / (1000 * 60 * 60)) * 10) / 10
        }
      }

      console.log(`Bar chart data for ${record.date}: ${hours} hours`) // Debug log

      return {
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: hours,
        status: record.check_in ? 'Present' : 'Absent'
      }
    })

    console.log('Bar chart data:', barChartData) // Debug log

    const recent_records = sortedRecords.slice(0, 10)

    return {
      total_days: totalWorkingDays, // Changed from attendanceRecords.length
      present_days: presentDays,
      absent_days: absentDays,
      attendance_percentage: percentage,
      total_hours: Math.round(totalHours * 10) / 10,
      average_hours: presentDays > 0 ? Math.round((totalHours / presentDays) * 10) / 10 : 0,
      recent_records,
      pieChartData,
      barChartData
    }
  }
  // Fetch all data
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      setAttendanceError(null)

      console.log('Fetching user profile for ID:', id)

      // Fetch user profile first
      const userResponse = await fetch(`/api/employee/profile/${id}`)
      console.log('User response status:', userResponse.status)

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('User profile error:', errorText)
        throw new Error(`Failed to fetch user profile: ${userResponse.status} ${errorText}`)
      }

      const userData = await userResponse.json()
      console.log('User data received:', userData)

      // Check permissions AFTER fetching user profile
      if (!canViewProfile(Number(id), userData)) {
        throw new Error('You do not have permission to view this profile')
      }

      setUserProfile(userData)

      // Fetch attendance records with better error handling
      console.log('Fetching attendance records for user:', id)
      const attendanceResponse = await fetch(`/api/employee/attendance/${id}`)
      console.log('Attendance response status:', attendanceResponse.status)

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        console.log('Raw attendance data:', attendanceData)

        // Handle different possible response formats
        let processedAttendance = []

        if (Array.isArray(attendanceData)) {
          processedAttendance = attendanceData
        } else if (attendanceData && Array.isArray(attendanceData.data)) {
          processedAttendance = attendanceData.data
        } else if (attendanceData && Array.isArray(attendanceData.records)) {
          processedAttendance = attendanceData.records
        } else if (attendanceData && typeof attendanceData === 'object') {
          // Single record returned
          processedAttendance = [attendanceData]
        }

        console.log('Processed attendance data:', processedAttendance)
        setAttendanceRecords(processedAttendance)
      } else {
        const errorText = await attendanceResponse.text()
        console.error('Attendance fetch error:', errorText)
        setAttendanceError(`Failed to fetch attendance: ${attendanceResponse.status} ${errorText}`)
        setAttendanceRecords([])
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      toast.error('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && user) {
      fetchUserProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const attendanceStats = calculateAttendanceStats()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* User Profile Header */}
        {userProfile && (
          <div className="flex items-center gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {userProfile.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{userProfile.full_name}</h1>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
              <p className="text-muted-foreground text-lg">{userProfile.role === 'leader' ? 'Product Manager' : userProfile.role}</p>
              <p className="text-sm text-muted-foreground">
                Joined on {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-4 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <p className="text-sm text-yellow-800">
                Debug: Found {attendanceRecords.length} attendance records
                {attendanceError && ` | Error: ${attendanceError}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{userProfile?.department_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm">
                        {userProfile?.role?.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium">{userProfile?.role === 'leader' ? 'Product Manager' : userProfile?.role}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{userProfile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{userProfile?.phone || '+1-555-123-4567'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{userProfile?.location || 'New York, NY'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            {attendanceError && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">{attendanceError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {attendanceStats && (
              <>
                {/* Attendance Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{attendanceStats.total_days}</p>
                        <p className="text-sm text-muted-foreground">Working Days</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{attendanceStats.present_days}</p>
                        <p className="text-sm text-muted-foreground">Present Days</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{attendanceStats.total_hours}</p>
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-600">{attendanceStats.average_hours}</p>
                        <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={attendanceStats.pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => {
                              const safeValue = Number(value) || 0;
                              const total = attendanceStats.present_days + attendanceStats.absent_days;
                              const percentage = total > 0 ? Math.round((safeValue / total) * 100) : 0;
                              return `${name}: ${safeValue} (${percentage}%)`;
                            }}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {attendanceStats.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => {
                              const safeValue = Number(value) || 0;
                              const total = attendanceStats.present_days + attendanceStats.absent_days;
                              const percentage = total > 0 ? Math.round((safeValue / total) * 100) : 0;
                              return [`${safeValue} (${percentage}%)`, name];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
              
                </div>

                {/* Attendance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Check In</th>
                            <th className="text-left p-3 font-medium">Check Out</th>
                            <th className="text-left p-3 font-medium">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceStats.recent_records.map((record) => {
                            let hours = 0
                            if (record.check_in && record.check_out &&
                              isValidDate(record.check_in) && isValidDate(record.check_out)) {
                              const checkinTime = new Date(record.check_in).getTime()
                              const checkoutTime = new Date(record.check_out).getTime()
                              if (checkoutTime > checkinTime) {
                                hours = Math.round(((checkoutTime - checkinTime) / (1000 * 60 * 60)) * 10) / 10
                              }
                            }
                            return (
                              <tr key={record.id} className="border-b">
                                <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <Badge variant={record.check_in ? 'default' : 'destructive'}>
                                    {record.check_in ? 'Present' : 'Absent'}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  {record.check_in ? new Date(record.check_in).toLocaleTimeString() : 'N/A'}
                                </td>
                                <td className="p-3">
                                  {record.check_out ? new Date(record.check_out).toLocaleTimeString() : 'N/A'}
                                </td>
                                <td className="p-3">{hours || 'N/A'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!attendanceStats && !attendanceError && (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance data available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Salary Tab */}
          <TabsContent value="salary" className="space-y-6">
            {canViewSalary() && userProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Salary Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {formatINR(userProfile.salary)}
                    </p>
                    <p className="text-muted-foreground">Annual Salary</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {!canViewSalary() && (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You don't have permission to view salary information.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}