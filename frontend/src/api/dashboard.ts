import ky from 'ky'
import type { DashboardStats } from '@/interfaces/dashboard'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import { apiPath } from '@/api/client'

const prefix = '/api/v1/dashboard'

export async function getDashboardStats(companyId: number): Promise<DashboardStats> {
  const res = await ky.get<DashboardStats>(apiPath(`${prefix}/${companyId}`)).json()
  return res
}

export async function getShareOfVoicePrompts(
  companyId: number,
  domain: string,
  page: number,
  pageSize: number,
): Promise<{ total: number; items: PromptMonitoringItem[] }> {
  const res = await ky
    .get<{ total: number; items: PromptMonitoringItem[] }>(
      apiPath(`${prefix}/${companyId}/share_of_voice/${domain}`),
      { searchParams: { skip: page * pageSize, limit: pageSize } },
    )
    .json()
  return res
}
