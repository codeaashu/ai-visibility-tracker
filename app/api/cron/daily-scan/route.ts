import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { queryGemini } from '@/lib/ai-clients/gemini';
import { detectBrandMentions } from '@/lib/brand-detector';

export async function GET() {
    try {
        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .select('*');

        if (brandsError) throw brandsError;

        if (!brands || brands.length === 0) {
            return NextResponse.json({ success: true, message: 'No brands configured, skipping daily scan.' });
        }

        const { data: queries, error: queriesError } = await supabase
            .from('queries')
            .select('*')
            .eq('is_template', true)
            .limit(10);

        if (queriesError) throw queriesError;

        if (!queries || queries.length === 0) {
            return NextResponse.json({ success: true, message: 'No template queries found, skipping daily scan.' });
        }

        const results = [] as Array<{ query_id: string; success: boolean; mentions_count?: number; error?: string }>;

        for (const query of queries) {
            try {
                const response = await queryGemini(query.text);

                const { data: scan, error: scanError } = await supabase
                    .from('scans')
                    .insert({
                        query_id: query.id,
                        ai_platform: 'gemini',
                        raw_response: response,
                        status: 'completed',
                    })
                    .select()
                    .single();

                if (scanError) throw scanError;

                const mentions = detectBrandMentions(response, brands);

                if (mentions.length > 0) {
                    const { error: mentionsError } = await supabase
                        .from('mentions')
                        .insert(
                            mentions.map((mention) => ({
                                ...mention,
                                scan_id: scan.id,
                            }))
                        );

                    if (mentionsError) throw mentionsError;
                }

                results.push({
                    query_id: query.id,
                    success: true,
                    mentions_count: mentions.length,
                });
            } catch (error) {
                results.push({
                    query_id: query.id,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const successCount = results.filter((result) => result.success).length;

        return NextResponse.json({
            success: successCount > 0,
            total: results.length,
            succeeded: successCount,
            failed: results.length - successCount,
            results,
        });
    } catch (error) {
        console.error('Error running daily cron scan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to run daily cron scan' },
            { status: 500 }
        );
    }
}