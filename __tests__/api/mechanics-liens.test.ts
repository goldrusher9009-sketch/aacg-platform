// __tests__/api/mechanics-liens.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Mechanics Liens API', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000/api';

  describe('GET /api/mechanics-liens', () => {
    it('should return paginated list of liens', async () => {
      const response = await fetch(`${baseUrl}/mechanics-liens?page=1&limit=20`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
    });

    it('should filter liens by status', async () => {
      const response = await fetch(
        `${baseUrl}/mechanics-liens?page=1&limit=20&status=filed`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      if (data.data.length > 0) {
        expect(data.data[0].status).toBe('filed');
      }
    });

    it('should filter liens by company_id', async () => {
      const response = await fetch(
        `${baseUrl}/mechanics-liens?page=1&limit=20&company_id=comp_1`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/mechanics-liens', () => {
    it('should create a new lien', async () => {
      const response = await fetch(`${baseUrl}/mechanics-liens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: 'CONT_001',
          property_address: '123 Main St, New York, NY 10001',
          lien_amount: 50000,
          filing_date: '2026-04-29',
          company_id: 'comp_1',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.status).toBe('draft');
      expect(data.data.lien_amount).toBe(50000);
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${baseUrl}/mechanics-liens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: 'CONT_001',
          // missing other required fields
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('PATCH /api/mechanics-liens', () => {
    it('should update lien status', async () => {
      // First create a lien
      const createResponse = await fetch(`${baseUrl}/mechanics-liens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: 'CONT_002',
          property_address: '456 Oak Ave, Boston, MA 02101',
          lien_amount: 75000,
          filing_date: '2026-04-29',
          company_id: 'comp_1',
        }),
      });

      const createData = await createResponse.json();
      const lienId = createData.data.id;

      // Then update its status
      const updateResponse = await fetch(
        `${baseUrl}/mechanics-liens?id=${lienId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'filed' }),
        }
      );

      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.status).toBe('filed');
    });
  });

  describe('DELETE /api/mechanics-liens', () => {
    it('should delete a lien', async () => {
      // First create a lien
      const createResponse = await fetch(`${baseUrl}/mechanics-liens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: 'CONT_003',
          property_address: '789 Pine Rd, Seattle, WA 98101',
          lien_amount: 60000,
          filing_date: '2026-04-29',
          company_id: 'comp_1',
        }),
      });

      const createData = await createResponse.json();
      const lienId = createData.data.id;

      // Then delete it
      const deleteResponse = await fetch(
        `${baseUrl}/mechanics-liens?id=${lienId}`,
        {
          method: 'DELETE',
        }
      );

      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
      expect(deleteData.data.id).toBe(lienId);
    });
  });
});
