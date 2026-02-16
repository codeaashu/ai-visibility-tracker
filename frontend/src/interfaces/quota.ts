export interface QuotaValue {
    used: number
    total: number
}

export interface AccountQuota {
    companies: QuotaValue
    users: QuotaValue
    prompts: QuotaValue
    llm_calls: QuotaValue
    recommendations: QuotaValue
}
