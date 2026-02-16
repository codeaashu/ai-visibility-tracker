
import { defineStore } from 'pinia'
import { ref } from "vue";
import { getCompanies, createCompany, updateCompany, deleteCompany, getCompanyById, createPromptSuggestions, createCompetitorSuggestions, recrawlCompany } from "@/api/companies";
import type { Company, CompanyConfig } from '@/interfaces/company';
import { getCompetitors, addCompetitor, deleteCompetitor } from '@/api/competitors';
import { HTTPError } from "ky";
import { useQuotaStore } from "@edition-store/quota";
        
export const useCompanyStore = defineStore('company', () => {

    const companies = ref<Company[]>([])
    const competitors = ref<Record<string, Company[]>>({})
    const activeCompanyId = ref<number | null>(null)
    const quotaStore = useQuotaStore()

    function actionReset(){
        companies.value = []
        competitors.value = {}
    }

    async function actionLoadCompanies() {
        companies.value = await getCompanies()
    }

    async function actionGetCompanyById(id: number): Promise<Company | null> {
        try {
            const company = await getCompanyById(id);
            return company;
        } catch (error) {
            console.error(`Failed to get company with id ${id}:`, error);
            return null;
        }
    }

    async function actionCreateCompany(data: Omit<Company, 'id' | 'account_id' | 'created_at' | 'updated_at'>) {
        try {
            const company = await createCompany(data)
            await actionLoadCompanies()
            await quotaStore.actionLoadQuota()
            return company
        } catch (e) {
            if (e instanceof HTTPError && e.response.status === 400) {
                throw new Error('Company limit reached')
            }
            throw e
        }
    }

    async function actionUpdateCompany(id: number, data: CompanyConfig) {
        await updateCompany(id, data)
        await actionLoadCompanies()
    }

    async function actionCreatePromptSuggestions(companyId: number) {
        await createPromptSuggestions(companyId)
        await actionLoadCompanies()
    }

    async function actionCreateCompetitorsSuggestions(companyId: number) {
        await createCompetitorSuggestions(companyId)
        await actionLoadCompanies()
    }

    async function actionDeleteCompany(id: number) {
        await deleteCompany(id)
        await quotaStore.actionLoadQuota()
        await actionLoadCompanies()
    }

    async function actionLoadCompetitors(companyId: number) {
        competitors.value[companyId] = await getCompetitors(companyId)
        return competitors.value[companyId]
    }

    async function actionAddCompetitor(companyId: number, data:CompanyConfig) {
        const competitor = await addCompetitor(companyId, data)
        await actionLoadCompetitors(companyId)
        return competitor
    }

    async function actionDeleteCompetitor(companyId: number, id: number) {
        await deleteCompetitor(companyId, id)
        await actionLoadCompetitors(companyId)
    }

    async function actionRecrawlCompany(companyId: number) {
        await recrawlCompany(companyId)
        await actionLoadCompanies()
    }

    return {
        companies,
        competitors,
        activeCompanyId,
        actionLoadCompanies,
        actionReset,
        actionGetCompanyById,
        actionCreateCompany,
        actionUpdateCompany,
        actionDeleteCompany,
        actionCreatePromptSuggestions,
        actionCreateCompetitorsSuggestions,
        actionLoadCompetitors,
        actionAddCompetitor,
        actionDeleteCompetitor,
        actionRecrawlCompany,
    }
})
