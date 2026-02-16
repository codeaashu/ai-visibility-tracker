<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { usePromptStore } from '@/stores/prompt'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import LoadingButton from '@/components/ui/loading-button.vue'

const placeholderManual = 'Enter prompt text...'
const placeholderSuggestions = 'Enter LLM guidance... E.g. "Suggest prompts with buying intent"'

const props = defineProps<{ companyId: number; limits: { used: number; max: number } }>()
const emit = defineEmits<{ (e: 'added'): void }>()

const open = ref(false)
const mode = ref<'manual' | 'suggestions'>('manual')
const promptText = ref('')
const promptType = ref('product')
const guidance = ref('')
const suggestions = ref<string[]>([])
const selected = ref<Record<number, boolean>>({})
const loading = ref(false)
const store = usePromptStore()

const remaining = computed(() => props.limits.max - props.limits.used)
const selectedCount = computed(() => Object.values(selected.value).filter(Boolean).length)
const disableManual = computed(() => remaining.value <= 0 || promptText.value.trim() === '')
const disableSuggestions = computed(() => remaining.value <= 0 || selectedCount.value === 0 || selectedCount.value > remaining.value)

async function loadSuggestions() {
  if (!guidance.value) return
  loading.value = true
  try {
    suggestions.value = await store.actionGetPromptSuggestions({ companyId: props.companyId, guidance: guidance.value })
    selected.value = {}
  } finally {
    loading.value = false
  }
}

async function addManual() {
  try {
    await store.actionAddPrompt({ companyId: props.companyId, data: { prompt: promptText.value, prompt_type: promptType.value } })
    emit('added')
    promptText.value = ''
    promptType.value = 'product'
    open.value = false
  } catch (e: any) {
    alert(e.message)
  }
}

async function addSuggestions() {
  const prompts = suggestions.value.filter((_, idx) => selected.value[idx])
  try {
    await Promise.all(
      prompts.map(p =>
        store.actionAddPrompt({ companyId: props.companyId, data: { prompt: p, prompt_type: 'product' } })
      )
    )
    emit('added')
    open.value = false
    suggestions.value = []
    guidance.value = ''
  } catch (e: any) {
    alert(e.message)
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
            <span tabindex="0">
              <DialogTrigger as-child>
                <Button :disabled="remaining <= 0">Add prompts</Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
        <TooltipContent>
          <p class="max-w-xs" v-if="remaining > 0">
            {{ remaining }}/{{ props.limits.max }} prompts available
          </p>
          <p class="max-w-xs" v-else>
            {{ props.limits.max }} prompts limit reached
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <DialogContent class="min-w-[800px] max-h-[85vh] overflow-hidden flex flex-col p-4 pt-2">
      <DialogHeader class="sticky top-0 bg-background border-b px-6 py-4">
        <DialogTitle>Add Prompts</DialogTitle>
      </DialogHeader>
      <div class="flex-1 overflow-y-auto">
      <div class="mb-4 flex space-x-4 ">
        <label class="flex items-center space-x-1">
          <input type="radio" value="manual" v-model="mode" />
          <span>Manual</span>
        </label>
        <label class="flex items-center space-x-1">
          <input type="radio" value="suggestions" v-model="mode" />
          <span>Suggestions</span>
        </label>
      </div>
      <div v-if="mode === 'manual'" class="space-y-2">
        <Textarea 
          v-model="promptText" 
          :placeholder="placeholderManual"
        />
        <Select v-model="promptType">
          <SelectTrigger class="w-40">
            <SelectValue :placeholder="promptType" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="expertise">Expertise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div v-else class="space-y-2">
        <Textarea v-model="guidance" :placeholder="placeholderSuggestions" />
        <LoadingButton @click="loadSuggestions" :loading="loading" :disabled="!guidance || loading" loading-text="Generating...">
          Get prompts suggestions
        </LoadingButton>
        <div v-if="suggestions.length" class="space-y-1">
          <div v-for="(s, idx) in suggestions" :key="idx" class="flex items-center space-x-2">
            <Checkbox :modelValue="selected[idx] || false" @update:modelValue="val => selected[idx] = val as boolean" />
            <span>{{ s }}</span>
          </div>
        </div>
      </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button v-if="mode === 'manual'" :disabled="disableManual" @click="addManual">Confirm</Button>
        <Button v-else :disabled="disableSuggestions" @click="addSuggestions">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
