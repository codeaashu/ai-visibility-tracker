<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getPromptMonitoring, deletePrompts, setPromptsActive } from '@/api/prompts'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import type { RowSelectionState, PaginationState, Updater } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { valueUpdater } from '@/lib/utils'
import PromptAddDialog from '@/components/PromptAddDialog.vue'
import { useQuotaStore } from '@edition-store/quota'
import PromptMonitoringTable from '@/components/PromptMonitoringTable.vue'

const quotaStore = useQuotaStore()
const props = defineProps<{ id: number }>()

const pageTitle = 'Prompt Monitoring'
const mounted = ref(false)
const items = ref<PromptMonitoringItem[]>([])
const total = ref(0)
const rowSelection = ref<RowSelectionState>({})
const selectedIds = ref<number[]>([])
const limits = ref({ used: 0, max: 0 })

const pagination = ref<PaginationState>({
  pageIndex: 0,
  pageSize: 30,
})


function updateSelectedIds() {
  selectedIds.value = Object.keys(rowSelection.value)
    .filter(key => rowSelection.value[key])
    .map(id => Number(id))
}

function updateSelected(newSelection: Updater<RowSelectionState>) {
  valueUpdater(newSelection, rowSelection)
  updateSelectedIds()
}

async function load() {
  const res = await getPromptMonitoring(props.id, pagination.value.pageIndex, pagination.value.pageSize)
  items.value = res.items
  total.value = res.total
  rowSelection.value = {}
  updateSelectedIds()
}

async function refreshLimits() {
  const res = await quotaStore.actionLoadQuota()
  limits.value = { used: res.prompts.used, max: res.prompts.total } 
}

onMounted(async () => {
  await Promise.all([load(), refreshLimits()])
  mounted.value = true
})

async function handlePaginationChange(newPagination: Updater<PaginationState>) {
  valueUpdater(newPagination, pagination)
  await load()
}

const majorityActive = computed(() => {
  const selected = items.value.filter(i => selectedIds.value.includes(i.id))
  const activeCount = selected.filter(i => i.is_active).length
  return activeCount >= selected.length / 2
})

const activationLabel = computed(() =>
  majorityActive.value ? 'Deactivate' : 'Activate',
)

async function handleDelete() {
  if (confirm("Are you sure you want to delete these prompts?")) {
    await deletePrompts(props.id, selectedIds.value)
    await load()
    await refreshLimits()
    await quotaStore.actionLoadQuota()
  }
}

async function handleToggle() {
  await setPromptsActive(props.id, selectedIds.value, !majorityActive.value)
  await load()
  await refreshLimits()
}

async function handleAdded() {
  await load()
  await refreshLimits()
}

watch(
  () => props.id,
  async () => {
    await load()
    await refreshLimits()
  },
  { immediate: true }
)
</script>

<template>
  <div class="p-4">
    <Teleport v-if="mounted" to="#page-header-teleport-target">
      {{ pageTitle }}
    </Teleport>
    <div class="flex flex-row mb-2">
      <div class="flex justify-end space-x-2">
        <PromptAddDialog :companyId="props.id" :limits="limits" @added="handleAdded" />
        <Button variant="destructive" :style="{ 'visibility': selectedIds.length === 0 ? 'hidden' : 'visible' }" @click="handleDelete">Delete</Button>
        <Button :style="{ 'visibility': selectedIds.length === 0 ? 'hidden' : 'visible' }" @click="handleToggle">{{ activationLabel }}</Button>
      </div>
      <div class="w-full text-right text-muted-foreground">Total prompts monitored on account: {{ limits.used }} / {{ limits.max }}</div>
    </div>
    <PromptMonitoringTable
      :items="items"
      :total="total"
      :companyId="props.id"
      :pagination="pagination"
      v-model:rowSelection="rowSelection"
      :onPaginationChange="handlePaginationChange"
      :onRowSelectionChange="updateSelected"
      :navigation="true"
      selectable
    />
  </div>
</template>
