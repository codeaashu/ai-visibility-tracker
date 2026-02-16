import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOnboardingStore = defineStore('onboarding', () => {
  const companyId = ref<number | null>(null)
  const step = ref(1)

  function setCompanyId(id: number) {
    companyId.value = id
  }

  function setStep(value: number) {
    step.value = value
  }

  function reset() {
    companyId.value = null
    step.value = 1
  }

  return {
    companyId,
    step,
    setCompanyId,
    setStep,
    reset,
  }
})

