// lib/services/lien-service.ts
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { MechanicsLien } from '@/lib/types';

export class LienService {
  static async createLien(data: {
    contractor_id: string;
    property_address: string;
    lien_amount: number;
    filing_date: string;
    company_id?: string;
    expiration_date?: string;
    description?: string;
  }): Promise<MechanicsLien> {
    const lienId = this.generateLienId();

    const { data: lien, error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .insert({
        id: lienId,
        contractor_id: data.contractor_id,
        property_address: data.property_address,
        lien_amount: data.lien_amount,
        filing_date: data.filing_date,
        company_id: data.company_id || 'default',
        expiration_date: data.expiration_date,
        description: data.description,
        status: 'draft',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create lien: ${error.message}`);
    }

    return lien as MechanicsLien;
  }

  static async updateLienStatus(
    lienId: string,
    status: 'draft' | 'filed' | 'satisfied' | 'expired' | 'disputed'
  ): Promise<MechanicsLien> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lienId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lien: ${error.message}`);
    }

    return data as MechanicsLien;
  }

  static async fileLien(lienId: string): Promise<MechanicsLien> {
    return this.updateLienStatus(lienId, 'filed');
  }

  static async satisfyLien(lienId: string): Promise<MechanicsLien> {
    return this.updateLienStatus(lienId, 'satisfied');
  }

  static async getLien(lienId: string): Promise<MechanicsLien | null> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .select('*')
      .eq('id', lienId)
      .single();

    if (error) {
      return null;
    }

    return data as MechanicsLien;
  }

  static async getLiensByProject(
    projectId: string,
    limit: number = 50
  ): Promise<MechanicsLien[]> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch liens:', error);
      return [];
    }

    return (data || []) as MechanicsLien[];
  }

  static async getLiensByCompany(
    companyId: string,
    status?: string,
    limit: number = 100
  ): Promise<MechanicsLien[]> {
    let query = supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .select('*')
      .eq('company_id', companyId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch liens:', error);
      return [];
    }

    return (data || []) as MechanicsLien[];
  }

  static async checkLienExpiration(lienId: string): Promise<boolean> {
    const lien = await this.getLien(lienId);
    if (!lien || !lien.expiration_date) {
      return false;
    }

    const expirationDate = new Date(lien.expiration_date);
    const today = new Date();

    return today > expirationDate;
  }

  static async getExpiringLiens(
    companyId: string,
    daysUntilExpiration: number = 30
  ): Promise<MechanicsLien[]> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.MECHANICS_LIENS)
      .select('*')
      .eq('company_id', companyId)
      .not('expiration_date', 'is', null)
      .order('expiration_date', { ascending: true });

    if (error) {
      console.error('Failed to fetch liens:', error);
      return [];
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + daysUntilExpiration * 24 * 60 * 60 * 1000);

    return ((data || []) as MechanicsLien[]).filter((lien) => {
      if (!lien.expiration_date) return false;
      const expDate = new Date(lien.expiration_date);
      return expDate <= futureDate && expDate >= now;
    });
  }

  static calculateLienSummary(liens: MechanicsLien[]) {
    const total = liens.length;
    const totalAmount = liens.reduce((sum, lien) => sum + (lien.lien_amount || 0), 0);
    const byStatus = liens.reduce(
      (acc, lien) => {
        acc[lien.status] = (acc[lien.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      totalAmount,
      byStatus,
    };
  }

  private static generateLienId(): string {
    return `lien_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
