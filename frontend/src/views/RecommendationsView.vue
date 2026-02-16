<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import { useQuotaStore } from '@edition-store/quota'
import RecommendationAddDialog from '@/components/RecommendationAddDialog.vue'
import DataTable from '@/components/ui/DataTable.vue'
import type { RecommendationListItem } from '@/interfaces/recommendation'
import type { ColumnDef, PaginationState, Updater } from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import { RouterLink } from 'vue-router'
import { h } from 'vue'
import { Clock } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{ id: number }>()

const pageTitle = 'Recommendations'
const mounted = ref(false)
const items = ref<RecommendationListItem[]>([])
const total = ref(0)
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 30 })
const limits = ref({ used: 0, max: 0 })

const recommendationStore = useRecommendationStore()
const quotaStore = useQuotaStore()

async function load() {
    const res = await recommendationStore.actionList(props.id, pagination.value.pageIndex, pagination.value.pageSize)
    items.value = res.items
    total.value = res.total
}

async function refreshLimits() {
    const res = await quotaStore.actionLoadQuota()
    limits.value = { used: res.recommendations.used, max: res.recommendations.total }
}

onMounted(async () => {
    await Promise.all([load(), refreshLimits()])
    mounted.value = true
})

function handlePaginationChange(newPagination: Updater<PaginationState>) {
    valueUpdater(newPagination, pagination)
    load()
}

async function handleAdded() {
    await load()
    await refreshLimits()
}

const columns: ColumnDef<RecommendationListItem>[] = [
    { accessorKey: 'competitor_domain', header: 'Competitor', enableSorting: false },
    {
        accessorKey: 'completed_at',
        header: 'Completed',
        enableSorting: false,
        cell: ({ row }) =>
            row.original.completed_at
                ? new Date(row.original.completed_at).toLocaleString()
                : h(Clock, { class: 'h-4 w-4' }),
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) =>
            row.original.completed_at
                ? h(
                    RouterLink,
                    { to: { name: 'recommendation-details', params: { id: props.id, recId: row.original.id } } },
                    () => h(Button, { variant: 'default', size: 'sm' }, () => 'View'),
                )
                : null,
    },
]
</script>

<template>
  <div class="p-4">
    <Teleport v-if="mounted" to="#page-header-teleport-target">{{ pageTitle }}</Teleport>
    <div class="flex flex-row mb-2">
      <div class="flex justify-end space-x-2">
        <RecommendationAddDialog :companyId="props.id" :limits="limits" @added="handleAdded" />
      </div>
      <div class="w-full text-right text-muted-foreground">
        Total recommendations generated on account: {{ limits.used }} / {{ limits.max }}
      </div>
    </div>
    <DataTable
      :columns="columns"
      :data="items"
      :totalItems="total"
      v-model:pagination="pagination"
      :onPaginationChange="handlePaginationChange"
      :showPagination="true"
    />
  </div>
</template>
