import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const body = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headers.join(','), ...body].join('\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const { data, error } = await supabase
      .from('scans')
      .select('id, query_id, ai_platform, raw_response, executed_at, status')
      .order('executed_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    if (format === 'csv') {
      const csv = toCsv(data || []);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="scan-report.csv"',
        },
      });
    }

    return NextResponse.json({ scans: data || [] });
  } catch (error) {
    console.error('Error exporting report data:', error);
    return NextResponse.json({ error: 'Failed to export report data' }, { status: 500 });
  }
}
