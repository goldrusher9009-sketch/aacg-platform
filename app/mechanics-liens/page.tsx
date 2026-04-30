// app/mechanics-liens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Filter, Trash2, CheckCircle } from 'lucide-react';

interface MechanicsLien {
  id: string;
  contractor_id: string;
  property_address: string;
  lien_amount: number;
  filing_date: string;
  status: 'draft' | 'filed' | 'satisfied' | 'expired' | 'disputed';
  created_at: string;
}

export default function MechanicsLiensPage() {
  const [liens, setLiens] = useState<MechanicsLien[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLiens();
  }, [filter]);

  async function fetchLiens() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '20');
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/mechanics-liens?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLiens(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch liens:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLien(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/mechanics-liens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_id: formData.get('contractor_id'),
          property_address: formData.get('property_address'),
          lien_amount: parseFloat(formData.get('lien_amount') as string),
          filing_date: formData.get('filing_date'),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLiens([result.data, ...liens]);
        setShowForm(false);
        e.currentTarget.reset();
      }
    } catch (error) {
      console.error('Failed to create lien:', error);
    }
  }

  async function handleDeleteLien(id: string) {
    try {
      const response = await fetch(`/api/mechanics-liens?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setLiens(liens.filter((lien) => lien.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete lien:', error);
    }
  }

  async function handleSatisfyLien(id: string) {
    try {
      const response = await fetch(`/api/mechanics-liens?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'satisfied' }),
      });

      const result = await response.json();
      if (result.success) {
        setLiens(liens.map((lien) => (lien.id === id ? result.data : lien)));
      }
    } catch (error) {
      console.error('Failed to satisfy lien:', error);
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    filed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    satisfied: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    disputed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="text-blue-600" size={32} />
            Mechanics Liens
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage mechanics liens across your projects
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <Plus size={20} />
          New Lien
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border">
        <Filter size={20} className="text-muted-foreground" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-800 border border-input rounded-lg text-sm"
        >
          <option value="all">All Liens</option>
          <option value="draft">Draft</option>
          <option value="filed">Filed</option>
          <option value="satisfied">Satisfied</option>
          <option value="expired">Expired</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm">
          <h2 className="text-xl font-bold mb-4">Create New Lien</h2>
          <form className="space-y-4" onSubmit={handleCreateLien}>
            <input
              type="text"
              name="contractor_id"
              placeholder="Contractor ID"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
            <input
              type="text"
              name="property_address"
              placeholder="Property Address"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
            <input
              type="number"
              name="lien_amount"
              placeholder="Lien Amount"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
            <input
              type="date"
              name="filing_date"
              required
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Lien
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-input rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liens Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading liens...
          </div>
        ) : liens.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No liens found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Contractor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Property
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Filed
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {liens.map((lien) => (
                  <tr
                    key={lien.id}
                    className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-6 py-3 text-sm font-medium">
                      {lien.contractor_id}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {lien.property_address}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-right">
                      ${lien.lien_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          statusColors[lien.status]
                        }`}
                      >
                        {lien.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {new Date(lien.filing_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleSatisfyLien(lien.id)}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                        title="Mark as satisfied"
                      >
                        <CheckCircle size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteLien(lien.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                        title="Delete lien"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
