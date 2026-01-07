// src/components/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Briefcase,
  Wallet,
  User,
  Settings,
  LogOut,
  CheckSquare,
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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from './ModeToggle'
import Image from 'next/image'

const navLinks = [
  { href: '/admin-dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/leader-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['leader'] },
  { href: '/employee-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee'] },
  { href: '/pages/employee-detail-list', label: 'Employee List', icon: Users, roles: ['admin', 'leader'] },
  { href: '/pages/leave-approve', label: 'Leave Approval', icon: ClipboardCheck, roles: ['admin', 'leader', 'employee'] },
  { href: '/finance', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/pages/admin-leader', label: 'Task', icon: Briefcase, roles: ['admin', 'leader', 'employee'] },
  { href: '/pages/my-tasks', label: 'My Tasks', icon: CheckSquare, roles: ['admin', 'leader', 'employee'] },
]

const settingsLinks = [
  { href: '/pages/settings', label: 'Settings', icon: Settings, roles: ['admin', 'leader', 'employee'] },
]

interface SidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
  onClick?: () => void
}

function SidebarItem({ href, label, icon: Icon, isActive, onClick }: SidebarItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href} onClick={onClick}>
          <Icon className='w-8 h-8' />
          <span className='text-base'>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function AppSidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Responsive: open sidebar by default on desktop, closed on mobile
  useEffect(() => {
    // Only run on client
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 768) {
          setOpen(false)
        } else {
          setOpen(true)
        }
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false)
    }
  }, [pathname])

  if (!user) return null

  const filteredNavLinks = navLinks.filter(link => link.roles.includes(user.role))
  const filteredSettingsLinks = settingsLinks.filter(link => link.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Function to close sidebar on mobile
  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false)
    }
  }

  // Profile link path
  const profileHref = `/pages/profile/${user.id}`

  return (
    <>
      {/* Mobile: fixed topbar with toggle button */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-background border-b z-30 fixed top-0 left-0 right-0 h-14">
        <div className="flex items-center gap-2">
          <Image src='/logo.png' alt='Logo' width={40} height={40} className="mr-2" />
          <span className="font-bold text-lg">Dashboard</span>
        </div>
        <SidebarTrigger
          aria-label="Open sidebar"
          className="md:hidden"
          onClick={() => setOpen(true)}
        />
      </div>
      {/* Sidebar overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Sidebar overlay"
        />
      )}
      <Sidebar
        className={`
          fixed z-50 top-0 left-0 h-screen w-64 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:w-64
          md:h-screen
          bg-background border-r
          flex flex-col
        `}
      >
        {/* SidebarTrigger for desktop (collapse/expand if needed) */}
        <SidebarTrigger
          className="hidden md:block absolute top-4 right-[-18px] z-20"
          aria-label="Toggle sidebar"
          onClick={() => setOpen(o => !o)}
        />
        <SidebarContent className="flex-1 flex flex-col">
          {/* Navigation Links */}
          <SidebarGroup>
            <div className="flex items-center m-1 mb-4">
              <Image src='/logo.png' alt='Logo' width={100} height={100} />
            </div>
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
                    onClick={closeSidebarOnMobile}
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
                      onClick={closeSidebarOnMobile}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <ModeToggle />
        {/* Profile and Logout Button */}
        <SidebarFooter>
          <SidebarMenu>
            {/* Profile link at the bottom */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === profileHref}>
                <Link href={profileHref} className="flex items-center gap-2" onClick={closeSidebarOnMobile}>
                  <User />
                  <span className='text-base'>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span className='text-base'>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      {/* Add padding to dashboard pages for mobile topbar */}
      <div className="md:hidden h-14" />
    </>
  )
}