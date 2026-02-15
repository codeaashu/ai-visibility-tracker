'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Scan, MentionWithBrand, Query } from '@/lib/types';
import { ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';

export default function ScanDetailPage() {
    const params = useParams();
    const [scan, setScan] = useState<Scan & { queries: Query } | null>(null);
    const [mentions, setMentions] = useState<MentionWithBrand[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchScanDetails(params.id as string);
        }
    }, [params.id]);

    const fetchScanDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/scans/${id}`);
            const data = await res.json();
            setScan(data.scan);
            setMentions(data.mentions || []);
        } catch (error) {
            console.error('Error fetching scan details:', error);
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

    if (!scan) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Scan not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/scans"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Scans
                </Link>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Scan Details</h1>
                <p className="text-slate-600">{scan.queries?.text}</p>
            </div>

            {/* Scan Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Platform</p>
                        <p className="text-lg font-semibold text-slate-900 capitalize">{scan.ai_platform}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Executed At</p>
                        <p className="text-lg font-semibold text-slate-900">
                            {new Date(scan.executed_at).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-600 mb-1">Mentions Found</p>
                        <p className="text-lg font-semibold text-slate-900">{mentions.length}</p>
                    </div>
                </div>
            </div>

            {/* Mentions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-indigo-600" />
                    Brand Mentions
                </h2>

                {mentions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <p>No brand mentions detected in this scan.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mentions.map((mention) => (
                            <div
                                key={mention.id}
                                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-slate-900">{mention.brands.name}</h3>
                                    {mention.position && (
                                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            Position #{mention.position}
                                        </span>
                                    )}
                                </div>
                                {mention.context && (
                                    <p className="text-sm text-slate-700 italic">&quot;{mention.context}&quot;</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Raw Response */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">AI Response</h2>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap">{scan.raw_response}</pre>
                </div>
            </div>
        </div>
    );
}
