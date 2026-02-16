export interface PromptMonitoringItem {
  id: number
  prompt: string
  prompt_type: string
  is_active: boolean
  created_at: string
  openai_last_result: boolean | null
  gemini_last_result: boolean | null
  visibility: number
}
