import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { POST as runScanPost } from './run/route';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('scans')
            .select(`
        *,
        queries (*)
      `)
            .order('executed_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ scans: data });
    } catch (error) {
        console.error('Error fetching scans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scans' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    return runScanPost(request);
}
