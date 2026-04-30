// app/photo-analysis/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Image, Plus, Upload, Loader } from 'lucide-react';

interface PhotoAnalysis {
  id: string;
  photo_url: string;
  analysis_type: 'damage' | 'progress' | 'compliance' | 'safety';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_results?: {
    confidence_score: number;
    detected_items: Array<{ label: string; confidence: number }>;
    warnings: string[];
    suggestions: string[];
  };
  created_at: string;
  completed_at?: string;
}

export default function PhotoAnalysisPage() {
  const [analyses, setAnalyses] = useState<PhotoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analysisType, setAnalysisType] = useState<
    'damage' | 'progress' | 'compliance' | 'safety'
  >('progress');
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  async function fetchAnalyses() {
    setLoading(true);
    try {
      const response = await fetch('/api/photo-analysis?page=1&limit=20');
      const result = await response.json();

      if (result.success) {
        setAnalyses(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoUrl.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/photo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: photoUrl,
          analysis_type: analysisType,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalyses([result.data, ...analyses]);
        setPhotoUrl('');
        // Poll for results
        pollForUpdates(result.data.id);
      }
    } catch (error) {
      console.error('Failed to submit analysis:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function pollForUpdates(analysisId: string) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/photo-analysis?analysis_id=${analysisId}`
        );
        const result = await response.json();

        if (result.data?.status === 'completed') {
          setAnalyses((prev) =>
            prev.map((a) =>
              a.id === analysisId ? { ...a, ...result.data } : a
            )
          );
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to poll:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Image className="text-blue-600" size={32} />
            Photo Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of construction photos
          </p>
        </div>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm space-y-4"
      >
        <h2 className="text-lg font-bold">Submit Photo for Analysis</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            Photo URL or File Upload
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-3 py-2 border border-input rounded-lg bg-background"
            />
            <button
              type="button"
              className="px-4 py-2 border border-input rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Upload size={18} />
              Upload
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Analysis Type
          </label>
          <select
            value={analysisType}
            onChange={(e) =>
              setAnalysisType(
                e.target.value as
                  | 'damage'
                  | 'progress'
                  | 'compliance'
                  | 'safety'
              )
            }
            className="w-full px-3 py-2 border border-input rounded-lg bg-background"
          >
            <option value="progress">Progress Detection</option>
            <option value="damage">Damage Assessment</option>
            <option value="compliance">Compliance Check</option>
            <option value="safety">Safety Inspection</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || !photoUrl.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader size={18} className="animate-spin" />}
          {submitting ? 'Analyzing...' : 'Submit for Analysis'}
        </button>
      </form>

      {/* Analyses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            Loading analyses...
          </div>
        ) : analyses.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">
            No analyses yet. Submit a photo to get started.
          </div>
        ) : (
          analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold capitalize">
                    {analysis.analysis_type}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    statusColors[analysis.status]
                  }`}
                >
                  {analysis.status}
                </span>
              </div>

              {/* Thumbnail or Placeholder */}
              <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded mb-3 flex items-center justify-center overflow-hidden">
                {analysis.photo_url ? (
                  <img
                    src={analysis.photo_url}
                    alt="Analysis"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image size={48} className="text-muted-foreground" />
                )}
              </div>

              {/* Results */}
              {analysis.status === 'completed' && analysis.ai_results && (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold">
                      Confidence:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {(analysis.ai_results.confidence_score * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>

                  {analysis.ai_results.detected_items.length > 0 && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">
                        Detected Items:
                      </p>
                      <ul className="space-y-1">
                        {analysis.ai_results.detected_items.map((item, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {item.label} ({(item.confidence * 100).toFixed(0)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.ai_results.warnings.length > 0 && (
                    <div>
                      <p className="font-semibold text-red-600 dark:text-red-400">
                        Warnings:
                      </p>
                      {analysis.ai_results.warnings.map((w, idx) => (
                        <p key={idx} className="text-red-600 dark:text-red-400 text-xs">
                          ⚠️ {w}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {analysis.status === 'processing' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader size={16} className="animate-spin" />
                  Processing...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
