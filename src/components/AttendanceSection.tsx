// components/AttendanceSection.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, UserCheck, FileText } from 'lucide-react'

interface AttendanceData {
  attendance_percentage: number
  available_leaves: number
  total_working_days: number
  present_days: number
  // Add new attendance fields here
}

interface AttendanceSectionProps {
  attendanceData: AttendanceData
  canViewDetails: boolean
}

export default function AttendanceSection({ attendanceData, canViewDetails }: AttendanceSectionProps) {
  // Calculate additional metrics - Easy to modify
  const absentDays = attendanceData.total_working_days - attendanceData.present_days
  const attendanceStatus = attendanceData.attendance_percentage >= 80 ? 'Good' : 
                          attendanceData.attendance_percentage >= 60 ? 'Average' : 'Poor'
  
  // Status color mapping
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'Good': 'text-green-600',
      'Average': 'text-yellow-600',
      'Poor': 'text-red-600'
    }
    return colors[status] || 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance
          </CardTitle>
          {canViewDetails && (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Attendance percentage with progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Attendance Rate</span>
              <span className="text-sm font-semibold">{attendanceData.attendance_percentage}%</span>
            </div>
            <Progress value={attendanceData.attendance_percentage} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Status: <span className={getStatusColor(attendanceStatus)}>{attendanceStatus}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {attendanceData.present_days} of {attendanceData.total_working_days} days
              </span>
            </div>
          </div>

          {/* Attendance stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Present Days</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{attendanceData.present_days}</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Absent Days</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{absentDays}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Available Leaves</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{attendanceData.available_leaves}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Working Days</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{attendanceData.total_working_days}</p>
            </div>

            {/* 
              Add new attendance metrics here:
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Late Arrivals</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{attendanceData.late_arrivals}</p>
              </div>
            */}
          </div>

          {/* Apply for leave button */}
          <div className="flex justify-center">
            <Button variant="outline" className="w-full">
              Apply for Leave
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}