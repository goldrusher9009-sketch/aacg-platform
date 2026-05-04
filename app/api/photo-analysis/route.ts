// app/api/photo-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, DB_TABLES } from '@/lib/supabase-client';
import { PhotoService } from '@/lib/services/photo-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const analysisId = searchParams.get('analysis_id');
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    // If specific analysis_id requested, return single record
    if (analysisId) {
      const analysis = await PhotoService.getAnalysis(analysisId);
      if (!analysis) {
        return NextResponse.json(
          { success: false, error: 'Analysis not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: analysis,
      });
    }

    const offset = (page - 1) * limit;

    let query = supabaseAdmin.from(DB_TABLES.PHOTO_ANALYSIS).select('*', {
      count: 'exact',
    });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (status) {
      query = query.eq('status', status);
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
    console.error('Get photo analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photo_url, analysis_type, project_id } = body;

    // Validate required fields
    if (!photo_url || !analysis_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analysis = await PhotoService.submitPhotoAnalysis(
      project_id || 'default',
      {
        photoUrl: photo_url,
        analysisType: analysis_type as 'damage' | 'progress' | 'compliance' | 'safety',
      }
    );

    // Simulate async processing - in production, this would trigger a background job
    // For demo purposes, we'll schedule a status update after a short delay
    scheduleAnalysisProcessing(analysis.id);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Submit photo analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit analysis' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const body = await request.json();
    const { status, results } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const analysis = await PhotoService.updateAnalysisStatus(
      id,
      status as 'pending' | 'processing' | 'completed' | 'failed',
      results
    );

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Update photo analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update analysis' },
      { status: 500 }
    );
  }
}

// Simulate async processing (in production, use Bull, RabbitMQ, or similar)
function scheduleAnalysisProcessing(analysisId: string) {
  // Update to processing status after 1 second
  setTimeout(async () => {
    try {
      await PhotoService.updateAnalysisStatus(analysisId, 'processing');

      // Simulate AI processing delay - update to completed after 5 seconds
      setTimeout(async () => {
        try {
          const mockResults = {
            confidence_score: Math.random() * 0.4 + 0.6, // 60-100% confidence
            detected_items: [
              { label: 'Foundation crack', confidence: Math.random() * 0.3 + 0.7 },
              { label: 'Concrete damage', confidence: Math.random() * 0.3 + 0.6 },
              { label: 'Rebar exposure', confidence: Math.random() * 0.3 + 0.5 },
            ],
            warnings: [
              'Potential structural issue detected',
              'Recommend professional inspection',
            ],
            suggestions: [
              'Schedule contractor assessment',
              'Document damage with additional photos',
              'File insurance claim if applicable',
            ],
          };

          await PhotoService.updateAnalysisStatus(
            analysisId,
            'completed',
            mockResults
          );
        } catch (error) {
          console.error('Failed to complete analysis:', error);
          await PhotoService.updateAnalysisStatus(analysisId, 'failed');
        }
      }, 5000);
    } catch (error) {
      console.error('Failed to update analysis status:', error);
    }
  }, 1000);
}
