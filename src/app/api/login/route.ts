// app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    console.log('Login attempt for username:', username);

    // Find user by username
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, department_id, password')
      .eq('username', username)
      .single();

    console.log('User found:', userProfile ? 'YES' : 'NO');
    console.log('Profile error:', profileError);

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // For now, let's do simple password comparison (NOT SECURE - just for testing)
    // In production, use bcrypt
    const isValidPassword = userProfile.password === password;
    
    console.log('Password match:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userProfile;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}