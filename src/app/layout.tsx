import './globals.css'
import { SidebarProvider } from '@/components/ui/sidebar' // Import only the provider if needed
import AppSidebar from "@/components/Sidebar"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import ConditionalLayout from '@/components/ConditionalLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Task App',
  description: 'Manage your tasks efficiently',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full bg-background">
              <AppSidebar />
              <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
