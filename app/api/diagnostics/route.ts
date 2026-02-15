import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { queryGemini } from '@/lib/ai-clients/gemini';
import { queryChatGPT } from '@/lib/ai-clients/openai';
import { AIProviderError, providerFixHint, toProviderError } from '@/lib/ai-clients/errors';

type CheckStatus = 'ok' | 'warning' | 'error' | 'skipped';

type DiagnosticCheck = {
    name: string;
    status: CheckStatus;
    message: string;
    details?: {
        type?: string;
        statusCode?: number;
        retryable?: boolean;
        hint?: string;
    };
};

function toDiagnosticProviderCheck(name: string, error: unknown): DiagnosticCheck {
    const providerError: AIProviderError = toProviderError(
        name === 'provider:gemini' ? 'gemini' : 'openai',
        error
    );

    return {
        name,
        status: 'error',
        message: providerError.message,
        details: {
            type: providerError.type,
            statusCode: providerError.statusCode,
            retryable: providerError.retryable,
            hint: providerFixHint(providerError),
        },
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const testProviders = searchParams.get('test_providers') === 'true';

    const checks: DiagnosticCheck[] = [];

    const env = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    };

    const requiredEnvVars: Array<keyof typeof env> = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_KEY',
        'GEMINI_API_KEY',
    ];

    for (const envVar of requiredEnvVars) {
        if (env[envVar]) {
            checks.push({
                name: `env:${envVar}`,
                status: 'ok',
                message: 'Configured',
            });
        } else {
            checks.push({
                name: `env:${envVar}`,
                status: 'error',
                message: 'Missing required environment variable',
            });
        }
    }

    checks.push({
        name: 'env:OPENAI_API_KEY',
        status: env.OPENAI_API_KEY ? 'ok' : 'warning',
        message: env.OPENAI_API_KEY
            ? 'Configured (optional for ChatGPT scans)'
            : 'Not configured (optional; users can still provide key per scan)',
    });

    try {
        const { error } = await supabase
            .from('queries')
            .select('id')
            .limit(1);

        if (error) {
            checks.push({
                name: 'supabase:connectivity',
                status: 'error',
                message: `Connection/query failed: ${error.message}`,
            });
        } else {
            checks.push({
                name: 'supabase:connectivity',
                status: 'ok',
                message: 'Database connectivity is healthy',
            });
        }
    } catch (error) {
        checks.push({
            name: 'supabase:connectivity',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown Supabase error',
        });
    }

    if (testProviders) {
        if (!env.GEMINI_API_KEY) {
            checks.push({
                name: 'provider:gemini',
                status: 'error',
                message: 'Cannot test Gemini: GEMINI_API_KEY is missing',
            });
        } else {
            try {
                await queryGemini('Reply with exactly: OK');
                checks.push({
                    name: 'provider:gemini',
                    status: 'ok',
                    message: 'Gemini provider test succeeded',
                });
            } catch (error) {
                checks.push(toDiagnosticProviderCheck('provider:gemini', error));
            }
        }

        if (!env.OPENAI_API_KEY) {
            checks.push({
                name: 'provider:openai',
                status: 'warning',
                message: 'Skipping OpenAI provider test (optional API key missing)',
            });
        } else {
            try {
                await queryChatGPT('Reply with exactly: OK');
                checks.push({
                    name: 'provider:openai',
                    status: 'ok',
                    message: 'OpenAI provider test succeeded',
                });
            } catch (error) {
                checks.push(toDiagnosticProviderCheck('provider:openai', error));
            }
        }
    } else {
        checks.push({
            name: 'provider:gemini',
            status: 'skipped',
            message: 'Provider call test skipped. Use ?test_providers=true to test live API access.',
        });
        checks.push({
            name: 'provider:openai',
            status: 'skipped',
            message: 'Provider call test skipped. Use ?test_providers=true to test live API access.',
        });
    }

    const hasErrors = checks.some((check) => check.status === 'error');

    return NextResponse.json(
        {
            success: !hasErrors,
            timestamp: new Date().toISOString(),
            checks,
            guidance: {
                next_step: hasErrors
                    ? 'Fix failing checks and re-run diagnostics'
                    : 'Diagnostics look healthy',
                note: 'This endpoint never returns raw secret values.',
            },
        },
        { status: hasErrors ? 500 : 200 }
    );
}