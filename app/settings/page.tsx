// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface CompanySettings {
  id: string;
  name: string;
  website?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface UserSettings {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  phone?: string;
  preferences?: {
    notifications_email: boolean;
    notifications_sms: boolean;
    dark_mode: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'user' | 'billing'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: '',
    name: '',
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: '',
    email: '',
    name: '',
    role: 'user',
    preferences: {
      notifications_email: true,
      notifications_sms: false,
      dark_mode: false,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      // In a real app, these would be separate API calls
      // For now, we'll just set default values
      setCompanySettings({
        id: 'comp_1',
        name: 'AACG Platform',
        website: 'https://aacg.example.com',
        email: 'hello@aacg.com',
        phone: '+1 (555) 123-4567',
        address: '123 Construction Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      });

      setUserSettings({
        id: 'user_1',
        email: 'scott@aacg.com',
        name: 'Scott Goldrusher',
        role: 'admin',
        phone: '+1 (555) 987-6543',
        preferences: {
          notifications_email: true,
          notifications_sms: false,
          dark_mode: false,
        },
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCompanySave() {
    setSaving(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companySettings),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Company settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save company settings' });
      }
    } catch (error) {
      console.error('Failed to save company settings:', error);
      setMessage({ type: 'error', text: 'Failed to save company settings' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUserSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'User settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save user settings' });
      }
    } catch (error) {
      console.error('Failed to save user settings:', error);
      setMessage({ type: 'error', text: 'Failed to save user settings' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="text-blue-600" size={32} />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and organization settings
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Organization
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'user'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Account
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'billing'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Billing
        </button>
      </div>

      {/* Company Settings Tab */}
      {activeTab === 'company' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Organization Settings</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              type="text"
              value={companySettings.name}
              onChange={(e) =>
                setCompanySettings({ ...companySettings, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              value={companySettings.website || ''}
              onChange={(e) =>
                setCompanySettings({ ...companySettings, website: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={companySettings.email || ''}
              onChange={(e) =>
                setCompanySettings({ ...companySettings, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={companySettings.phone || ''}
              onChange={(e) =>
                setCompanySettings({ ...companySettings, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={companySettings.address || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={companySettings.city || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                value={companySettings.state || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ZIP</label>
              <input
                type="text"
                value={companySettings.zip || ''}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, zip: e.target.value })
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background"
              />
            </div>
          </div>

          <button
            onClick={handleCompanySave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* User Settings Tab */}
      {activeTab === 'user' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Account Settings</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={userSettings.name}
              onChange={(e) =>
                setUserSettings({ ...userSettings, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={userSettings.email}
              disabled
              className="w-full px-3 py-2 border border-input rounded-lg bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={userSettings.phone || ''}
              onChange={(e) =>
                setUserSettings({ ...userSettings, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={userSettings.role}
              disabled
              className="w-full px-3 py-2 border border-input rounded-lg bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">Contact an admin to change your role</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Preferences</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.preferences?.notifications_email || false}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    preferences: {
                      ...userSettings.preferences,
                      notifications_email: e.target.checked,
                    } as any,
                  })
                }
                className="w-4 h-4 rounded border border-input"
              />
              <span className="text-sm">Email Notifications</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.preferences?.notifications_sms || false}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    preferences: {
                      ...userSettings.preferences,
                      notifications_sms: e.target.checked,
                    } as any,
                  })
                }
                className="w-4 h-4 rounded border border-input"
              />
              <span className="text-sm">SMS Notifications</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.preferences?.dark_mode || false}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    preferences: {
                      ...userSettings.preferences,
                      dark_mode: e.target.checked,
                    } as any,
                  })
                }
                className="w-4 h-4 rounded border border-input"
              />
              <span className="text-sm">Dark Mode</span>
            </label>
          </div>

          <button
            onClick={handleUserSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-border shadow-sm space-y-4">
          <h2 className="text-xl font-bold">Billing & Subscription</h2>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Plan</h3>
            <p className="text-blue-700 dark:text-blue-300">Professional Plan</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">$99/month • Renews on May 29, 2026</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Plan Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Unlimited projects
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                AI photo analysis (up to 1000/month)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Mechanics lien tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Team collaboration (up to 10 users)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Priority email support
              </li>
            </ul>
          </div>

          <button className="px-4 py-2 border border-input rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
            Manage Subscription
          </button>
        </div>
      )}
    </div>
  );
}
