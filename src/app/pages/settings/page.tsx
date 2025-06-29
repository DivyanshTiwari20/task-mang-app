'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Building,
  Calendar,
  Shield,
  DollarSign,
  Key
} from 'lucide-react'
import UpdatePasswordModal from '@/components/UpdatePasswordModal'

interface EmployeeProfile {
  id: string
  fullname: string
  email: string
  phone: string
  address: string
  profile_image: string
  gender: 'male' | 'female' | 'other'
  // Admin-only fields (read-only for users)
  employee_id?: string
  department?: string
  position?: string
  manager?: string
  join_date?: string
  salary?: number
}

export default function EmployeeProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<EmployeeProfile>({
    id: user?.id || '',
    fullname: '',
    email: user?.email || '',
    phone: '',
    address: '',
    profile_image: '',
    gender: 'male'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  // Load profile data on component mount
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/employee/profile/${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultAvatar = (gender: string) => {
    switch (gender) {
      case 'female':
        return '/avatars/female-default.png'
      case 'male':
        return '/avatars/male-default.png'
      default:
        return '/avatars/default-avatar.png'
    }
  }

  const handleInputChange = (field: keyof EmployeeProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    if (message) setMessage(null)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 2MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.id || '')

      const response = await fetch('/api/employee/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => ({ ...prev, profile_image: data.imageUrl }))
        setHasChanges(true)
        setMessage({ type: 'success', text: 'Profile picture updated!' })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          fullname: profile.fullname,
          phone: profile.phone,
          address: profile.address,
          gender: profile.gender,
          profile_image: profile.profile_image
        })
      })

      if (response.ok) {
        setHasChanges(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Employee Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and profile settings</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' 
              : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-border mx-auto mb-4">
                    <img
                      src={profile.profile_image || getDefaultAvatar(profile.gender)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <label className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-2">
                  Click the camera icon to update your photo
                  <br />
                  Max size: 2MB
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Personal and Work Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Editable Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profile.fullname}
                      onChange={(e) => handleInputChange('fullname', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Gender
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    placeholder="Email cannot be changed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email address cannot be modified</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
                    placeholder="Enter your full address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Work Information (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Work Information
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full ml-auto">
                    Read Only
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={profile.employee_id || 'Not assigned'}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profile.department || 'Not assigned'}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={profile.position || 'Not assigned'}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Manager
                    </label>
                    <input
                      type="text"
                      value={profile.manager || 'Not assigned'}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Join Date
                    </label>
                    <input
                      type="text"
                      value={profile.join_date ? new Date(profile.join_date).toLocaleDateString() : 'Not set'}
                      disabled
                      className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800/30">
                  <p className="text-sm text-blue-800 dark:text-blue-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Work information is managed by your administrator and cannot be modified.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Changes and Update Password Section */}
        <div className="mt-8">
          {/* Save Changes Section */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                hasChanges && !saving
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6">
            <div className="border-t border-border"></div>
          </div>

          {/* Update Password Section */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-border/80 shadow-sm hover:shadow-md"
            >
              <Key className="w-5 h-5" />
              Update Password
            </button>
          </div>

          {/* Update Password Modal */}
          <UpdatePasswordModal 
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
          />
        </div>
      </div>
    </div>
  )
}
