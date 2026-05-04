// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
        },
        { status: 401 }
      );
    }

    // Fetch user details from users table
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, company_id, role, created_at')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load user profile',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        token: data.session.access_token,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          company_id: userProfile.company_id,
          role: userProfile.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
