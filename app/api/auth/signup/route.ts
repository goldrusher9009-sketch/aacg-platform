// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_id } = await request.json();

    // Validate input
    if (!email || !password || !name || !company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, name, and company_id are required',
        },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered',
        },
        { status: 409 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUpWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: authError.message || 'Failed to create account',
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User creation failed',
        },
        { status: 500 }
      );
    }

    // Create user record in database
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        company_id,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to complete registration',
        },
        { status: 500 }
      );
    }

    // Sign in the user immediately
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account created but auto-login failed. Please log in.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        token: sessionData.session.access_token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          company_id: userRecord.company_id,
          role: userRecord.role,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
