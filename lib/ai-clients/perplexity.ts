import OpenAI from 'openai';
import { toProviderError } from './errors';

export async function queryPerplexity(prompt: string, apiKey?: string): Promise<string> {
  try {
    const key = apiKey || process.env.PERPLEXITY_API_KEY;
    if (!key) {
      throw new Error('Perplexity API key missing');
    }

    const client = new OpenAI({
      apiKey: key,
      baseURL: 'https://api.perplexity.ai',
    });

    const completion = await client.chat.completions.create({
      model: process.env.PERPLEXITY_MODEL || 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    throw toProviderError('perplexity', error);
  }
}
