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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ModeToggle } from './ModeToggle'
import Image from 'next/image'

const navLinks = [
  { href: '/admin-dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/leader-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['leader'] },
  { href: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee'] },
  { href: '/pages/employeeList', label: 'Employee List', icon: Users, roles: ['admin', 'leader'] },
  { href: '/leave-approval', label: 'Leave Approval', icon: ClipboardCheck, roles: ['admin'] },
  { href: '/finance', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/pages/tasks', label: 'Task', icon: Briefcase, roles: ['employee'] },
  { href: '/pages/admin-leader', label: 'Task', icon: Briefcase, roles: ['employee', 'admin'] },
]

const settingsLinks = [
  { href: '/pages/settings', label: 'Settings', icon: Settings, roles: ['admin', 'leader', 'employee'] },
]

interface SidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
}

function SidebarItem({ href, label, icon: Icon, isActive }: SidebarItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href}>
          <Icon className='w-8 h-8' />
          <span className='text-base'>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
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
    <Sidebar>
      <SidebarContent>
        {/* Navigation Links */}
        <SidebarGroup>
          <Image src='/logo.png' alt='hi' width={100} height={100} className='flex items-center m-1 mb-4'></Image>
          {/* <SidebarGroupLabel>Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavLinks.map(link => (
                <SidebarItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={pathname === link.href}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Links */}
        {filteredSettingsLinks.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsLinks.map(link => (
                  <SidebarItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    isActive={pathname === link.href}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <ModeToggle />
      {/* Logout Button */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span className='text-base'>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}