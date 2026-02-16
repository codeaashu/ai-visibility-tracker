<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOnboardingStore } from '@/stores/onboarding'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form'
import OnboardingStepper from '@/components/onboarding/OnboardingStepper.vue'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress.vue'
import CompetitorsForm from '@/components/CompetitorsForm.vue'
import CompanyForm from '@/components/CompanyForm.vue'
import { useCompanyStore } from '@/stores/company'
import { usePromptStore } from '@/stores/prompt'
import { normalizeUrl, isValidUrl } from '@/lib/utils'
import type { CompanyConfig } from '@/interfaces/company'

const onboarding = useOnboardingStore()
const companyStore = useCompanyStore()
const promptStore = usePromptStore()
const router = useRouter()

const prompts = computed(() => {
    if (onboarding.companyId === null) {
        return []
    }
    return promptStore.companyPrompts[onboarding.companyId]
})
const company = computed(() => {
    if (onboarding.companyId === null) {
        return null
    }
    return companyStore.companies.find((c) => c.id === onboarding.companyId)
})
const newPrompt = ref('')
const isReviewLoading = ref(false)

const steps = [
  {
    step: 1,
    title: "Company details",
  },
  {
    step: 2,
    title: "Data Extraction",
  },
  {
    step: 3,
    title: "Review Data",
  },
  {
    step: 4,
    title: "Prompts & Competitors",
  },
]

const companyFormSchema = toTypedSchema(z.object({
  companyName: z.string().min(2).max(50),
  companyWebsite: z.string().min(1).refine((value) => {
    return isValidUrl(normalizeUrl(value))
  }, { message: 'Invalid URL' }),
}))

const { handleSubmit: handleCompanySubmit } = useForm({
  validationSchema: companyFormSchema,
})

const submitCompany = handleCompanySubmit(async (values) => {
  try {
    const company = await companyStore.actionCreateCompany({
      name: values.companyName,
      description: '',
      name_aliases: null,
      website: normalizeUrl(values.companyWebsite),
      llm_understanding: '',
    })
    onboarding.setCompanyId(company.id)
    onboarding.setStep(2)
  } catch (e) {
    alert((e as Error).message)
  }
})

async function loadData() {
  if (onboarding.companyId === null) {
    return
  }
  await Promise.all([
    companyStore.actionLoadCompanies(),
    promptStore.actionLoadPrompts({ companyId: onboarding.companyId }),
    companyStore.actionLoadCompetitors(onboarding.companyId),
  ])
}

async function crawlCompleted() {
  await loadData()
  onboarding.setStep(3)
}

async function addPromptItem() {
  if (onboarding.companyId === null) {
    return
  }
  await promptStore.actionAddPrompt({ companyId: onboarding.companyId, data: {
    prompt: newPrompt.value,
    prompt_type: 'product',
  }})
  newPrompt.value = ''
}

async function removePrompt(id: number) {
  if (onboarding.companyId === null) {
    return
  }
  await promptStore.actionDeletePrompt({ companyId: onboarding.companyId, id })
}

async function finish() {
  const promptIds = promptStore.companyPrompts[onboarding.companyId!].map((p) => p.id)
  await promptStore.actionSetPromptsActive({ companyId: onboarding.companyId!, ids: promptIds, isActive: true })
  router.push({ name: 'prompts', params: { id: onboarding.companyId } })
}

async function onReviewSubmit(values: CompanyConfig) {
  if (onboarding.companyId === null) {
    return
  }
  isReviewLoading.value = true
  await companyStore.actionUpdateCompany(onboarding.companyId, values)
  await Promise.all([
    companyStore.actionCreatePromptSuggestions(onboarding.companyId),
    companyStore.actionCreateCompetitorsSuggestions(onboarding.companyId),
  ])
  await loadData()
  onboarding.setStep(4)
  isReviewLoading.value = false
}

onMounted(() => {
  onboarding.reset()
})

</script>

<template>
  <div class="p-4">
    <OnboardingStepper :steps="steps" :step="onboarding.step" />
  <form class="space-y-4 mt-8 w-2/3 max-w-md mx-auto" @submit="submitCompany" v-if="onboarding.step === 1">
    <FormField v-slot="{ componentField }" 
      name="companyName" 
      :validate-on-input="false" 
      :validate-on-model-update="false" 
      :validate-on-change="false"
      :validate-on-blur="false">
      <FormItem>
        <FormLabel>Company Name</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="Acme Inc." />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" 
      name="companyWebsite" 
      :validate-on-input="false" 
      :validate-on-model-update="false" 
      :validate-on-change="false"
      :validate-on-blur="false">
      <FormItem>
        <FormLabel>Company Website</FormLabel>
        <FormControl>
          <Input placeholder="https://example.com/" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="flex justify-end space-x-2">
      <Button type="submit">Next</Button>
    </div>
  </form>
  <div class="space-y-4 mt-8 w-2/3 max-w-md mx-auto" v-else-if="onboarding.step === 2">
    <OnboardingProgress @crawlCompleted="crawlCompleted" />
  </div>
  <div class="space-y-4 mt-8 w-2/3 max-w-md mx-auto" v-else-if="onboarding.step === 3">
    <CompanyForm :company="company!" :isSavingOrLoading="isReviewLoading" @submit="onReviewSubmit" />
  </div>
  <div class="space-y-6 mt-8 w-2/3 max-w-2xl mx-auto" v-if="onboarding.step === 4">
    <div>
      <h2 class="mb-2 font-medium">Prompts</h2>
      <ol class="mb-2 list-decimal">
          <li
            v-for="prompt in prompts"
            :key="prompt.id"
            
          >
          <div class="flex items-center justify-between">
            <span>{{ prompt.prompt }}</span>
            <Button
              variant="outline"
              @click="removePrompt(prompt.id)"
              class="mt-2"
            >
              Remove
            </Button>
          </div>
          </li>
        </ol>
        <div class="flex space-x-2">
          <Input v-model="newPrompt" />
          <Button @click="addPromptItem">Add</Button>
        </div>
      </div>
      <CompetitorsForm :companyId="onboarding.companyId!" />
      <div class="flex justify-end space-x-2">
        <Button @click="finish">Done! Continue to prompt monitoring</Button>
      </div>
    </div>
  </div>
</template>

