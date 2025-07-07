// components/UserInfoSection.tsx
'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, User, Building, Edit } from 'lucide-react'
import type { CustomUser } from '@/lib/auth'

interface UserProfile {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'leader' | 'employee'
  department_id: number
  department_name: string
  // Add new fields here easily
}

interface UserInfoSectionProps {
  userProfile: UserProfile
  currentUser: CustomUser | null
  canEdit: boolean
}

// Department mapping - Easy to modify
const getDepartmentName = (departmentId: number): string => {
  const departments: { [key: number]: string } = {
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
  return departments[departmentId] || 'Unknown Department'
}

// Role color mapping - Easy to modify
const getRoleColor = (role: string): string => {
  const colors: { [key: string]: string } = {
    admin: 'bg-red-500',
    leader: 'bg-blue-500',
    employee: 'bg-green-500',
    // Add new roles here
  }
  return colors[role] || 'bg-gray-500'
}

export default function UserInfoSection({ userProfile, currentUser, canEdit }: UserInfoSectionProps) {
  // Generate initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee Information</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-lg">
                {getInitials(userProfile.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-xl font-semibold">{userProfile.full_name}</h3>
              <p className="text-muted-foreground">ID: {userProfile.id}</p>
            </div>

            {/* Role badge */}
            <Badge 
              variant="secondary" 
              className={`${getRoleColor(userProfile.role)} text-white`}
            >
              {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </Badge>
          </div>

          {/* Contact information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{userProfile.email}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{userProfile.username}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getDepartmentName(userProfile.department_id)}</span>
            </div>

            {/* 
              Add new fields here easily:
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{userProfile.phone}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{userProfile.address}</span>
              </div>
            */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}