export interface MonitoredPrompt {
  id: number
  company_id: number
  prompt: string
  prompt_type: string
  target_country: string | null
  refresh_interval_seconds: number
  last_run_at: string | null
  next_run_at: string | null
  task_scheduled_at: string | null
  created_at: string | null
  is_active: boolean
}

