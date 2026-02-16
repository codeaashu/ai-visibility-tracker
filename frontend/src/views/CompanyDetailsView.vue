<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompanyStore } from '@/stores/company'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const router = useRouter()
const props = defineProps<{
    id: number
}>()
const companyStore = useCompanyStore()

const isLoading = ref(false)
const mounted = ref(false)

const company = computed(() => companyStore.companies.find(c => c.id === props.id))

onMounted(async () => {
    isLoading.value = true
    try {
        await companyStore.actionLoadCompanies()
    } catch (error) {
        console.error('Failed to load companies:', error)
    } finally {
        isLoading.value = false
        mounted.value = true
    }
})

function goToCompanies() {
    router.push({ name: 'companies' })
}

</script>

<template>
    <div>
        <Teleport v-if="mounted" to="#page-header-teleport-target">
            <h3 class="text-lg font-normal">Company <template v-if="company?.name">"{{ company.name }}"</template></h3>
        </Teleport>

        <div v-if="isLoading" class="space-y-4">
            <Skeleton class="h-8 w-1/4" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-20 w-full" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-8 w-1/3" />
            <Skeleton class="h-8 w-1/4" />
        </div>

        <div v-else-if="!company && mounted" class="text-center py-16 border border-dashed rounded-lg">
            <h3 class="text-xl font-semibold mb-2">Company Not Found</h3>
            <p class="text-muted-foreground mb-4">The requested company could not be found.</p>
            <Button @click="goToCompanies" :disabled="isLoading">Back to Companies</Button>
        </div>

        <div v-else class="space-y-8">
            <Card>
                <CardContent>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div v-if="company?.description">
                            <span class="font-semibold text-foreground">Description:</span>
                            <p class="text-muted-foreground">{{ company.description }}</p>
                        </div>
                        <div v-if="company?.name_aliases">
                            <span class="font-semibold text-foreground">Name Aliases:</span>
                            <p class="text-muted-foreground">{{ company.name_aliases }}</p>
                        </div>
                        <div v-if="company?.llm_understanding">
                            <span class="font-semibold text-foreground">LLM Understanding:</span>
                            <p class="text-muted-foreground">{{ company.llm_understanding }}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>