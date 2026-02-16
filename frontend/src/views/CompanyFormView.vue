<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import { Skeleton } from '@/components/ui/skeleton'
import type { Company, CompanyConfig } from '@/interfaces/company';
import CompanyForm from '@/components/CompanyForm.vue';
import CompetitorsForm from '@/components/CompetitorsForm.vue';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  id: number | 'new'
}>()

const router = useRouter()
const companyStore = useCompanyStore()

const isLoading = ref(false)
const isSaving = ref(false)
const mounted = ref(false)
const company = ref<Company | null>(null)

const pageTitle = computed(() => (props.id === 'new' ? 'Create Company' : 'Company Details'))

async function initData() {
  isLoading.value = true
  if (props.id !== 'new') {
    try {
      company.value = await companyStore.actionGetCompanyById(Number(props.id))
      if (!company.value) {
        // TODO: Handle not found case better, maybe redirect or show specific message
      }
    } catch (error) {
      console.error('Failed to load company:', error)
      // TODO: User-facing error
    }
  }
  isLoading.value = false
  mounted.value = true
}

onMounted(initData)

function goToDashboard(id: number) {
  router.push({ name: 'dashboard', params: { id } })
}

async function deleteCompany() {
  await companyStore.actionDeleteCompany(Number(props.id))
  const targetCompany = companyStore.companies[0]
  if (targetCompany) {
    goToDashboard(targetCompany.id)
  } else {
    router.push({ name: 'onboarding' })
  }
}

async function onSubmit(payload: CompanyConfig) {
  isSaving.value = true
  if (props.id === 'new') {
    try {
      const company = await companyStore.actionCreateCompany(payload as Omit<Company, 'id' | 'account_id' | 'created_at' | 'updated_at'>)
      goToDashboard(company.id)
    } catch (e) {
      alert((e as Error).message)
    }
  } else {
    await companyStore.actionUpdateCompany(Number(props.id), payload as Omit<Company, 'account_id' | 'created_at' | 'updated_at'>)
  }
  isSaving.value = false
}

watch(() => props.id, initData, { immediate: true })

</script>

<template>
    <div>
        <Teleport v-if="mounted" to="#page-header-teleport-target">
            {{ pageTitle }}
        </Teleport>

        <!-- Wrap form content for width limit -->
        <div class="max-w-2xl mx-auto">
            <!-- Loading State -->
            <div v-if="isLoading" class="space-y-4">
                <Skeleton class="h-8 w-1/4" />
                <Skeleton class="h-10 w-full" />
                <Skeleton class="h-20 w-full" />
                 <Skeleton class="h-10 w-full" /> {/* Keyword input placeholder */}
                 <Skeleton class="h-8 w-1/3" /> {/* Suggest button placeholder */}
                <Skeleton class="h-10 w-1/4" />
            </div>

            <!-- Not Found State -->
            <div v-else-if="props.id !== 'new' && !company && mounted" class="text-center py-16 border border-dashed rounded-lg">
                <h3 class="text-xl font-semibold mb-2">Company Not Found</h3>
                <p class="text-muted-foreground mb-4">The requested company could not be found.</p>
            </div>
            <div v-else>
              <CompanyForm class="space-y-8" 
              :company="company!" 
              :isSavingOrLoading="isLoading || isSaving"
              @submit="onSubmit" />
              <CompetitorsForm class="mb-8" :companyId="company!.id" />
              <Card class="mb-12">
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                <Dialog>
                  <DialogTrigger as-child>
                    <Button variant="destructive">Delete Company</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Company</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this company?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <DialogClose as-child>
                        <Button variant="destructive" @click="deleteCompany">Delete</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </CardContent>
              </Card>
            </div>
        </div>
    </div>
</template>
