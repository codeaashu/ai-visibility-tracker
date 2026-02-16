export interface MonitoredPromptRun {
  id: number
  run_at: string
  llm_provider: string
  llm_model: string
  brand_mentioned: boolean
  company_domain_rank: number
  top_domain: string
  raw_response?: string
}
