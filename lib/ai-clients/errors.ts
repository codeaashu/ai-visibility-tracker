export type ProviderErrorType =
    | 'auth'
    | 'quota'
    | 'rate_limit'
    | 'billing'
    | 'invalid_request'
    | 'network'
    | 'server'
    | 'unknown';

export class AIProviderError extends Error {
    provider: 'gemini' | 'openai';
    type: ProviderErrorType;
    statusCode?: number;
    providerCode?: string;
    retryable: boolean;

    constructor(params: {
        provider: 'gemini' | 'openai';
        type: ProviderErrorType;
        message: string;
        statusCode?: number;
        providerCode?: string;
        retryable?: boolean;
    }) {
        super(params.message);
        this.name = 'AIProviderError';
        this.provider = params.provider;
        this.type = params.type;
        this.statusCode = params.statusCode;
        this.providerCode = params.providerCode;
        this.retryable = params.retryable ?? false;
    }
}

function classifyType(statusCode?: number, rawMessage?: string): ProviderErrorType {
    const message = (rawMessage || '').toLowerCase();

    const hasQuotaSignal =
        message.includes('quota') ||
        message.includes('insufficient_quota') ||
        message.includes('quota exceeded') ||
        message.includes('limit: 0') ||
        message.includes('free_tier') ||
        message.includes('exceeded your current quota');

    if (statusCode === 401 || statusCode === 403 || message.includes('api key') || message.includes('unauthorized')) {
        return 'auth';
    }
    if (hasQuotaSignal) {
        return 'quota';
    }
    if (statusCode === 429) {
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return 'rate_limit';
        }
        return 'rate_limit';
    }
    if (message.includes('billing') || message.includes('payment') || message.includes('credit')) {
        return 'billing';
    }
    if (statusCode === 400 || statusCode === 404 || message.includes('invalid') || message.includes('bad request')) {
        return 'invalid_request';
    }
    if (statusCode !== undefined && statusCode >= 500) {
        return 'server';
    }
    if (message.includes('fetch failed') || message.includes('network') || message.includes('timeout') || message.includes('econn')) {
        return 'network';
    }
    return 'unknown';
}

function isRetryable(type: ProviderErrorType): boolean {
    return type === 'rate_limit' || type === 'server' || type === 'network';
}

export function toProviderError(provider: 'gemini' | 'openai', error: unknown): AIProviderError {
    if (error instanceof AIProviderError) {
        return error;
    }

    const source = error as {
        message?: string;
        status?: number;
        code?: string;
        type?: string;
    };

    const message = source?.message || `Failed to query ${provider} API`;
    const statusCode = source?.status;
    const providerCode = source?.code || source?.type;
    const type = classifyType(statusCode, message);

    const detailParts = [
        `${provider.toUpperCase()} ${type.replace('_', ' ')}`,
        statusCode ? `status ${statusCode}` : undefined,
        providerCode ? `code ${providerCode}` : undefined,
    ].filter(Boolean);

    return new AIProviderError({
        provider,
        type,
        statusCode,
        providerCode,
        retryable: isRetryable(type),
        message: `${detailParts.join(', ')}: ${message}`,
    });
}

export function providerFixHint(error: AIProviderError): string {
    switch (error.type) {
        case 'auth':
            return 'Check API key validity, project permissions, and whether the key is loaded in env.';
        case 'quota':
            return 'Quota is exhausted or disabled. Enable billing/increase quota or switch provider/model.';
        case 'rate_limit':
            return 'You are being rate-limited. Add retry/backoff or lower request frequency.';
        case 'billing':
            return 'Check billing status and payment method on provider account.';
        case 'invalid_request':
            return 'Check model name and request payload format for provider compatibility.';
        case 'network':
            return 'Check network/connectivity and try again.';
        case 'server':
            return 'Provider service is unstable; retry shortly.';
        default:
            return 'Inspect provider dashboard logs and raw SDK error details.';
    }
}