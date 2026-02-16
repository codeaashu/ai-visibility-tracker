import ky from 'ky'
import type { Recommendation, RecommendationListItem } from '@/interfaces/recommendation'
import { apiPath } from '@/api/client'

const prefix = '/api/v1/recommendations'

export async function listRecommendations(companyId: number, page: number, pageSize: number) {
  const skip = page * pageSize
  return ky.get<{ total: number; items: RecommendationListItem[] }>(apiPath(`${prefix}/${companyId}`), { searchParams: { skip, limit: pageSize } }).json()
}

export async function createRecommendation(companyId: number, data: { competitor_domain: string; prompt_ids: number[] }) {
  return ky.post<Recommendation>(apiPath(`${prefix}/${companyId}`), { json: data }).json()
}

export async function getRecommendation(companyId: number, recId: number) {
  return ky.get<Recommendation>(apiPath(`${prefix}/${companyId}/${recId}`)).json()
}

export async function shareRecommendation(companyId: number, recId: number, data: { email: string; subject: string }) {
  await ky.post(apiPath(`${prefix}/${companyId}/${recId}/share`), { json: data })
}
