// lib/services/photo-service.ts
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { PhotoAnalysis } from '@/lib/types';

export class PhotoService {
  static async submitPhotoAnalysis(
    projectId: string,
    data: {
      photoUrl: string;
      analysisType: 'damage' | 'progress' | 'compliance' | 'safety';
    }
  ): Promise<PhotoAnalysis> {
    const analysisId = this.generateAnalysisId();

    const { data: analysis, error } = await supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .insert({
        id: analysisId,
        project_id: projectId,
        photo_url: data.photoUrl,
        analysis_type: data.analysisType,
        status: 'pending',
        ai_results: {
          detected_items: [],
          confidence_score: 0,
          warnings: [],
          suggestions: [],
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit analysis: ${error.message}`);
    }

    return analysis as PhotoAnalysis;
  }

  static async updateAnalysisStatus(
    analysisId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    results?: Record<string, any>
  ): Promise<PhotoAnalysis> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' && results) {
      updateData.ai_results = results;
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .update(updateData)
      .eq('id', analysisId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update analysis: ${error.message}`);
    }

    return data as PhotoAnalysis;
  }

  static async getAnalysis(analysisId: string): Promise<PhotoAnalysis | null> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) {
      return null;
    }

    return data as PhotoAnalysis;
  }

  static async getAnalysesByProject(
    projectId: string,
    analysisType?: string,
    limit: number = 50
  ): Promise<PhotoAnalysis[]> {
    let query = supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .select('*')
      .eq('project_id', projectId);

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch analyses:', error);
      return [];
    }

    return (data || []) as PhotoAnalysis[];
  }

  static async getPendingAnalyses(limit: number = 100): Promise<PhotoAnalysis[]> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch pending analyses:', error);
      return [];
    }

    return (data || []) as PhotoAnalysis[];
  }

  static async getAnalysisStats(projectId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgConfidenceScore: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.PHOTO_ANALYSIS)
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Failed to fetch analyses:', error);
      return {
        total: 0,
        byType: {},
        byStatus: {},
        avgConfidenceScore: 0,
      };
    }

    const analyses = (data || []) as PhotoAnalysis[];
    const byType = analyses.reduce(
      (acc, a) => {
        acc[a.analysis_type] = (acc[a.analysis_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = analyses.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const confidenceScores = analyses
      .map((a) => a.ai_results?.confidence_score || 0)
      .filter((score) => score > 0);

    const avgConfidenceScore =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    return {
      total: analyses.length,
      byType,
      byStatus,
      avgConfidenceScore,
    };
  }

  static extractConfidenceScore(aiResults: Record<string, any>): number {
    return aiResults?.confidence_score || 0;
  }

  static extractDetectedItems(aiResults: Record<string, any>): any[] {
    return aiResults?.detected_items || [];
  }

  static extractWarnings(aiResults: Record<string, any>): string[] {
    return aiResults?.warnings || [];
  }

  static extractSuggestions(aiResults: Record<string, any>): string[] {
    return aiResults?.suggestions || [];
  }

  private static generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
