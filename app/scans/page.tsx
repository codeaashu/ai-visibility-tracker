'use client';

import { useEffect, useState } from 'react';
import { Query, ScanWithQuery } from '@/lib/types';
import { Play, Clock, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

type ScanResult = {
    platform: string;
    success: boolean;
    error?: string;
    scan_id?: string;
    mentions_count?: number;
};

export default function ScansPage() {
    const [queries, setQueries] = useState<Query[]>([]);
    const [scans, setScans] = useState<ScanWithQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [selectedQuery, setSelectedQuery] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['gemini']);
    const [openaiKey, setOpenaiKey] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [queriesRes, scansRes] = await Promise.all([
                fetch('/api/queries'),
                fetch('/api/scans'),
            ]);

            const queriesData = await queriesRes.json();
            const scansData = await scansRes.json();

            setQueries(queriesData.queries || []);
            setScans(scansData.scans || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunScan = async () => {
        if (!selectedQuery) {
            alert('Please select a query');
            return;
        }

        if (selectedPlatforms.includes('chatgpt') && !openaiKey) {
            alert('Please provide your OpenAI API key to use ChatGPT');
            return;
        }

        setScanning(true);
        try {
            const res = await fetch('/api/scans/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query_id: selectedQuery,
                    platforms: selectedPlatforms,
                    openai_api_key: openaiKey || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const results: ScanResult[] = data.results || [];
                const successCount = results.filter((result) => result.success).length;

                if (successCount === 0) {
                    const firstError = results.find((result) => result.error)?.error;
                    alert(`Scan failed on all platforms.${firstError ? ` ${firstError}` : ''}`);
                } else if (successCount < results.length) {
                    alert(`Scan partially completed: ${successCount}/${results.length} platforms succeeded.`);
                } else {
                    alert(`Scan completed successfully on ${successCount} platform(s).`);
                }

                fetchData();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error running scan:', error);
            alert('Failed to run scan');
        } finally {
            setScanning(false);
        }
    };

    const togglePlatform = (platform: string) => {
        if (selectedPlatforms.includes(platform)) {
            setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
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
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Scans</h1>
                <p className="text-slate-600">Run scans and view scan history</p>
            </div>

            {/* Run New Scan */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Sparkles className="h-6 w-6 mr-2" />
                    Run New Scan
                </h2>

                <div className="space-y-6">
                    {/* Select Query */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Select Query</label>
                        <select
                            value={selectedQuery}
                            onChange={(e) => setSelectedQuery(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg text-slate-900 focus:ring-2 focus:ring-white"
                        >
                            <option value="">Choose a query...</option>
                            {queries.map((query) => (
                                <option key={query.id} value={query.id}>
                                    {query.text} {query.category && `(${query.category})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Select Platforms */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Select AI Platforms</label>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => togglePlatform('gemini')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPlatforms.includes('gemini')
                                        ? 'bg-white text-indigo-600'
                                        : 'bg-white/20 hover:bg-white/30'
                                    }`}
                            >
                                Gemini (Free)
                            </button>
                            <button
                                onClick={() => togglePlatform('chatgpt')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedPlatforms.includes('chatgpt')
                                        ? 'bg-white text-indigo-600'
                                        : 'bg-white/20 hover:bg-white/30'
                                    }`}
                            >
                                ChatGPT
                            </button>
                        </div>
                    </div>

                    {/* OpenAI API Key */}
                    {selectedPlatforms.includes('chatgpt') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                            <input
                                type="password"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg text-slate-900 focus:ring-2 focus:ring-white"
                                placeholder="sk-..."
                            />
                            <p className="text-xs mt-2 opacity-90">
                                Your API key is only used for this scan and is not stored.
                            </p>
                        </div>
                    )}

                    {/* Run Button */}
                    <button
                        onClick={handleRunScan}
                        disabled={scanning || !selectedQuery || selectedPlatforms.length === 0}
                        className="bg-white text-indigo-600 hover:bg-slate-100 disabled:bg-slate-300 disabled:text-slate-500 font-bold px-8 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                        {scanning ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                <span>Scanning...</span>
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5" />
                                <span>Run Scan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scan History */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Scan History</h2>

                {scans.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>No scans yet. Run your first scan above!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scans.map((scan) => (
                            <Link
                                key={scan.id}
                                href={`/scans/${scan.id}`}
                                className="block p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-slate-900">
                                            {scan.queries?.text || 'Unknown query'}
                                        </h3>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Platform: <span className="font-medium">{scan.ai_platform}</span> •{' '}
                                            {new Date(scan.executed_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        {scan.status === 'completed' ? (
                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                        ) : scan.status === 'failed' ? (
                                            <XCircle className="h-6 w-6 text-red-500" />
                                        ) : (
                                            <Clock className="h-6 w-6 text-yellow-500" />
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
