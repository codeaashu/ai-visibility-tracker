'use client';

import { useEffect, useState } from 'react';
import { Brand, VisibilityMetrics } from '@/lib/types';
import { TrendingUp, Target, Activity, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#8b5cf6'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<VisibilityMetrics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, brandsRes] = await Promise.all([fetch('/api/analytics'), fetch('/api/brands')]);
      const metricsData = await metricsRes.json();
      const brandsData = await brandsRes.json();
      setMetrics(metricsData);
      setBrands(brandsData.brands || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Visibility metrics, trends, and platform performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Visibility Score" value={`${metrics?.visibilityScore || 0}%`} icon={<Target className="h-6 w-6" />} color="indigo" />
        <MetricCard title="Total Mentions" value={metrics?.totalMentions || 0} icon={<TrendingUp className="h-6 w-6" />} color="blue" />
        <MetricCard title="Total Scans" value={metrics?.totalScans || 0} icon={<Activity className="h-6 w-6" />} color="purple" />
        <MetricCard title="Brands Tracked" value={brands.length} icon={<Sparkles className="h-6 w-6" />} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Visibility Trend</h2>
          {metrics?.trendData?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mentions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-slate-500">No trend data available.</div>}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Breakdown</h2>
          {metrics?.platformBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={metrics.platformBreakdown} dataKey="mentions" nameKey="platform" outerRadius={100} label>
                  {metrics.platformBreakdown.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-slate-500">No platform data available.</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link href="/scans" className="px-4 py-3 rounded-lg bg-indigo-600 text-white text-center font-medium hover:bg-indigo-700">Run New Scan</Link>
          <Link href="/brands" className="px-4 py-3 rounded-lg bg-slate-100 text-slate-900 text-center font-medium hover:bg-slate-200">Add Brand</Link>
          <Link href="/query-library" className="px-4 py-3 rounded-lg bg-slate-100 text-slate-900 text-center font-medium hover:bg-slate-200">Query Library</Link>
          <Link href="/analytics" className="px-4 py-3 rounded-lg bg-slate-100 text-slate-900 text-center font-medium hover:bg-slate-200">View Analytics</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Scans</h2>
        <RecentScans />
      </div>
    </div>
  );
}

function RecentScans() {
  const [rows, setRows] = useState<Array<{ id: string; ai_platform: string; executed_at: string; queries?: { text?: string } }>>([]);
  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/scans');
      const data = await res.json();
      setRows((data.scans || []).slice(0, 5));
    })();
  }, []);

  if (!rows.length) return <p className="text-slate-500">No scans yet.</p>;

  return (
    <div className="space-y-2">
      {rows.map((scan) => (
        <Link key={scan.id} href={`/scans/${scan.id}`} className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
          <div className="flex justify-between gap-4">
            <p className="font-medium text-slate-900 truncate">{scan.queries?.text || 'Unknown query'}</p>
            <p className="text-sm text-slate-600 capitalize">{scan.ai_platform}</p>
          </div>
          <p className="text-xs text-slate-500">{new Date(scan.executed_at).toLocaleString()}</p>
        </Link>
      ))}
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  } as const;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>{icon}</div>
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
