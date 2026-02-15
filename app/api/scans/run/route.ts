import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { queryGemini } from '@/lib/ai-clients/gemini';
import { queryChatGPT } from '@/lib/ai-clients/openai';
import { detectBrandMentions } from '@/lib/brand-detector';

type ScanPlatform = 'gemini' | 'chatgpt';

type ScanResult = {
    platform: string;
    success: boolean;
    scan_id?: string;
    mentions_count?: number;
    error?: string;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { query_id, platforms, openai_api_key } = body;

        if (!query_id || !platforms || platforms.length === 0) {
            return NextResponse.json(
                { error: 'query_id and platforms are required' },
                { status: 400 }
            );
        }

        // Get query text
        const { data: query, error: queryError } = await supabase
            .from('queries')
            .select('*')
            .eq('id', query_id)
            .single();

        if (queryError || !query) {
            return NextResponse.json(
                { error: 'Query not found' },
                { status: 404 }
            );
        }

        // Get all brands to track
        const { data: brands, error: brandsError } = await supabase
            .from('brands')
            .select('*');

        if (brandsError) throw brandsError;

        if (!brands || brands.length === 0) {
            return NextResponse.json(
                { error: 'No brands to track. Please add brands first.' },
                { status: 400 }
            );
        }

        const supportedPlatforms: ScanPlatform[] = ['gemini', 'chatgpt'];
        const unsupportedPlatforms = (platforms as string[]).filter(
            (platform) => !supportedPlatforms.includes(platform as ScanPlatform)
        );

        if (unsupportedPlatforms.length > 0) {
            return NextResponse.json(
                { error: `Unsupported platform(s): ${unsupportedPlatforms.join(', ')}` },
                { status: 400 }
            );
        }

        // Query each AI platform
        const scanResults = await Promise.all(
            (platforms as ScanPlatform[]).map(async (platform): Promise<ScanResult> => {
                try {
                    let response = '';

                    if (platform === 'gemini') {
                        response = await queryGemini(query.text);
                    } else if (platform === 'chatgpt') {
                        response = await queryChatGPT(query.text, openai_api_key);
                    }

                    // Save scan
                    const { data: scan, error: scanError } = await supabase
                        .from('scans')
                        .insert({
                            query_id,
                            ai_platform: platform,
                            raw_response: response,
                            status: 'completed',
                        })
                        .select()
                        .single();

                    if (scanError) throw scanError;

                    // Detect brand mentions
                    const mentions = detectBrandMentions(response, brands);

                    // Save mentions
                    if (mentions.length > 0) {
                        const mentionsToInsert = mentions.map((m) => ({
                            ...m,
                            scan_id: scan.id,
                        }));

                        const { error: mentionsError } = await supabase
                            .from('mentions')
                            .insert(mentionsToInsert);

                        if (mentionsError) throw mentionsError;
                    }

                    return {
                        platform,
                        scan_id: scan.id,
                        mentions_count: mentions.length,
                        success: true,
                    };
                } catch (error) {
                    console.error(`Error scanning ${platform}:`, error);
                    return {
                        platform,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        const successCount = scanResults.filter((result) => result.success).length;
        const hasAnySuccess = successCount > 0;

        const payload = {
            success: hasAnySuccess,
            query: query.text,
            results: scanResults,
        };

        if (!hasAnySuccess) {
            return NextResponse.json(payload, { status: 502 });
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error('Error running scan:', error);
        return NextResponse.json(
            { error: 'Failed to run scan' },
            { status: 500 }
        );
    }
}
