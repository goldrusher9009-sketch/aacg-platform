// app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { Company } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (company_id) {
      const { data, error } = await supabaseAdmin
        .from(DB_TABLES.COMPANIES)
        .select('*')
        .eq('id', company_id)
        .single();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Company not found',
              code: 'NOT_FOUND',
            },
          } as ApiResponse<null>,
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: data as Company,
          meta: {
            timestamp: new Date().toISOString(),
            request_id: generateRequestId(),
          },
        } as ApiResponse<Company>,
        { status: 200 }
      );
    }

    const { data, error, count } = await supabaseAdmin
      .from(DB_TABLES.COMPANIES)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to fetch companies',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Company[],
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
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
    const { name, description, website, logo_url } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'name is required',
            code: 'VALIDATION_ERROR',
          },
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.COMPANIES)
      .insert({
        name,
        description,
        website,
        logo_url,
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
            message: 'Failed to create company',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Company,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as ApiResponse<Company>,
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
