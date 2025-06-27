// src/components/Navbar.tsx
'use client'
import { Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  

  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-2 h-2 bg-black rounded-sm"></div>
          <h1 className="text-xl font-semibold text-gray-900">Askus</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* <Button variant="ghost" size="icon" className="relative"> */}
            {/* <Bell className="h-5 w-5" /> */}
            {/* Notification badge - for future task notifications */}
            {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3 
            </span> */}
          {/* </Button> */}

          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* <span className="text-sm text-gray-700">{user.full_name}</span> */}
          </div>

        </div>
      </div>
    </nav>
  )
}