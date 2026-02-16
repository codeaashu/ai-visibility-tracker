<script setup lang="ts">
import { h } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import type {
  ColumnDef,
  Row,
} from '@tanstack/vue-table'
import type { DashboardStats, ShareOfVoiceItem } from '@/interfaces/dashboard'
import { MousePointerClick } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

const mode = useColorMode({ disableTransition: false })
const isDark = computed(() => mode.value === 'dark')

const props = defineProps<{
  stats: DashboardStats
}>()

const emit = defineEmits<{
  (e: 'domain-click', domain: string): void
}>()

const columns: ColumnDef<ShareOfVoiceItem>[] = [
  {
    id: '#',
    cell: ({ row }) => h('div', { class: 'ml-4' }, row.index + 1),
    header: () => h('div', { class: 'ml-4' }, '#'),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    enableSorting: false,
    cell: ({ row }) => h(
      'div',
      {
        class: 'cursor-pointer',
      },
      [
        h(
          'img',
          {
            src: `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${row.original.domain}&size=64`,
            // src: `https://icon.horse/icon/${row.original.domain}`,
            class: 'inline mr-4 w-8 h-8',
          }
        ),
        row.original.domain,
        h(MousePointerClick, { class: 'inline ml-1 mt-[-8px]', size: 16 }),
      ]
    ),
  },
  {
    accessorKey: 'percentage',
    header: 'Share of Voice',
    enableSorting: false,
    cell: ({ row }) => (props.stats?.total_runs ? (row.original.count / props.stats.total_runs * 100).toFixed(1) : 'N/A') + '%',
  },
]

const backColors = {
  company: 'rgba(173, 216, 230, 0.7)',
  competitor: 'rgba(255, 182, 193, 0.7)',
  other: 'rgba(211, 211, 211, 0.7)',
}

// Dark mode
const backColorsDark = {
  company: 'rgba(173, 216, 230, 0.2)',
  competitor: 'rgba(255, 182, 193, 0.2)',
  other: 'rgba(211, 211, 211, 0.2)',
}

function rowStyler(row: Row<ShareOfVoiceItem>) {
  const percentage = props.stats?.total_runs ? (row.original.count / props.stats.total_runs) : 0
  const scheme = isDark.value ? backColorsDark : backColors
  const color = row.original.type === 'company' ? scheme.company : row.original.type === 'competitor' ? scheme.competitor : scheme.other
  const shareLeft = (percentage * 100).toFixed(1) + '%'
  const shareRight = (percentage * 100 + 5).toFixed(1) + '%'
  return {
    background: `linear-gradient(to right, ${color} ${shareLeft}, transparent ${shareRight})`,
  }
}

function handleRowClick(row: Row<ShareOfVoiceItem>) {
  emit('domain-click', row.original.domain)
}

</script>

<template>
  <DataTable
    :columns="columns"
    :totalItems="stats.share_of_voice.length"
    :data="stats.share_of_voice.slice(0, 20)"
    :pagination="{pageIndex: 0, pageSize: 20}"
    :showPagination="false"
    :showBorder="false"
    :onRowClick="handleRowClick"
    :rowStyler="rowStyler"
    />
</template>

