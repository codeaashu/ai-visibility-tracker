import { Brand, Mention } from './types';

/**
 * Detects brand mentions in AI-generated text
 * Uses case-insensitive exact matching and fuzzy matching
 */
export function detectBrandMentions(
    text: string,
    brands: Brand[]
): Omit<Mention, 'id' | 'scan_id' | 'detected_at'>[] {
    const mentions: Omit<Mention, 'id' | 'scan_id' | 'detected_at'>[] = [];
    const lowerText = text.toLowerCase();

    brands.forEach((brand) => {
        // Method 1: Exact match (case-insensitive)
        const brandNameLower = brand.name.toLowerCase();
        const regex = new RegExp(`\\b${escapeRegex(brandNameLower)}\\b`, 'gi');
        const matches = [...text.matchAll(regex)];

        matches.forEach((match, index) => {
            const matchIndex = match.index!;
            mentions.push({
                brand_id: brand.id,
                position: index + 1,
                context: extractContext(text, matchIndex, 150),
            });
        });

        // Method 2: Check for common variations
        // e.g., "HubSpot CRM" should match "HubSpot"
        const variations = [
            `${brandNameLower} crm`,
            `${brandNameLower} software`,
            `${brandNameLower} platform`,
            `${brandNameLower} tool`,
        ];

        variations.forEach((variation) => {
            if (lowerText.includes(variation) && !mentions.some(m => m.brand_id === brand.id)) {
                const variationIndex = lowerText.indexOf(variation);
                mentions.push({
                    brand_id: brand.id,
                    position: null,
                    context: extractContext(text, variationIndex, 150),
                });
            }
        });
    });

    return mentions;
}

/**
 * Extracts context around a match position
 */
function extractContext(text: string, position: number, length: number): string {
    const start = Math.max(0, position - length / 2);
    const end = Math.min(text.length, position + length / 2);
    let context = text.substring(start, end);

    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context.trim();
}

/**
 * Escapes special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculates visibility score (percentage of scans where brand was mentioned)
 */
export function calculateVisibilityScore(
    totalScans: number,
    totalMentions: number
): number {
    if (totalScans === 0) return 0;
    return Math.round((totalMentions / totalScans) * 100);
}
