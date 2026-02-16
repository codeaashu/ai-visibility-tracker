import { defineStore } from "pinia"
import { ref } from "vue"
import type { MonitoredPrompt } from "@/interfaces/monitored_prompt"
import { getPrompts, addPrompt, deletePrompt, getPromptMonitoring, setPromptsActive, getPrompt, updatePrompt, getPromptRuns, getPromptRun, getPromptSuggestions } from "@/api/prompts"
import type { PromptMonitoringItem } from "@/interfaces/prompt_monitoring"
import type { MonitoredPromptRun } from "@/interfaces/monitored_prompt_run"
import { HTTPError } from "ky"
import { useQuotaStore } from "@edition-store/quota"

export const usePromptStore = defineStore('prompt', () => {

    const quotaStore = useQuotaStore()

    const companyPrompts = ref<Record<string, MonitoredPrompt[]>>({})
    const promptMonitoring = ref<Record<string, PromptMonitoringItem[]>>({})
    const promptDetails = ref<Record<string, MonitoredPrompt>>({})
    const promptRuns = ref<Record<string, { total: number; items: MonitoredPromptRun[] }>>({})
    const limits = ref<{ used: number; max: number }>({ used: 0, max: 0 })

    function actionReset() {
        companyPrompts.value = {}
        promptMonitoring.value = {}
        promptDetails.value = {}
        promptRuns.value = {}
        limits.value = { used: 0, max: 0 }
    }

    async function actionLoadPrompts(payload: { companyId: number }) {
        companyPrompts.value[payload.companyId] = await getPrompts(payload.companyId)
        return companyPrompts.value[payload.companyId]
    }
    
    async function actionAddPrompt(payload: { companyId: number; data: { prompt: string; prompt_type: string; target_country?: string } }) {
        try {
            const prompt = await addPrompt(payload.companyId, payload.data)
            companyPrompts.value[payload.companyId] = companyPrompts.value[payload.companyId] || []
            companyPrompts.value[payload.companyId].push(prompt)
            await quotaStore.actionLoadQuota()
            return prompt
        } catch (e) {
            if (e instanceof HTTPError && e.response.status === 400) {
                throw new Error('Monitored prompts limit reached')
            }
            throw e
        }
    }
    
    async function actionDeletePrompt(payload: { companyId: number; id: number }) {
        await deletePrompt(payload.companyId, payload.id)
        await quotaStore.actionLoadQuota()
        companyPrompts.value[payload.companyId] = companyPrompts.value[payload.companyId] || []
        companyPrompts.value[payload.companyId] = companyPrompts.value[payload.companyId].filter((p) => p.id !== payload.id)
        return companyPrompts.value[payload.companyId]
    }

    async function actionLoadPromptMonitoring(payload: { companyId: number; page: number; pageSize: number }) {
        const res = await getPromptMonitoring(payload.companyId, payload.page, payload.pageSize)
        promptMonitoring.value[payload.companyId] = res.items
        return res
    }

    async function actionSetPromptsActive(payload: { companyId: number; ids: number[]; isActive: boolean }) {
        await setPromptsActive(payload.companyId, payload.ids, payload.isActive)
        companyPrompts.value[payload.companyId] = companyPrompts.value[payload.companyId] || []
        companyPrompts.value[payload.companyId] = companyPrompts.value[payload.companyId].map((p) => {
            if (payload.ids.includes(p.id)) {
                p.is_active = payload.isActive
            }
            return p
        })
        return companyPrompts.value[payload.companyId]
    }

    async function actionLoadPrompt(payload: { companyId: number; promptId: number }) {
        const key = `${payload.companyId}/${payload.promptId}`
        const prompt = await getPrompt(payload.companyId, payload.promptId)
        promptDetails.value[key] = prompt
        return prompt
    }

    async function actionUpdatePrompt(payload: { companyId: number; promptId: number; data: { prompt: string; refresh_interval_seconds: number } }) {
        const key = `${payload.companyId}/${payload.promptId}`
        const prompt = await updatePrompt(payload.companyId, payload.promptId, payload.data)
        promptDetails.value[key] = prompt
        return prompt
    }

    async function actionLoadPromptRuns(payload: { companyId: number; promptId: number; page: number; pageSize: number }) {
        const key = `${payload.companyId}/${payload.promptId}`
        const res = await getPromptRuns(payload.companyId, payload.promptId, payload.page, payload.pageSize)
        promptRuns.value[key] = res
        return res
    }

    async function actionLoadPromptRun(payload: { companyId: number; promptId: number; runId: number }) {
        return getPromptRun(payload.companyId, payload.promptId, payload.runId)
    }

    async function actionGetPromptSuggestions(payload: { companyId: number; guidance: string }) {
        return getPromptSuggestions(payload.companyId, payload.guidance)
    }

    return {
        companyPrompts,
        promptMonitoring,
        promptDetails,
        promptRuns,
        limits,
        actionLoadPrompts,
        actionAddPrompt,
        actionDeletePrompt,
        actionReset,
        actionLoadPromptMonitoring,
        actionSetPromptsActive,
        actionLoadPrompt,
        actionUpdatePrompt,
        actionLoadPromptRuns,
        actionLoadPromptRun,
        actionGetPromptSuggestions,
    }
})