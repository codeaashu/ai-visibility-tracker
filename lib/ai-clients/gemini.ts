import { GoogleGenerativeAI } from '@google/generative-ai';
import { toProviderError } from './errors';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getCandidateModels(): string[] {
    const configuredModel = process.env.GEMINI_MODEL?.trim();

    const defaults = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
    ];

    return configuredModel ? [configuredModel, ...defaults.filter((model) => model !== configuredModel)] : defaults;
}

function isModelNotFoundError(error: unknown): boolean {
    const source = error as { message?: string; status?: number };
    const message = (source?.message || '').toLowerCase();

    return (
        source?.status === 404 ||
        message.includes('is not found') ||
        (message.includes('model') && message.includes('not supported'))
    );
}

export async function queryGemini(prompt: string): Promise<string> {
    const models = getCandidateModels();
    let lastError: unknown;

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            lastError = error;
            if (!isModelNotFoundError(error)) {
                console.error(`Gemini API error (${modelName}):`, error);
                throw toProviderError('gemini', error);
            }
        }
    }

    console.error('Gemini API model resolution error:', lastError);
    throw toProviderError('gemini', lastError);
}
