<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { getCrawlStatus } from '@/api/crawls'
import { useCompanyStore } from '@/stores/company'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const companyStore = useCompanyStore()

const emit = defineEmits(['crawlCompleted'])

const onboarding = useOnboardingStore()
const progress = ref(0)
const currentMessage = ref('Fetching website data')
const isError = ref(false)
const status = ref('')

const messages = [
  'Fetching website data',
  'Extracting company info',
  'Looking for competitors',
  'Finding relevant prompts',
]
let messageIndex = 0

let progressInterval: number | undefined
let pollInterval: number | undefined
let messageInterval: number | undefined

function startProgress() {
  progress.value = 0
  currentMessage.value = messages[0]
  messageIndex = 0
  const progressDuration = 120
  progressInterval = window.setInterval(() => {
    progress.value += 100 / progressDuration
    if (progress.value >= 100) {
      progress.value = 100
      window.clearInterval(progressInterval)
      progressInterval = undefined
    }
  }, 1000)
  pollInterval = window.setInterval(checkStatus, 10000)
  messageInterval = window.setInterval(() => {
    messageIndex = Math.floor(progress.value / (100 / messages.length))
    currentMessage.value = messages[messageIndex]
  }, 5000)
}

function stopProgress() {
  if (progressInterval !== undefined) {
    window.clearInterval(progressInterval)
    progressInterval = undefined
  }
  if (pollInterval !== undefined) {
    window.clearInterval(pollInterval)
    pollInterval = undefined
  }
  if (messageInterval !== undefined) {
    window.clearInterval(messageInterval)
    messageInterval = undefined
  }
}

async function checkStatus() {
  if (onboarding.companyId === null) {
    return
  }
  const result = await getCrawlStatus(onboarding.companyId)
  status.value = result.status
  if (result.status === 'success') {
    stopProgress()
    next()
  } else if (
    result.status === 'cloudflare_challenge' ||
    result.status === 'permission_denied'
  ) {
    currentMessage.value = 'The website is protected by Cloudflare or other protection. Please remove protection and retry, or provide company info manually.'
    isError.value = true
    stopProgress()
  } else if (result.status === 'failure') {
    currentMessage.value = 'Processing failed. Try again later or provide company info manually.'
    isError.value = true
    stopProgress()
  }
}

async function retry() {
  isError.value = false
  await companyStore.actionRecrawlCompany(onboarding.companyId!)
  startProgress()
}

function next() {
  emit('crawlCompleted')
}

onMounted(startProgress)

onUnmounted(stop)
</script>
<template>
    <div>
        <Progress class="h-4" :model-value="progress" />
        <p v-if="!isError">{{ currentMessage }}...</p>
        <div v-else>
          <div class="mt-4">{{ currentMessage }}</div>
          <div class="flex justify-end mt-4">
            <Button variant="outline" class="mr-4" @click="retry">Try again</Button>
            <Button variant="outline" @click="next">Continue to manual info</Button>
          </div>
        </div>
    </div>
</template>