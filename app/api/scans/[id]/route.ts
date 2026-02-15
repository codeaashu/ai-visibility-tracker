import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get scan details
        const { data: scan, error: scanError } = await supabase
            .from('scans')
            .select(`
        *,
        queries (*)
      `)
            .eq('id', id)
            .single();

        if (scanError) throw scanError;

        // Get mentions for this scan
        const { data: mentions, error: mentionsError } = await supabase
            .from('mentions')
            .select(`
        *,
        brands (*)
      `)
            .eq('scan_id', id);

        if (mentionsError) throw mentionsError;

        return NextResponse.json({
            scan,
            mentions,
        });
    } catch (error) {
        console.error('Error fetching scan details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch scan details' },
            { status: 500 }
        );
    }
}
