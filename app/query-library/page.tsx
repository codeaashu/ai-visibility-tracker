'use client';

import { useEffect, useMemo, useState } from 'react';
import { Query } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function QueryLibraryPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    void fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const res = await fetch('/api/queries');
      const data = await res.json();
      setQueries(data.queries || []);
    } finally {
      setLoading(false);
    }
  };

  const templates = useMemo(() => queries.filter((query) => query.is_template), [queries]);
  const customQueries = useMemo(() => queries.filter((query) => !query.is_template), [queries]);

  const addCustomQuery = async () => {
    if (!text.trim()) return;
    const res = await fetch('/api/queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, category }),
    });

    if (res.ok) {
      setText('');
      setCategory('');
      void fetchQueries();
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Query Library</h1>
        <p className="text-slate-600">Manage templates and custom buyer-intent prompts.</p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((query) => (
              <Card key={query.id}>
                <CardHeader><CardTitle className="text-base">{query.text}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-slate-600">Category: {query.category || 'General'}</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Add custom query</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="e.g. best analytics tools for B2B SaaS" value={text} onChange={(event) => setText(event.target.value)} />
              <Input placeholder="Category (optional)" value={category} onChange={(event) => setCategory(event.target.value)} />
              <Button onClick={addCustomQuery}>Add Query</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customQueries.map((query) => (
              <Card key={query.id}>
                <CardHeader><CardTitle className="text-base">{query.text}</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-slate-600">Category: {query.category || 'General'}</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
