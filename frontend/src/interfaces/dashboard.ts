export interface ShareOfVoiceItem {
  domain: string
  count: number
  type: 'company' | 'competitor' | 'other'
}

export interface DashboardStats {
  ai_visibility_score: number
  website_citation_share: number
  total_runs: number
  share_of_voice: ShareOfVoiceItem[]
}
