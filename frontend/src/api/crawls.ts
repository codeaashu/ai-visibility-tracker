import ky from 'ky'
import { apiPath } from '@/api/client'

const prefix = '/api/v1/companies'

export async function getCrawlStatus(companyId: number) {
  return ky.get<{ status: string }>(apiPath(`${prefix}/${companyId}/crawl-status`)).json()
}

