import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[assign-task] payload →', body);

    // ⚠️ Be sure your table is actually named "tasks"!
    const { data, error } = await supabase
      .from('tasks')
      .insert([body]);

    if (error) {
      console.error('[assign-task] supabase error →', error);
      return NextResponse.json(
        { message: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Task assigned successfully!' },
      { status: 200 }
    );

  } catch (err) {
    console.error('[assign-task] unexpected error →', err);
    return NextResponse.json(
      { message: (err as Error).message || 'Unknown server error' },
      { status: 500 }
    );
  }
}
