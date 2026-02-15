import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateVisibilityScore } from '@/lib/brand-detector';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brand_id');
        const days = parseInt(searchParams.get('days') || '30');

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get total scans in date range
        const { data: scans, error: scansError } = await supabase
            .from('scans')
            .select('id, ai_platform, executed_at')
            .gte('executed_at', startDate.toISOString())
            .order('executed_at', { ascending: true });

        if (scansError) throw scansError;

        const totalScans = scans?.length || 0;

        // Get mentions
        let mentionsQuery = supabase
            .from('mentions')
            .select(`
        *,
        scans!inner (
          executed_at,
          ai_platform
        ),
        brands (
          id,
          name
        )
      `)
            .gte('scans.executed_at', startDate.toISOString());

        if (brandId) {
            mentionsQuery = mentionsQuery.eq('brand_id', brandId);
        }

        const { data: mentions, error: mentionsError } = await mentionsQuery;

        if (mentionsError) throw mentionsError;

        const totalMentions = mentions?.length || 0;

        // Calculate visibility score
        const visibilityScore = calculateVisibilityScore(totalScans, totalMentions);

        // Platform breakdown
        const platformBreakdown = (scans || []).reduce((acc: any[], scan) => {
            const platform = scan.ai_platform;
            const platformMentions = mentions?.filter(
                (m: any) => m.scans.ai_platform === platform
            ).length || 0;

            const existing = acc.find((p) => p.platform === platform);
            if (existing) {
                existing.mentions += platformMentions;
            } else {
                acc.push({ platform, mentions: platformMentions });
            }
            return acc;
        }, []);

        // Trend data (group by date)
        const trendData = (scans || []).reduce((acc: any[], scan) => {
            const date = new Date(scan.executed_at).toISOString().split('T')[0];
            const dateMentions = mentions?.filter(
                (m: any) => new Date(m.scans.executed_at).toISOString().split('T')[0] === date
            ).length || 0;

            const existing = acc.find((t) => t.date === date);
            if (existing) {
                existing.mentions += dateMentions;
            } else {
                acc.push({ date, mentions: dateMentions });
            }
            return acc;
        }, []);

        return NextResponse.json({
            totalScans,
            totalMentions,
            visibilityScore,
            platformBreakdown,
            trendData,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
