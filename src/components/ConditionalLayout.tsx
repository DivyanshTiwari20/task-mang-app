// src/components/ConditionalLayout.tsx
'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { Navbar } from './Navbar'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const authRoutes = ['/login', '/register', '/signup']
  const isAuthRoute = authRoutes.includes(pathname)

  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {children}
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {children}
        </main>
      </div>
    </>
  )
}
