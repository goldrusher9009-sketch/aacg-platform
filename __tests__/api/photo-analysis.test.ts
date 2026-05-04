// __tests__/api/photo-analysis.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Photo Analysis API', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000/api';

  describe('GET /api/photo-analysis', () => {
    it('should return paginated list of analyses', async () => {
      const response = await fetch(`${baseUrl}/photo-analysis?page=1&limit=20`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
    });

    it('should return single analysis by id', async () => {
      // First create an analysis
      const createResponse = await fetch(`${baseUrl}/photo-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: 'https://example.com/photo1.jpg',
          analysis_type: 'progress',
          project_id: 'proj_1',
        }),
      });

      const createData = await createResponse.json();
      const analysisId = createData.data.id;

      // Then fetch it specifically
      const getResponse = await fetch(
        `${baseUrl}/photo-analysis?analysis_id=${analysisId}`
      );
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data.id).toBe(analysisId);
    });

    it('should filter analyses by status', async () => {
      const response = await fetch(
        `${baseUrl}/photo-analysis?page=1&limit=20&status=completed`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      if (data.data.length > 0) {
        expect(data.data[0].status).toBe('completed');
      }
    });

    it('should filter analyses by project_id', async () => {
      const response = await fetch(
        `${baseUrl}/photo-analysis?page=1&limit=20&project_id=proj_1`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/photo-analysis', () => {
    it('should submit a new photo analysis', async () => {
      const response = await fetch(`${baseUrl}/photo-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: 'https://example.com/construction-photo.jpg',
          analysis_type: 'damage',
          project_id: 'proj_1',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.status).toBe('pending');
      expect(data.data.analysis_type).toBe('damage');
      expect(data.data.ai_results).toBeDefined();
    });

    it('should accept all analysis types', async () => {
      const types = ['damage', 'progress', 'compliance', 'safety'];

      for (const type of types) {
        const response = await fetch(`${baseUrl}/photo-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo_url: `https://example.com/${type}-photo.jpg`,
            analysis_type: type,
            project_id: 'proj_1',
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.analysis_type).toBe(type);
      }
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${baseUrl}/photo-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: 'https://example.com/photo.jpg',
          // missing analysis_type
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/photo-analysis', () => {
    it('should update analysis status with results', async () => {
      // Create an analysis
      const createResponse = await fetch(`${baseUrl}/photo-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: 'https://example.com/test-photo.jpg',
          analysis_type: 'progress',
          project_id: 'proj_1',
        }),
      });

      const createData = await createResponse.json();
      const analysisId = createData.data.id;

      // Update its status
      const updateResponse = await fetch(
        `${baseUrl}/photo-analysis?id=${analysisId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            results: {
              confidence_score: 0.92,
              detected_items: [
                { label: 'Concrete foundation', confidence: 0.98 },
                { label: 'Steel reinforcement', confidence: 0.87 },
              ],
              warnings: ['Potential crack detected'],
              suggestions: ['Schedule inspection'],
            },
          }),
        }
      );

      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.status).toBe('completed');
      expect(updateData.data.ai_results.confidence_score).toBe(0.92);
      expect(updateData.data.ai_results.detected_items.length).toBe(2);
    });

    it('should update status without results', async () => {
      // Create an analysis
      const createResponse = await fetch(`${baseUrl}/photo-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: 'https://example.com/processing-photo.jpg',
          analysis_type: 'compliance',
          project_id: 'proj_1',
        }),
      });

      const createData = await createResponse.json();
      const analysisId = createData.data.id;

      // Update to processing
      const updateResponse = await fetch(
        `${baseUrl}/photo-analysis?id=${analysisId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'processing',
          }),
        }
      );

      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.status).toBe('processing');
    });
  });
});
