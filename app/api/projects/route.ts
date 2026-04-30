// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { Project, ApiResponse, PaginatedResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

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
      .from(DB_TABLES.PROJECTS)
      .select('*', { count: 'exact' })
      .eq('company_id', company_id);

    if (status) {
      query = query.eq('status', status);
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
            message: 'Failed to fetch projects',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Project[],
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit),
        },
      } as PaginatedResponse<Project>,
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
      company_id,
      name,
      description,
      location,
      start_date,
      end_date,
      budget,
      contractors,
    } = body;

    if (!company_id || !name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'company_id and name are required',
            code: 'VALIDATION_ERROR',
          },
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.PROJECTS)
      .insert({
        company_id,
        name,
        description,
        location,
        start_date,
        end_date,
        budget: budget || 0,
        spent: 0,
        contractors: contractors || [],
        status: 'active',
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
            message: 'Failed to create project',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Project,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as ApiResponse<Project>,
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
