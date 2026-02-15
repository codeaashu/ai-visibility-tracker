export interface Brand {
    id: string;
    name: string;
    category: string | null;
    website: string | null;
    created_at: string;
}

export interface Query {
    id: string;
    text: string;
    category: string | null;
    is_template: boolean;
    created_at: string;
}

export interface Scan {
    id: string;
    query_id: string;
    ai_platform: 'chatgpt' | 'gemini' | 'perplexity';
    raw_response: string;
    executed_at: string;
    status: 'pending' | 'completed' | 'failed';
}

export interface Mention {
    id: string;
    scan_id: string;
    brand_id: string;
    position: number | null;
    context: string | null;
    detected_at: string;
}

export interface ScanWithQuery extends Scan {
    queries: Query;
}

export interface MentionWithBrand extends Mention {
    brands: Brand;
}

export interface VisibilityMetrics {
    totalScans: number;
    totalMentions: number;
    visibilityScore: number;
    platformBreakdown: {
        platform: string;
        mentions: number;
    }[];
    trendData: {
        date: string;
        mentions: number;
    }[];
}
