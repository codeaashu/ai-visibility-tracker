import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Recommendation, RecommendationListItem } from '@/interfaces/recommendation'
import { listRecommendations, createRecommendation, getRecommendation, shareRecommendation } from '@/api/recommendations'
import { useQuotaStore } from '@edition-store/quota'

export const useRecommendationStore = defineStore('recommendation', () => {
    const items = ref<Record<number, { total: number; items: RecommendationListItem[] }>>({})
    const details = ref<Record<string, Recommendation>>({})
    const quotaStore = useQuotaStore()

    function actionReset() {
        items.value = {}
        details.value = {}
    }

    async function actionList(companyId: number, page: number, pageSize: number) {
        const res = await listRecommendations(companyId, page, pageSize)
        items.value[companyId] = res
        return res
    }

    async function actionCreate(companyId: number, data: { competitor_domain: string; prompt_ids: number[] }) {
        const rec = await createRecommendation(companyId, data)
        await quotaStore.actionLoadQuota()
        return rec
    }

    async function actionGet(companyId: number, recId: number) {
        const key = `${companyId}/${recId}`
        const rec = await getRecommendation(companyId, recId)
        details.value[key] = rec
        return rec
    }

    async function actionShare(companyId: number, recId: number, data: { email: string; subject: string }) {
        await shareRecommendation(companyId, recId, data)
    }

    return { items, details, actionList, actionCreate, actionGet, actionShare, actionReset }
})
