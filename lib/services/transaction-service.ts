// lib/services/transaction-service.ts
import { supabaseAdmin } from '@/lib/supabase-client';
import { DB_TABLES } from '@/lib/supabase-client';
import { Transaction } from '@/lib/types';

export class TransactionService {
  static async createTransaction(
    userId: string,
    companyId: string,
    data: {
      type: 'payment' | 'refund' | 'adjustment';
      amount: number;
      currency?: string;
      description?: string;
      stripeTransactionId?: string;
    }
  ): Promise<Transaction> {
    const { data: transaction, error } = await supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .insert({
        user_id: userId,
        company_id: companyId,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'USD',
        description: data.description,
        stripe_transaction_id: data.stripeTransactionId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return transaction as Transaction;
  }

  static async updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<Transaction> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return data as Transaction;
  }

  static async getTransaction(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      return null;
    }

    return data as Transaction;
  }

  static async getTransactionsByCompany(
    companyId: string,
    status?: string,
    type?: string,
    limit: number = 100
  ): Promise<Transaction[]> {
    let query = supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .select('*')
      .eq('company_id', companyId);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }

    return (data || []) as Transaction[];
  }

  static async getTransactionsByUser(
    userId: string,
    limit: number = 50
  ): Promise<Transaction[]> {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }

    return (data || []) as Transaction[];
  }

  static async getCompanyRevenue(
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    transactionCount: number;
  }> {
    let query = supabaseAdmin
      .from(DB_TABLES.TRANSACTIONS)
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'completed');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch revenue:', error);
      return {
        total: 0,
        byType: {},
        transactionCount: 0,
      };
    }

    const transactions = (data || []) as Transaction[];
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    const byType = transactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      byType,
      transactionCount: transactions.length,
    };
  }

  static calculateTransactionStats(transactions: Transaction[]) {
    const total = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;

    const byStatus = transactions.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byType = transactions.reduce(
      (acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      totalAmount,
      avgAmount,
      byStatus,
      byType,
    };
  }
}
