export interface Recommendation {
    id: number
    company_id: number
    competitor_domain: string
    prompts_to_analyze: string
    why_competitor: string | null
    why_not_user: string | null
    what_to_do: string | null
    created_at: string
    completed_at: string | null
}

export interface RecommendationListItem {
    id: number
    competitor_name: string
    prompts_to_analyze: string[]
    completed_at: string | null
}
