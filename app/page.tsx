'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Bot, SearchCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: SearchCheck,
    title: 'Query templates + custom prompts',
    description: 'Run buyer-intent prompts by category and add your own market-specific queries.',
  },
  {
    icon: Bot,
    title: 'Multi-platform AI tracking',
    description: 'Compare ChatGPT, Gemini, and Perplexity answers using the same prompts.',
  },
  {
    icon: TrendingUp,
    title: 'Visibility analytics',
    description: 'Track score, ranking position, trend lines, and competitor benchmarks over time.',
  },
];

const products = [
  {
    slug: 'ai-visibility-tracker',
    name: 'AI Visibility Tracker',
    category: 'SaaS Growth',
    summary: 'Quantify how often your product appears in AI recommendations and where it ranks.',
  },
  {
    slug: 'competitor-radar',
    name: 'Competitor Radar',
    category: 'Competitive Intel',
    summary: 'Analyze recommendation share-of-voice and compare positioning against competitors.',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16">
      <section className="pt-10 text-center space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <Badge className="mx-auto mb-4">Product Requirements Aligned</Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            AI Visibility Tracker
            <span className="block text-indigo-600">for modern SaaS teams</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-slate-600 mt-4">
            Monitor how AI assistants recommend your brand, detect competitor mentions, and improve discoverability with data-driven insights.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/dashboard"><Button size="lg">Open Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/scans"><Button size="lg" variant="outline">Run a Scan</Button></Link>
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div key={feature.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
            <Card>
              <CardHeader>
                <feature.icon className="h-6 w-6 text-indigo-600 mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Free-tier friendly architecture</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Next.js App Router + API routes</li>
            <li>• Supabase Postgres for scan history and analytics</li>
            <li>• Built-in diagnostics and resilient retry logic</li>
            <li>• Export endpoint for JSON/CSV reporting</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Link href="/query-library"><Button variant="secondary">Query Library</Button></Link>
            <Link href="/analytics"><Button variant="ghost">Analytics</Button></Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <p className="font-semibold text-slate-900">What you track</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['Visibility score', 'Platform breakdown', 'Position rank', 'Trend history', 'Competitor matrix', 'Raw responses'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </motion.div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Brands / products detailed sections</h2>
            <p className="text-slate-600">Animated product narratives for your public website.</p>
          </div>
          <Sparkles className="h-6 w-6 text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product, idx) => (
            <motion.div key={product.slug} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
              <Card className="h-full">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">{product.category}</Badge>
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{product.summary}</p>
                  <Link href={`/products/${product.slug}`} className="inline-flex items-center text-indigo-600 font-medium">Read details <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
