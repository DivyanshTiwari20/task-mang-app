// src/app/page.tsx 
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import RoleBasedAlert from '@/components/RoleBasedAlert'

export default function Home() {  
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            router.push('/admin-dashboard')
            break
          case 'leader':
            router.push('/leader-dashboard')
            break
          case 'employee':
            router.push('/employee-dashboard')
            break
          default:
            router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
        {/* Show alert even during loading if user data is available */}
        {user && <RoleBasedAlert userRole={user.role} userName={user.full_name} />}
      </div>
    )
  }

  return (
    <>
      {/* Alert will show before redirect happens */}
      {user && <RoleBasedAlert userRole={user.role} userName={user.full_name} />}
    </>
  )
}