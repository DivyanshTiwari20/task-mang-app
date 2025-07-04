import './globals.css'
import { SidebarProvider } from '@/components/ui/sidebar' // Import only the provider if needed
import AppSidebar from "@/components/Sidebar"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import ConditionalLayout from '@/components/ConditionalLayout'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Askus studios',
  description: 'Manage your tasks efficiently',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
           <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
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
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
