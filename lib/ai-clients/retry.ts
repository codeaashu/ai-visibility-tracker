import { AIProviderError, toProviderError } from './errors';

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelayMs(error: AIProviderError, fallbackMs: number): number {
    const message = error.message;

    const retryInMatch = message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
    if (retryInMatch) {
        return Math.ceil(Number(retryInMatch[1]) * 1000);
    }

    const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i);
    if (retryDelayMatch) {
        return Number(retryDelayMatch[1]) * 1000;
    }

    return fallbackMs;
}

export async function withProviderRetry<T>(
    provider: 'gemini' | 'openai' | 'perplexity',
    operation: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 1500
): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            return await operation();
        } catch (error) {
            const providerError = toProviderError(provider, error);
            lastError = providerError;

            const canRetry = providerError.retryable && attempt < maxAttempts;
            if (!canRetry) {
                throw providerError;
            }

            const computedBackoff = baseDelayMs * Math.pow(2, attempt - 1);
            const delayMs = Math.min(
                60_000,
                Math.max(computedBackoff, extractRetryDelayMs(providerError, computedBackoff))
            );

            await sleep(delayMs);
        }
    }

    throw toProviderError(provider, lastError);
}