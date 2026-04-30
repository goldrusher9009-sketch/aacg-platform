// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { User, ApiResponse, PaginatedResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const role = searchParams.get('role');
    const user_id = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (user_id) {
      const { data, error } = await supabaseAdmin
        .from(DB_TABLES.USERS)
        .select('*')
        .eq('id', user_id)
        .single();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'User not found',
              code: 'NOT_FOUND',
            },
          } as ApiResponse<null>,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: data as User,
          meta: {
            timestamp: new Date().toISOString(),
            request_id: generateRequestId(),
          },
        } as ApiResponse<User>,
        { status: 200 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'company_id is required',
            code: 'MISSING_PARAMETER',
          },
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from(DB_TABLES.USERS)
      .select('*', { count: 'exact' })
      .eq('company_id', company_id);

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to fetch users',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as User[],
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit),
        },
      } as PaginatedResponse<User>,
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      company_id,
      role,
      avatar_url,
    } = body;

    if (!email || !name || !company_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'email, name, and company_id are required',
            code: 'VALIDATION_ERROR',
          },
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.USERS)
      .insert({
        email,
        name,
        company_id,
        role: role || 'user',
        avatar_url,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to create user',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as User,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as ApiResponse<User>,
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
