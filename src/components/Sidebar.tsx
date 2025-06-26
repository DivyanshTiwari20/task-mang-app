// src/components/Sidebar.tsx
'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

// ======================================================================================
// SIDEBAR STRUCTURE: NAVIGATION LINKS
// ======================================================================================
const navLinks = [
  { href: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/leader-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [ 'leader'] },
  { href: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [ 'employee'] },
  { href: '/pages/employeeList', label: 'Employee List', icon: Users, roles: ['admin', 'leader'] },
  { href: '/leave-approval', label: 'Leave Approval', icon: ClipboardCheck, roles: ['admin'] },
  { href: '/finance', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/task', label: 'Task', icon: Briefcase, roles: ['admin', 'leader', 'employee'] },
]

const settingsLinks = [
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'leader'] },
]

// ======================================================================================
// SIDEBAR ITEM COMPONENT
// ======================================================================================
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
        flex items-center p-3 my-1 rounded-lg transition-colors
        ${isActive
          ? 'bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800 dark:from-indigo-800 dark:to-indigo-900 dark:text-white'
          : 'hover:bg-indigo-50 text-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
    >
      <Icon className="w-6 h-6" />
      <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>{label}</span>
    </Link>
  )
}

// ======================================================================================
// MAIN SIDEBAR COMPONENT
// ======================================================================================
export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!user) return null

  const filteredNavLinks = navLinks.filter(link => link.roles.includes(user.role))
  const filteredSettingsLinks = settingsLinks.filter(link => link.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside
      className={`
        max-h-screen sticky top-0 overflow-y-auto flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}
      `}
    >
      {/* Collapse Button */}
      <div className="p-4 pb-2 flex justify-end">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 mt-2">
        {filteredNavLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={isExpanded} />
        ))}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {filteredSettingsLinks.map(link => (
          <SidebarItem key={link.href} {...link} isExpanded={isExpanded} />
        ))}
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center p-3 my-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-700 text-red-600 dark:text-red-300 transition-colors"
        >
          <ClipboardCheck className="w-6 h-6 rotate-180" />
          <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>Logout</span>
        </button>
      </div>
    </aside>
  )
}
