// app/api/debug/route.ts
// DEBUG ONLY - Remove in production

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        console.log('=== DEBUG: Testing Supabase Connection ===');
        console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        console.log('PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

        // Test 1: Try to count users
        const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        console.log('User count result:', count, countError?.message);

        // Test 2: Try to get all users (without password)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .limit(10);

        console.log('Users found:', users?.length || 0);
        console.log('Users data:', users);
        console.log('Users error:', usersError?.message);

        // Test 3: Try to find 'divyansh' specifically
        const { data: divyansh, error: divyanshError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .ilike('username', 'divyansh')
            .single();

        console.log('Divyansh found:', divyansh);
        console.log('Divyansh error:', divyanshError?.message);

        return NextResponse.json({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
            userCount: count,
            countError: countError?.message || null,
            users: users || [],
            usersError: usersError?.message || null,
            divyanshFound: !!divyansh,
            divyansh: divyansh,
            divyanshError: divyanshError?.message || null,
        });

    } catch (error: any) {
        console.error('Debug API Error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
