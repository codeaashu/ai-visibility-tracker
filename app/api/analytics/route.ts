import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateVisibilityScore } from '@/lib/brand-detector';

type ScanRow = {
    id: string;
    ai_platform: string;
    executed_at: string;
};

type MentionRow = {
    scans: {
        executed_at: string;
        ai_platform: string;
    };
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brand_id');
        const rawDays = parseInt(searchParams.get('days') || '30', 10);
        const days = Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 30;

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

        const normalizedScans: ScanRow[] = scans || [];
        const totalScans = normalizedScans.length;

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

        const normalizedMentions: MentionRow[] = (mentions || []) as MentionRow[];
        const totalMentions = normalizedMentions.length;

        // Calculate visibility score
        const visibilityScore = calculateVisibilityScore(totalScans, totalMentions);

        // Platform breakdown
        const platformMentionsMap = new Map<string, number>();
        for (const mention of normalizedMentions) {
            const platform = mention.scans.ai_platform;
            platformMentionsMap.set(platform, (platformMentionsMap.get(platform) || 0) + 1);
        }

        const platformBreakdown = Array.from(platformMentionsMap.entries()).map(
            ([platform, mentionsCount]) => ({
                platform,
                mentions: mentionsCount,
            })
        );

        // Trend data (group by date)
        const trendMentionsMap = new Map<string, number>();
        for (const mention of normalizedMentions) {
            const date = new Date(mention.scans.executed_at).toISOString().split('T')[0];
            trendMentionsMap.set(date, (trendMentionsMap.get(date) || 0) + 1);
        }

        for (const scan of normalizedScans) {
            const date = new Date(scan.executed_at).toISOString().split('T')[0];
            if (!trendMentionsMap.has(date)) {
                trendMentionsMap.set(date, 0);
            }
        }

        const trendData = Array.from(trendMentionsMap.entries())
            .map(([date, mentionsCount]) => ({
                date,
                mentions: mentionsCount,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

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
