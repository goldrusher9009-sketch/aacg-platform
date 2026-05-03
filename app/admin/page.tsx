'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, TrendingUp, AlertCircle, CheckCircle2, Zap,
  Droplet, Home, Wind, Wrench, UtensilsCrossed, Briefcase,
  HardHat, MoreVertical, Download, RefreshCw, Filter
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  completedProjects: number;
  pendingActions: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

interface VerticalMetrics {
  verticalId: string;
  name: string;
  activeCompanies: number;
  projects: number;
  revenue: number;
  growth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingActions: 0,
    revenueThisMonth: 0,
    revenueGrowth: 0
  });

  const [verticals, setVerticals] = useState<VerticalMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats from backend
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch verticals
      const verticalsRes = await fetch('/api/verticals');
      const verticalsData = await verticalsRes.json();

      // Transform verticals data
      if (verticalsData.verticals) {
        const verticalsList = Object.entries(verticalsData.verticals).map(([key, vertical]: any) => ({
          verticalId: key,
          name: vertical.name,
          activeCompanies: Math.floor(Math.random() * 50),
          projects: Math.floor(Math.random() * 100),
          revenue: Math.floor(Math.random() * 100000),
          growth: Math.floor(Math.random() * 30) - 10
        }));
        setVerticals(verticalsList);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Projects', value: stats.activeProjects, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Completed', value: stats.completedProjects, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Pending', value: stats.pendingActions, icon: AlertCircle, color: 'bg-yellow-500' }
  ];

  const chartData = [
    { month: 'Jan', revenue: 40000 },
    { month: 'Feb', revenue: 50000 },
    { month: 'Mar', revenue: 65000 },
    { month: 'Apr', revenue: 75000 },
    { month: 'May', revenue: 85000 },
    { month: 'Jun', revenue: stats.revenueThisMonth }
  ];

  const verticalIcons: { [key: string]: React.ReactNode } = {
    plumbing: <Droplet className="w-4 h-4" />,
    electric: <Zap className="w-4 h-4" />,
    roofing: <Home className="w-4 h-4" />,
    hvac: <Wind className="w-4 h-4" />,
    maintenance: <Wrench className="w-4 h-4" />,
    qsr: <UtensilsCrossed className="w-4 h-4" />,
    office: <Briefcase className="w-4 h-4" />,
    generalconstruction: <HardHat className="w-4 h-4" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-2">AACG Platform Management</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="bg-slate-700 border-slate-600">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-700 border-b border-slate-600">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="verticals" className="text-white data-[state=active]:bg-blue-600">Verticals</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-blue-600">Analytics</TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-blue-600">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid stroke="#4b5563" />
                      <XAxis stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #4b5563' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Vertical Distribution */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">Vertical Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={verticals.slice(0, 4)}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {verticals.map((_, idx) => (
                          <Cell key={idx} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #4b5563' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verticals Tab */}
          <TabsContent value="verticals" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">All Trade Verticals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verticals.map((vertical) => (
                    <div key={vertical.verticalId} className="flex items-center justify-between p-4 bg-slate-600 rounded-lg hover:bg-slate-500 transition">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-blue-400">
                          {verticalIcons[vertical.verticalId] || <HardHat className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{vertical.name}</h3>
                          <p className="text-slate-400 text-sm">{vertical.activeCompanies} companies • {vertical.projects} projects</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">${(vertical.revenue / 1000).toFixed(1)}K</p>
                        <p className={`text-sm ${vertical.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {vertical.growth >= 0 ? '+' : ''}{vertical.growth}%
                        </p>
                      </div>
                      <button className="ml-4 p-2 hover:bg-slate-700 rounded">
                        <MoreVertical className="w-5 h-5 text-slate-300" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={verticals}>
                    <CartesianGrid stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #4b5563' }} />
                    <Bar dataKey="projects" fill="#3b82f6" />
                    <Bar dataKey="activeCompanies" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">User management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
