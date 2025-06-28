// app/api/employee/upload-avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Try different possible field names for the file
    const file = formData.get('avatar') as File || 
                 formData.get('file') as File || 
                 formData.get('image') as File ||
                 formData.get('profile_image') as File
                 formData.get('employee-avatars') as File
    
    const userId = formData.get('userId') as string || 
                   formData.get('id') as string

    // Debug: Log all form data keys
    console.log('FormData keys:', Array.from(formData.keys()))
    console.log('FormData values:', Array.from(formData.entries()))
    console.log('Upload request - userId:', userId, 'file:', file?.name, 'file type:', file?.type)

    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided',
        receivedKeys: Array.from(formData.keys()),
        help: 'Make sure to send the file with key: avatar, file, image, or profile_image'
      }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        receivedKeys: Array.from(formData.keys()),
        help: 'Make sure to send userId or id in the form data'
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `avatar-${userId}-${Date.now()}.${fileExtension}`
    const filePath = `avatars/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('employee-avatars') // Make sure this bucket exists in Supabase
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('employee-avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Update employee record with new avatar URL
    const { data: updateData, error: updateError } = await supabase
      .from('users') // Changed from 'employees' to 'users'
      .update({ profile_image: publicUrl })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      url: publicUrl,
      profile: updateData
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}