'use client';

import { useEffect, useState } from 'react';
import { VisibilityMetrics } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
    const [metrics, setMetrics] = useState<VisibilityMetrics | null>(null);
    const [competitors, setCompetitors] = useState<Array<{ brand_id: string; name: string; category: string | null; mentions: number }>>([]);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void fetchAnalytics(days);
    }, [days]);

    const fetchAnalytics = async (selectedDays: number) => {
        setLoading(true);
        try {
            const [metricsRes, competitorsRes] = await Promise.all([
                fetch(`/api/analytics?days=${selectedDays}`),
                fetch('/api/analytics/competitors'),
            ]);

            const metricsData = await metricsRes.json();
            const competitorsData = await competitorsRes.json();
            setMetrics(metricsData);
            setCompetitors(competitorsData.competitors || []);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportData = (format: 'json' | 'csv') => {
        window.open(`/api/reports/export?format=${format}`, '_blank');
    };

    const sharePage = async () => {
        await navigator.clipboard.writeText(window.location.href);
        alert('Share link copied to clipboard');
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

            <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportData('csv')}>Export CSV</Button>
                <Button variant="outline" onClick={() => exportData('json')}>Export JSON</Button>
                <Button onClick={sharePage}>Share</Button>
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

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Competitor Matrix</h2>
                {competitors.length === 0 ? (
                    <p className="text-slate-500">No competitor data yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-600 border-b border-slate-200">
                                    <th className="py-2 pr-4">Brand</th>
                                    <th className="py-2 pr-4">Category</th>
                                    <th className="py-2">Mentions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {competitors.slice(0, 15).map((competitor) => (
                                    <tr key={competitor.brand_id} className="border-b border-slate-100 text-slate-800">
                                        <td className="py-2 pr-4 font-medium">{competitor.name}</td>
                                        <td className="py-2 pr-4">{competitor.category || 'General'}</td>
                                        <td className="py-2">{competitor.mentions}</td>
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

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
    );
}