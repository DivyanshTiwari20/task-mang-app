// src/components/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'  // your actual auth hook
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Briefcase,
  Wallet,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

const navLinks = [
  { href: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/leader-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['leader'] },
  { href: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee'] },
  { href: '/pages/employeeList', label: 'Employee List', icon: Users, roles: ['admin', 'leader'] },
  { href: '/leave-approval', label: 'Leave Approval', icon: ClipboardCheck, roles: ['admin'] },
  { href: '/finance', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/pages/tasks', label: 'Task', icon: Briefcase, roles: ['leader', 'employee'] },
]

const settingsLinks = [
  { href: '/pages/settings', label: 'Settings', icon: Settings, roles: ['admin', 'leader', 'employee'] },
]

interface SidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  isExpanded: boolean
}

function SidebarItem({ href, label, icon: Icon, isExpanded }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`
        group relative flex items-center p-3 my-1 rounded-lg transition-colors
        ${isActive
          ? 'bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800 dark:from-indigo-800 dark:to-indigo-900 dark:text-white'
          : 'hover:bg-indigo-50 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
      title={!isExpanded ? label : ''}
    >
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className={`overflow-hidden transition-all whitespace-nowrap ${isExpanded ? 'w-40 ml-3 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
        {label}
      </span>
    </Link>
  )
}

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Check screen size and set mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      if (mobile) {
        setIsExpanded(false) // Always collapsed on mobile/tablet
      } else {
        setIsExpanded(true) // Expanded by default on desktop
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (!user) return null

  const filteredNavLinks = navLinks.filter(link => link.roles.includes(user.role))
  const filteredSettingsLinks = settingsLinks.filter(link => link.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }


  const effectiveExpanded = isMobile ? false : isExpanded

  return (
    <aside
      className={`
        sticky top-0 h-screen flex flex-col bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out shadow-sm
        ${effectiveExpanded ? 'w-64' : 'w-20'}
        ${isMobile ? 'w-16 sm:w-20' : ''}
      `}
    >
     

      {/* Navigation Links */}
      <nav className="flex-1 px-2 mt-4 overflow-y-auto">
        {filteredNavLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={effectiveExpanded} />
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-gray-200 p-2">
        {filteredSettingsLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={effectiveExpanded} />
        ))}
        
        <button
          onClick={handleLogout}
          className="group relative w-full text-left flex items-center p-3 my-1 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          title={!effectiveExpanded ? 'Logout' : ''}
        >
          <LogOut className="w-6 h-6 flex-shrink-0" />
          <span className={`overflow-hidden transition-all whitespace-nowrap ${effectiveExpanded ? 'w-40 ml-3 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
            Logout
          </span>
          
          {/* Tooltip for collapsed logout button */}
          {!effectiveExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}