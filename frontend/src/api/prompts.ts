import ky from 'ky'
import type { MonitoredPrompt } from '@/interfaces/monitored_prompt'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import type { MonitoredPromptRun } from '@/interfaces/monitored_prompt_run'
import { apiPath } from '@/api/client'

const prefix = '/api/v1/prompts'

export async function getPrompts(companyId: number) {
  return ky.get<MonitoredPrompt[]>(apiPath(`${prefix}/${companyId}`)).json()
}

export async function addPrompt(
  companyId: number,
  data: { prompt: string; prompt_type: string; target_country?: string }
) {
  return ky
    .post<MonitoredPrompt>(apiPath(`${prefix}/${companyId}`), { json: data })
    .json()
}

export async function deletePrompt(companyId: number, promptId: number) {
  return ky.delete(apiPath(`${prefix}/${companyId}/${promptId}`))
}

export async function getPromptMonitoring(
  companyId: number,
  page: number,
  pageSize: number
) {
  const skip = page * pageSize
  return ky
    .get<{ total: number; items: PromptMonitoringItem[] }>(
      apiPath(`${prefix}/${companyId}/stats`),
      { searchParams: { skip, limit: pageSize } }
    )
    .json()
}

export async function deletePrompts(companyId: number, ids: number[]) {
  return ky.delete(apiPath(`${prefix}/${companyId}/bulk`), { json: { ids } })
}

export async function setPromptsActive(
  companyId: number,
  ids: number[],
  isActive: boolean
) {
  return ky.patch(apiPath(`${prefix}/${companyId}/activation`), {
    json: { ids, is_active: isActive },
  })
}

export async function getPrompt(companyId: number, promptId: number) {
  return ky.get<MonitoredPrompt>(apiPath(`${prefix}/${companyId}/${promptId}`)).json()
}

export async function updatePrompt(
  companyId: number,
  promptId: number,
  data: { prompt: string; refresh_interval_seconds: number }
) {
  return ky
    .patch<MonitoredPrompt>(apiPath(`${prefix}/${companyId}/${promptId}`), { json: data })
    .json()
}

export async function getPromptRuns(
  companyId: number,
  promptId: number,
  page: number,
  pageSize: number
) {
  const skip = page * pageSize
  return ky
    .get<{ total: number; items: MonitoredPromptRun[] }>(
      apiPath(`${prefix}/${companyId}/${promptId}/runs`),
      { searchParams: { skip, limit: pageSize } }
    )
    .json()
}

export async function getPromptRun(
  companyId: number,
  promptId: number,
  runId: number
) {
  return ky
    .get<MonitoredPromptRun>(
      apiPath(`${prefix}/${companyId}/${promptId}/runs/${runId}`)
    )
    .json()
}

export async function getPromptSuggestions(
  companyId: number,
  guidance: string
) {
  return ky
    .post<string[]>(apiPath(`${prefix}/${companyId}/suggestions`), {
      json: { guidance },
      timeout: 120_000,
    })
    .json()
}

