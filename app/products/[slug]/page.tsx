'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRODUCTS: Record<string, { name: string; category: string; summary: string; highlights: string[]; outcomes: string[] }> = {
  'ai-visibility-tracker': {
    name: 'AI Visibility Tracker',
    category: 'Growth Analytics',
    summary: 'Track how your product appears in AI recommendations and benchmark competitive visibility over time.',
    highlights: ['Template + custom query workflows', 'ChatGPT/Gemini/Perplexity scan support', 'Visibility score + trend analytics'],
    outcomes: ['Higher AI recommendation share', 'Faster positioning insights', 'Data-driven growth priorities'],
  },
  'competitor-radar': {
    name: 'Competitor Radar',
    category: 'Competitive Intelligence',
    summary: 'Understand who dominates recommendations in your niche and where your brand can gain share.',
    highlights: ['Competitor matrix comparisons', 'Recommendation rank distribution', 'Platform-by-platform performance'],
    outcomes: ['Stronger messaging strategy', 'Feature positioning clarity', 'Improved response campaigns'],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = String(params.slug || '');

  const product = useMemo(() => PRODUCTS[slug] || PRODUCTS['ai-visibility-tracker'], [slug]);

  return (
    <div className="space-y-10 pb-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Badge className="mb-3">{product.category}</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">{product.name}</h1>
        <p className="text-lg text-slate-600 max-w-3xl">{product.summary}</p>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle>Key capabilities</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-700">
              {product.highlights.map((item, idx) => (
                <motion.li key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.08 }}>• {item}</motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expected outcomes</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-700">
              {product.outcomes.map((item, idx) => (
                <motion.li key={item} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.08 }}>• {item}</motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
        <h2 className="text-xl font-semibold text-indigo-900 mb-2">Ready to use this in production?</h2>
        <p className="text-indigo-800 mb-4">Open the dashboard to start scans, manage brands, and track AI visibility in real time.</p>
        <div className="flex gap-3">
          <Link href="/dashboard"><Button>Open Dashboard</Button></Link>
          <Link href="/scans"><Button variant="outline">Run Scan</Button></Link>
        </div>
      </motion.div>
    </div>
  );
}
