'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import UpdatePasswordModal from '@/components/UpdatePasswordModal' // Adjust path as needed

export default function SettingsPage() {
  const { user } = useAuth()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  const openPasswordModal = () => {
    setIsPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h2>
        
        {/* User Info Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-2">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Username:</span>
              <span className="ml-2 font-medium">{user?.username}</span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Full Name:</span>
              <span className="ml-2 font-medium">{user?.full_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="border-t pt-6">
          <h3 className="text-md font-medium text-gray-700 mb-4">Security</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button
              onClick={openPasswordModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Other settings sections can go here */}
        
      </div>

      {/* Update Password Modal */}
      <UpdatePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={closePasswordModal} 
      />
    </div>
  )
}