'use client';

import { useEffect, useState } from 'react';
import { Brand, Query, VisibilityMetrics } from '@/lib/types';
import { TrendingUp, Target, Activity, Sparkles } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<VisibilityMetrics | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, brandsRes, queriesRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/brands'),
        fetch('/api/queries'),
      ]);

      const metricsData = await metricsRes.json();
      const brandsData = await brandsRes.json();
      const queriesData = await queriesRes.json();

      setMetrics(metricsData);
      setBrands(brandsData.brands || []);
      setQueries(queriesData.queries || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Track your AI visibility across platforms</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Visibility Score"
          value={`${metrics?.visibilityScore || 0}%`}
          icon={<Target className="h-6 w-6" />}
          color="indigo"
        />
        <MetricCard
          title="Total Mentions"
          value={metrics?.totalMentions || 0}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Total Scans"
          value={metrics?.totalScans || 0}
          icon={<Activity className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="Brands Tracked"
          value={brands.length}
          icon={<Sparkles className="h-6 w-6" />}
          color="pink"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Visibility Trend</h2>
          {metrics && metrics.trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="mentions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No trend data available. Run some scans to see trends.
            </div>
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Platform Breakdown</h2>
          {metrics && metrics.platformBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.platformBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="platform" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar dataKey="mentions" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No platform data available. Run some scans to see breakdown.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/brands"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl p-4 text-center font-medium"
          >
            Add Brand
          </Link>
          <Link
            href="/scans"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl p-4 text-center font-medium"
          >
            Run New Scan
          </Link>
          <Link
            href="/scans"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl p-4 text-center font-medium"
          >
            View History
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {brands.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Getting Started</h3>
          <p className="text-amber-800 mb-4">
            You haven&apos;t added any brands yet. Add your brand to start tracking AI visibility.
          </p>
          <Link
            href="/brands"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Add Your First Brand
          </Link>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
