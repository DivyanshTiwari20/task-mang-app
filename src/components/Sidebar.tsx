// src/components/Sidebar.tsx
'use client'

import React, { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
} from 'lucide-react'

// ======================================================================================
// 1. MOCK AUTH HOOK (Replace with your actual auth hook)
// ======================================================================================
type UserRole = 'admin' | 'leader' | 'employee'
const useMockAuth = () => ({
  user: { role: 'admin' as UserRole },
  loading: false,
})

// ======================================================================================
// 2. SIDEBAR STRUCTURE: NAVIGATION LINKS
// ======================================================================================
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'leader', 'employee'] },
  { href: '/employee-list', label: 'Employee List', icon: Users, roles: ['admin', 'leader'] },
  { href: '/leave-approval', label: 'Leave Approval', icon: ClipboardCheck, roles: ['admin'] },
  { href: '/finance', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/task', label: 'Task', icon: Briefcase, roles: ['admin', 'leader', 'employee'] },
]

const settingsLinks = [
  { href: '/profile', label: 'Profile', icon: User, roles: ['admin', 'leader', 'employee'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'leader'] },
]

// ======================================================================================
// 3. CHILD COMPONENT: SidebarItem
// ======================================================================================
interface SidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  isExpanded: boolean
}

const SidebarItem = ({ href, label, icon: Icon, isExpanded }: SidebarItemProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`
        flex items-center p-3 my-1 rounded-lg transition-colors
        ${isActive
          ? 'bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800 dark:from-indigo-800 dark:to-indigo-900 dark:text-white'
          : 'hover:bg-indigo-50 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      <Icon className="w-6 h-6" />
      <span
        className={`
          overflow-hidden transition-all
          ${isExpanded ? 'w-40 ml-3' : 'w-0'}
        `}
      >
        {label}
      </span>
    </Link>
  )
}

// ======================================================================================
// 4. MAIN COMPONENT: Sidebar
// ======================================================================================
export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { user } = useMockAuth() // Use your actual auth hook here

  if (!user) {
    return null // Don't render sidebar if no user is logged in
  }

  // Filter links based on the current user's role
  const filteredNavLinks = navLinks.filter(link => link.roles.includes(user.role))
  const filteredSettingsLinks = settingsLinks.filter(link => link.roles.includes(user.role))

  return (
    <aside
      className={`
        h-screen sticky top-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header section with logo and toggle button */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <h1 className={`font-bold text-xl text-indigo-600 dark:text-indigo-400 overflow-hidden transition-all ${isExpanded ? 'w-32' : 'w-0'}`}>
          TaskFlow
        </h1>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 mt-4">
        {filteredNavLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={isExpanded} />
        ))}
      </nav>

      {/* Footer section with settings links */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {filteredSettingsLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={isExpanded} />
        ))}
      </div>
    </aside>
  )
}
