// src/components/Sidebar.tsx
'use client'

import React from 'react'
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
 
  { href: '/pages/admin-leader', label: 'Task', icon: Briefcase, roles: [ 'admin','leader','employee'] },
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

  // Profile link path
  const profileHref = `/pages/profile/${user.id}`

  return (
    <Sidebar>
      {/* SidebarTrigger button from shadcn sidebar */}
      <SidebarTrigger className="absolute top-4 right-[-18px] z-20" aria-label="Toggle sidebar" />
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
      {/* Profile and Logout Button */}
      <SidebarFooter>
        <SidebarMenu>
          {/* Profile link at the bottom */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === profileHref}>
              <Link href={profileHref} className="flex items-center gap-2">
                <User />
                <span className='text-base'>Profile</span>
                {/* Optionally show user name/email */}
                {/* <span className="ml-2 text-xs text-muted-foreground">{user.full_name || user.username}</span> */}
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
  )
}