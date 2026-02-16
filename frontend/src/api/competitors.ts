import ky from 'ky'
import type { Company } from '@/interfaces/company'
import { apiPath } from '@/api/client'

const prefix = '/api/v1/companies'

export async function getCompetitors(companyId: number) {
  return ky.get<Company[]>(apiPath(`${prefix}/${companyId}/competitors`)).json()
}

export async function addCompetitor(
  companyId: number,
  data: { name: string; website?: string }
) {
  return ky
    .post<Company>(apiPath(`${prefix}/${companyId}/competitors`), { json: data })
    .json()
}

export async function deleteCompetitor(companyId: number, competitorId: number) {
  return ky.delete(apiPath(`${prefix}/${companyId}/competitors/${competitorId}`))
}

