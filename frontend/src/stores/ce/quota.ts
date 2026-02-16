import type { AccountQuota } from '@/interfaces/quota'

import { defineStore } from 'pinia'
import { ref } from 'vue'

const quotaCE = {
    companies: {
        used: 0,
        total: 10000,
    },
    prompts: {
        used: 0,
        total: 10000,
    },
    llm_calls: {
        used: 0,
        total: 10000,
    },
    recommendations: {
        used: 0,
        total: 10000,
    },
    users: {
        used: 0,
        total: 10000,
    },
}
export const useQuotaStore = defineStore('quota', () => {
    const quota = ref<AccountQuota>(quotaCE)

    async function actionLoadQuota() {
        return quota.value
    }

    function actionReset() {
        quota.value = quotaCE
    }

    return { quota, actionLoadQuota, actionReset }
})
