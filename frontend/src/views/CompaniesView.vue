<script setup lang="ts">

import { onMounted, computed, ref } from "vue";
import { useRouter } from 'vue-router';
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card' 
import type { Company } from '@/interfaces/company';
import { useCompanyStore } from "@/stores/company";
import { useQuotaStore } from "@edition-store/quota";

const companyStore = useCompanyStore()
const quotaStore = useQuotaStore()
const router = useRouter();

const isLoading = ref(false)
const mounted = ref(false)
const companies = computed<Company[]>(() => companyStore.companies)
const remainingCompanies = computed(() => {
    const q = quotaStore.quota
    if (!q) {
        return 0
    }
    return q.companies.total - q.companies.used
})

onMounted(async () => {
    isLoading.value = true
    try {
        await Promise.all([
            companyStore.actionLoadCompanies(),
            quotaStore.actionLoadQuota(),
        ])
    } catch (error) {
        console.error("Failed to load companies:", error)
    } finally {
        isLoading.value = false
        mounted.value = true
    }
})

function goToCreateCompany() {
  router.push({ name: 'company-form', params: { id: 'new' } });
}

function viewCompany(id: number) {
   router.push({ name: 'company-details', params: { id } });
}

</script>

<template>
    <div>
        <Teleport v-if="mounted" to="#page-header-teleport-target">
            <h3 class="text-xl">Companies</h3>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger as-child>
                        <span tabindex="0">
                            <Button @click="goToCreateCompany" :disabled="remainingCompanies <= 0">Create New</Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent v-if="remainingCompanies <= 0">
                        Company limit reached
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </Teleport>

        <div v-if="isLoading" class="space-y-4">
             <Skeleton class="h-8 w-1/4" /> 
             <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <div v-for="n in 3" :key="n" class="border rounded-lg p-4 space-y-3">
                     <Skeleton class="h-6 w-3/4" /> 
                     <Skeleton class="h-4 w-full" /> 
                     <Skeleton class="h-4 w-1/2" /> 
                     <div class="flex justify-end">
                        <Skeleton class="h-8 w-1/4" /> 
                     </div>
                 </div>
             </div>
        </div>

        <div v-else-if="!companies?.length" class="text-center py-16 border border-dashed rounded-lg">
             <h3 class="text-xl font-semibold mb-2">No Companies Yet</h3>
             <p class="text-muted-foreground mb-4">Get started by creating your first company.</p>
             <Button @click="goToCreateCompany">Create Company</Button>
         </div>

         <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card v-for="company in companies" :key="company.id" class="flex flex-col">
                 <CardHeader>
                     <CardTitle>{{ company.name }}</CardTitle>
                     <CardDescription>{{ company.description || 'No description provided.' }}</CardDescription>
                 </CardHeader>
                 <CardContent class="flex-grow">
                     <p class="text-sm text-muted-foreground">
                         Created: {{ new Date(company.created_at).toLocaleDateString() }}
                     </p>
                 </CardContent>
                 <CardFooter>
                     <Button variant="outline" size="sm" @click="viewCompany(company.id)">
                         View Details
                     </Button>
                 </CardFooter>
             </Card>
         </div>
    </div>
</template>
