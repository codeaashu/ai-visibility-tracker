import OpenAI from 'openai';
import { toProviderError } from './errors';

export async function queryChatGPT(prompt: string, apiKey?: string): Promise<string> {
    try {
        const openai = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        return completion.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw toProviderError('openai', error);
    }
}
