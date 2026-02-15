'use client';

import { useEffect, useState } from 'react';
import { VisibilityMetrics } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<VisibilityMetrics | null>(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetchAnalytics(days);
    }, [days]);

    const fetchAnalytics = async (selectedDays: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics?days=${selectedDays}`);
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Analytics</h1>
                    <p className="text-slate-600">Visibility trends and platform performance</p>
                </div>
                <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Visibility Score" value={`${metrics?.visibilityScore || 0}%`} />
                <StatCard label="Total Mentions" value={metrics?.totalMentions || 0} />
                <StatCard label="Total Scans" value={metrics?.totalScans || 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Mentions Over Time</h2>
                    {metrics && metrics.trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={metrics.trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Line type="monotone" dataKey="mentions" stroke="#6366f1" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            No trend data available.
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Mentions by Platform</h2>
                    {metrics && metrics.platformBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metrics.platformBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="platform" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Bar dataKey="mentions" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            No platform data available.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
    );
}