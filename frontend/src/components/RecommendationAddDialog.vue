<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PromptMonitoringTable from '@/components/PromptMonitoringTable.vue'
import { useRecommendationStore } from '@/stores/recommendation'
import { getDashboardStats } from '@/api/dashboard'
import { getPromptMonitoring } from '@/api/prompts'
import { valueUpdater } from '@/lib/utils'
import { DialogDescription } from '@/components/ui/dialog'
import type { ShareOfVoiceItem } from '@/interfaces/dashboard'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import type { RowSelectionState, PaginationState, Updater } from '@tanstack/vue-table'

const props = defineProps<{ companyId: number; limits: { used: number; max: number } }>()
const emit = defineEmits<{ (e: 'added'): void }>()

const open = ref(false)
const competitors = ref<ShareOfVoiceItem[]>([])
const competitorDomain = ref<string | null>(null)
const selectedPrompts = ref<number[]>([])
const promptsCache = ref<Record<number, PromptMonitoringItem>>({})
const recommendationStore = useRecommendationStore()

const items = ref<PromptMonitoringItem[]>([])
const total = ref(0)
const rowSelection = ref<RowSelectionState>({})
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 5 })

async function loadMonitoring() {
  if (!props.companyId) {
    return
  }
  const res = await getPromptMonitoring(props.companyId, pagination.value.pageIndex, pagination.value.pageSize)
  items.value = res.items
  total.value = res.total
  // Refresh selected items cache for those present on the current page
  for (const it of items.value) {
    promptsCache.value[it.id] = it
  }
}

async function loadData() {
  if (!props.companyId) {
    return
  }
  const stats = await getDashboardStats(props.companyId)
  competitors.value = stats.share_of_voice.slice(0, 5)
  await loadMonitoring()
}

onMounted(loadData)

const remaining = computed(() => props.limits.max - props.limits.used)

function updateSelected(newSelection: Updater<RowSelectionState>) {
  const current = rowSelection.value
  const candidate = typeof newSelection === 'function' ? newSelection(current) : newSelection
  let selectedOnPage = Object.keys(candidate).filter(k => candidate[k]).map(k => Number(k))
  let unselectedOnPage = items.value.filter(it => !selectedOnPage.includes(it.id)).map(it => it.id)
  const toRemove = unselectedOnPage.filter(id => selectedPrompts.value.includes(id))
  const toAdd = selectedOnPage.filter(id => !selectedPrompts.value.includes(id))
  const limit = 3
  if (toRemove.length > 0) {
    selectedPrompts.value = selectedPrompts.value.filter(id => !toRemove.includes(id))
  }
  if (toAdd.length > 0) {
    selectedPrompts.value = [...selectedPrompts.value, ...toAdd].slice(0, limit)
  }
  selectedOnPage = items.value.filter(it => selectedPrompts.value.includes(it.id)).map(it => it.id)
  rowSelection.value = {...selectedOnPage.reduce((acc, id) => ({ ...acc, [id]: true }), {})}
}

async function handlePaginationChange(newPagination: Updater<PaginationState>) {
  valueUpdater(newPagination, pagination)
  await loadMonitoring()
}

function removeSelected(id: number) {
  const key = String(id)
  if (rowSelection.value[key]) {
    rowSelection.value = { ...rowSelection.value, [key]: false }
  }
  selectedPrompts.value = selectedPrompts.value.filter(x => x !== id)
}

async function addRecommendation() {
    if (competitorDomain.value === null || selectedPrompts.value.length === 0) {
        return
    }
    await recommendationStore.actionCreate(props.companyId, { competitor_domain: competitorDomain.value, prompt_ids: selectedPrompts.value })
    emit('added')
    promptsCache.value = {}
    open.value = false
}

watch(() => props.companyId, async () => {
  rowSelection.value = {}
  selectedPrompts.value = []
  promptsCache.value = {}
  pagination.value = { pageIndex: 0, pageSize: 5 }
  await loadData()
})
watch(open, () => {
  if (open.value) {
    competitorDomain.value = null
    rowSelection.value = {}
    selectedPrompts.value = []
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button :disabled="remaining <= 0">Get more recommendations</Button>
    </DialogTrigger>
    <DialogContent class="sm:min-w-5xl min-w-5xl">
      <DialogHeader>
        <DialogTitle>Get more recommendations</DialogTitle>
        <DialogDescription>
          Get actionable recommendations on how to improve your results
          comparing to a competitor / attention eater for selected prompts.
        </DialogDescription>
      </DialogHeader>
      <div class="py-4 space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
        <Select v-model="competitorDomain" class="w-full">
          <SelectTrigger class="w-full h-12">
            <SelectValue v-if="!competitorDomain" placeholder="Select competitor / attention eater" />
            <div v-else class="flex">
              <img :src="`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${competitorDomain}&size=64`" class="w-6 h-6 mr-2" />
              {{ competitorDomain }}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in competitors" :key="c.domain" :value="c.domain">
              <img :src="`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${c.domain}&size=64`" class="w-8 h-8 mr-2" />
              {{ c.domain }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div>
          <div class="mb-2 text-sm text-muted-foreground">Select up to 3 prompts to get recommendations for</div>
          <div class="flex flex-wrap gap-2 mb-3">
            <div v-for="id in selectedPrompts" :key="id" class="inline-flex items-center gap-2 px-2 py-1 rounded border bg-muted">
              <span :title="promptsCache[id]?.prompt || `Prompt #${id}`">
                {{ promptsCache[id]?.prompt || `Prompt #${id}` }}
              </span>
              <button class="text-muted-foreground hover:text-foreground" @click="removeSelected(id)" title="Remove">×</button>
            </div>
          </div>
          <PromptMonitoringTable
            :columns="['select', 'prompt']"
            :items="items"
            :total="total"
            :companyId="props.companyId"
            :pagination="pagination"
            :navigation="false"
            v-model:rowSelection="rowSelection"
            :onPaginationChange="handlePaginationChange"
            :onRowSelectionChange="updateSelected"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button @click="addRecommendation" :disabled="remaining <= 0 || competitorDomain === null || selectedPrompts.length === 0">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
