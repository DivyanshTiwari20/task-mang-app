// app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt for username:', username);

    // Find user by username (case-insensitive)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, department_id, department_name, salary, leave_taken, password')
      .ilike('username', username)
      .single();

    console.log('Database query completed');
    console.log('User found:', userProfile ? 'YES' : 'NO');

    if (profileError) {
      console.error('Supabase error:', profileError.message, profileError.code);

      // Check if it's a "no rows" error
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: `User "${username}" not found. Please check your username.` },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Database error: ' + profileError.message },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: `User "${username}" not found` },
        { status: 401 }
      );
    }

    // Simple password comparison (NOT SECURE - for development only)
    // In production, use bcrypt.compare()
    const isValidPassword = userProfile.password === password;

    console.log('Password match:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Remove password from response and ensure all needed fields are included
    const { password: _, ...userWithoutPassword } = userProfile;

    // Ensure default values for optional fields
    const safeUser = {
      ...userWithoutPassword,
      salary: userWithoutPassword.salary || 0,
      leave_taken: userWithoutPassword.leave_taken || 0,
      department_name: userWithoutPassword.department_name || null,
    };

    console.log('Login successful for user:', safeUser.username);

    return NextResponse.json({
      success: true,
      user: safeUser,
    });

  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
