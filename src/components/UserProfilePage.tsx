'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Loader2, User, Calendar, Clock, AlertCircle, Mail, Phone, MapPin, Building } from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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
  // All user fields with *
  [key: string]: any
}

interface AttendanceRecord {
  id: number
  user_id: number
  checkin: string
  checkout: string
  date: string
  cycle_start_date: string
  cycle_end_date: string
  // All attendance fields with *
  [key: string]: any
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export default function UserProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  // State management for raw data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Permission checks - now takes userProfile as parameter
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

  // Calculate stats from raw data
  const calculateAttendanceStats = () => {
    if (!attendanceRecords.length) return null
    
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter(record => record.checkin).length
    const absentDays = totalDays - presentDays
    const percentage = Math.round((presentDays / totalDays) * 100)
    
    // Calculate working hours
    const totalHours = attendanceRecords.reduce((acc, record) => {
      if (record.checkin && record.checkout) {
        const checkinTime = new Date(record.checkin).getTime()
        const checkoutTime = new Date(record.checkout).getTime()
        const hours = (checkoutTime - checkinTime) / (1000 * 60 * 60)
        return acc + hours
      }
      return acc
    }, 0)

    // Prepare chart data
    const pieChartData = [
      { name: 'Present', value: presentDays, color: '#10b981' },
      { name: 'Absent', value: absentDays, color: '#ef4444' }
    ]

    // Prepare daily attendance data for bar chart (last 7 days)
    const last7Days = attendanceRecords.slice(-7).map(record => ({
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: record.checkin && record.checkout ? 
        Math.round(((new Date(record.checkout).getTime() - new Date(record.checkin).getTime()) / (1000 * 60 * 60)) * 10) / 10 : 0,
      status: record.checkin ? 'Present' : 'Absent'
    }))
    
    return {
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      attendance_percentage: percentage,
      total_hours: Math.round(totalHours * 10) / 10,
      average_hours: Math.round((totalHours / presentDays) * 10) / 10 || 0,
      recent_records: attendanceRecords.slice(0, 10),
      pieChartData,
      barChartData: last7Days
    }
  }

  // Fetch all data
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch user profile first
      const userResponse = await fetch(`/api/employee/profile/${id}`)
      if (!userResponse.ok) throw new Error('Failed to fetch user profile')
      const userData = await userResponse.json()
      
      // Check permissions AFTER fetching user profile
      if (!canViewProfile(Number(id), userData)) {
        throw new Error('You do not have permission to view this profile')
      }

      // Set user profile after permission check passes
      setUserProfile(userData)

      // Fetch attendance records
      const attendanceResponse = await fetch(`/api/employee/attendance/${id}`)
      if (attendanceResponse.ok) {
        const attendance = await attendanceResponse.json()
        setAttendanceRecords(attendance)
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
            {attendanceStats && (
              <>
                {/* Attendance Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">{attendanceStats.attendance_percentage}%</p>
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={attendanceStats.pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {attendanceStats.pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Hours (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceStats.barChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="hours" fill="#3b82f6" />
                        </BarChart>
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
                            <th className="text-left p-3 font-medium">Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceStats.recent_records.map((record) => (
                            <tr key={record.id} className="border-b">
                              <td className="p-3">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <Badge variant={record.checkin ? 'default' : 'destructive'}>
                                  {record.checkin ? 'Present' : 'Absent'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {record.checkin && record.checkout ? 
                                  Math.round(((new Date(record.checkout).getTime() - new Date(record.checkin).getTime()) / (1000 * 60 * 60)) * 10) / 10 : 
                                  0
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
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
                      ${userProfile.salary?.toLocaleString() || 'N/A'}
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