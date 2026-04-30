// app/api/mechanics-liens/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, DB_TABLES } from '@/lib/supabase-client';
import { LienService } from '@/lib/services/lien-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const companyId = searchParams.get('company_id');

    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from(DB_TABLES.MECHANICS_LIENS).select('*', {
      count: 'exact',
    });

    if (status) {
      query = query.eq('status', status);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Get mechanics liens error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractor_id,
      property_address,
      lien_amount,
      filing_date,
      company_id,
    } = body;

    // Validate required fields
    if (!contractor_id || !property_address || !lien_amount || !filing_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const lien = await LienService.createLien({
      contractor_id,
      property_address,
      lien_amount: parseFloat(lien_amount),
      filing_date,
      company_id: company_id || 'default',
    });

    return NextResponse.json({
      success: true,
      data: lien,
    });
  } catch (error) {
    console.error('Create lien error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lien' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const lien = await LienService.updateLienStatus(
      id,
      status as 'draft' | 'filed' | 'satisfied' | 'expired' | 'disputed'
    );

    return NextResponse.json({
      success: true,
      data: lien,
    });
  } catch (error) {
    console.error('Update lien error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lien' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Delete lien error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lien' },
      { status: 500 }
    );
  }
}
