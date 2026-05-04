// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { Transaction, ApiResponse, PaginatedResponse } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
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
      .from(DB_TABLES.TRANSACTIONS)
      .select('*', { count: 'exact' })
      .eq('company_id', company_id);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
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
            message: 'Failed to fetch transactions',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Transaction[],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as PaginatedResponse<Transaction>,
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
      user_id,
      company_id,
      type,
      amount,
      currency,
      description,
      stripe_transaction_id,
    } = body;

    if (!user_id || !company_id || !type || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'user_id, company_id, type, and amount are required',
            code: 'VALIDATION_ERROR',
          },
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .insert({
        user_id,
        company_id,
        type,
        amount,
        currency: currency || 'USD',
        description,
        stripe_transaction_id,
        status: 'pending',
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
            message: 'Failed to create transaction',
            code: 'DATABASE_ERROR',
          },
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: data as Transaction,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: generateRequestId(),
        },
      } as ApiResponse<Transaction>,
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
