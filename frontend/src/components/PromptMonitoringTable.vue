<script setup lang="ts">
import { computed, h } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, CircleOff, MousePointerClick } from 'lucide-vue-next'
import type {
  ColumnDef,
  PaginationState,
  Updater,
  RowSelectionState,
} from '@tanstack/vue-table'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import { RouterLink } from 'vue-router'

const props = defineProps<{
  compact?: boolean
  columns?: string[]
  navigation?: boolean
  items: PromptMonitoringItem[]
  total: number
  companyId: number
  pagination: PaginationState
  onPaginationChange: (payload: Updater<PaginationState>) => void
  onRowSelectionChange?: (payload: Updater<RowSelectionState>) => void
}>()

const rowSelection = defineModel<RowSelectionState>('rowSelection', { default: () => ({}) })
const pagination = defineModel<PaginationState>('pagination',{ required: true })

const compactColumnsList = ['prompt', 'visibility']

const allColumns: ColumnDef<PromptMonitoringItem>[] = [
    {
    id: '#',
    cell: ({ row }) => h('div', { class: 'ml-2' }, row.index + pagination.value.pageIndex * pagination.value.pageSize + 1),
    header: () => h('div', { class: 'ml-2' }, '#'),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'select',
    header: ({ table }) =>
      h(Checkbox, {
        modelValue: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate"),
        "onUpdate:modelValue": value => table.toggleAllPageRowsSelected(!!value),
        "ariaLabel": "Select all",
        "class": "h-5 w-5",
      }),
    cell: ({ row }) => h(Checkbox, {
      "modelValue": row.getIsSelected(),
      "onUpdate:modelValue": value => row.toggleSelected(!!value),
      "ariaLabel": "Select row",
      "class": "h-5 w-5",
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'prompt',
    accessorKey: 'prompt',
    header: 'Prompt',
    enableSorting: false,
    cell: ({ row }) =>
      props.navigation || props.navigation === undefined
      ? h(
        RouterLink,
        {
          to: { name: 'prompt-details', params: { id: props.companyId, promptId: row.original.id } },
          class: "text-wrap"
        },
        () => [row.original.prompt, h(MousePointerClick, { class: "inline ml-1 mt-[-8px]", size: 16 })],
      )
      : row.original.prompt,
  },
  {
    id: 'prompt_type',
    accessorKey: 'prompt_type',
    header: 'Prompt Type',
    enableSorting: false,
  },
  {
    id: 'openai',
    accessorKey: 'openai_last_result',
    header: 'OpenAI',
    enableSorting: false,
    cell: ({ row }) => {
      const v = row.original.openai_last_result
      return v === null ? 'N/A' : v ? h('span', { class: "text-positive" }, 'Yes') : 'No'
    },
  },
  {
    id: 'gemini',
    accessorKey: 'gemini_last_result',
    header: 'Gemini',
    enableSorting: false,
    cell: ({ row }) => {
      const v = row.original.gemini_last_result
      return v === null ? 'N/A' : v ? h('span', { class: "text-positive" }, 'Yes') : 'No'
    },
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: 'Visibility',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.openai_last_result === null && row.original.gemini_last_result === null
        ? 'N/A'
        : `${Math.round(row.original.visibility * 100)}%`,
  },
  {
    id: 'active',
    header: 'Active',
    cell: ({ row }) => row.original.is_active
                      ? h(CheckCircle, {
                          class: 'h-4 w-4 text-green-500',
                        })
                      : h(CircleOff, {
                          class: 'h-4 w-4 text-muted-foreground',
                        }),
  },
]
const columnsToShow = computed(() => props.columns || (props.compact ? compactColumnsList : allColumns.map(col => col.id)))

const columns = computed(() => allColumns.filter(col => columnsToShow.value.includes(col.id!)))

</script>

<template>
  <DataTable
    :columns="columns"
    :totalItems="total"
    :data="items"
    v-model:rowSelection="rowSelection"
    v-model:pagination="pagination"
    :onPaginationChange="onPaginationChange"
    :onRowSelectionChange="onRowSelectionChange"
    :showPagination="true"
  />
</template>

