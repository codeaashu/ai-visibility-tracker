<script setup lang="ts">
import { ref, onMounted, watch, computed, h } from 'vue'
import { usePromptStore } from '@/stores/prompt'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DataTable from '@/components/ui/DataTable.vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { MonitoredPromptRun } from '@/interfaces/monitored_prompt_run'
import { marked } from 'marked'
import { valueUpdater } from '@/lib/utils'
import { type ColumnDef, type PaginationState, type Updater, type Row, type RowSelectionState } from '@tanstack/vue-table'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { MousePointerClick } from 'lucide-vue-next'

interface Citation {
  url: string
  title: string
}

const props = defineProps<{ companyId: number; promptId: number }>()

const store = usePromptStore()
const prompt = ref('')
const refreshIntervalDays = ref('1')
const intervalOptions = ['1', '3', '7', '14', '30']
const runs = ref<MonitoredPromptRun[]>([])
const total = ref(0)
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 30 })
const rowSelection = ref<RowSelectionState>({})
const dialogOpen = ref(false)
const runDetail = ref<MonitoredPromptRun | null>(null)
const pageTitle = 'Prompt Details'
const mounted = ref(false)

const providerHumanName = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'gemini': 'Google Gemini',
}
  

async function load() {
  const [p, res] = await Promise.all([
    store.actionLoadPrompt({ companyId: props.companyId, promptId: props.promptId }),
    store.actionLoadPromptRuns({ companyId: props.companyId, promptId: props.promptId, page: pagination.value.pageIndex, pageSize: pagination.value.pageSize })
  ])
  prompt.value = p.prompt
  refreshIntervalDays.value = String(p.refresh_interval_seconds / 86400)
  runs.value = res.items
  total.value = res.total
}

onMounted(async () => {
  await load()
  mounted.value = true
})

watch(() => [props.companyId, props.promptId], async () => {
  await load()
})

async function handlePaginationChange(newPagination: Updater<PaginationState>) {
  valueUpdater(newPagination, pagination)
  const res = await store.actionLoadPromptRuns({ companyId: props.companyId, promptId: props.promptId, page: pagination.value.pageIndex, pageSize: pagination.value.pageSize })
  runs.value = res.items
  total.value = res.total
}

function updateRowSelection(newSelection: Updater<RowSelectionState>) {
  valueUpdater(newSelection, rowSelection)
}

async function handleSave() {
  const updated = await store.actionUpdatePrompt({ companyId: props.companyId, promptId: props.promptId, data: { prompt: prompt.value, refresh_interval_seconds: Number(refreshIntervalDays.value) * 86400 } })
  prompt.value = updated.prompt
  refreshIntervalDays.value = String(updated.refresh_interval_seconds / 86400)
  toast.success('Prompt settings saved')
}

async function handleRowClick(row: Row<MonitoredPromptRun>) {
  runDetail.value = await store.actionLoadPromptRun({ companyId: props.companyId, promptId: props.promptId, runId: row.original.id })
  dialogOpen.value = true
}

function parseOpenAiResponse(parsed: unknown): { text: string; citations: Citation[] } {
  const message: Record<string, any> = (parsed as any).message || {}
  const content: string = message.content || ''
  const annotations: any[] = message.annotations || []
  let result = ''
  let last = 0
  const citations: Citation[] = []
  const seen = new Map<string, number>()
  annotations.sort((a, b) => a.url_citation.start_index - b.url_citation.start_index)
  for (const ann of annotations) {
    const start = ann.url_citation.start_index
    const end = ann.url_citation.end_index
    result += content.slice(last, start)
    const url: string = ann.url_citation.url
    const title: string = ann.url_citation.title
    if (!seen.has(url)) {
      seen.set(url, citations.length)
      citations.push({ url, title })
    }
    const segment = content.slice(start, end)
    result += `[${segment}](${url})`
    last = end
  }
  result += content.slice(last)
  return { text: result, citations }
}

function parseGeminiResponse(parsed: any): { text: string; citations: Citation[] } {
    let text = parsed.text;
    const supports = parsed.grounding_metadata?.grounding_supports;
    const chunks = parsed.grounding_metadata?.grounding_chunks;
    const citations: Citation[] = []
    for (const chunk of chunks) {
      if (!chunk.web) {
        continue
      }
      citations.push({ url: chunk.web.uri, title: chunk.web.title })
    }

    // Sort supports by end_index in descending order to avoid shifting issues when inserting.
    const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.end_index ?? 0) - (a.segment?.end_index ?? 0),
    );

    for (const support of sortedSupports) {
        const endIndex = support.segment?.end_index;
        if (endIndex === undefined || !support.grounding_chunk_indices?.length) {
        continue;
        }

        const citationLinks = support.grounding_chunk_indices
        .map((i: any) => {
            const uri = chunks[i]?.web?.uri;
            if (uri) {
            return `[${i + 1}](${uri})`;
            }
            return null;
        })
        .filter(Boolean);

        if (citationLinks.length > 0) {
        const citationString = citationLinks.join(", ");
        text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
        }
    }

    return {text, citations};
}

const runResponse = computed(() => {
  if (!runDetail.value) {
    return { text: '', citations: [] as Citation[] }
  }
  const raw = runDetail.value.raw_response || ''
  try {
    const parsed = JSON.parse(raw)
    if (runDetail.value.llm_provider.toLowerCase().includes('gemini')) {
      return parseGeminiResponse(parsed)
    }
    if (runDetail.value.llm_provider.toLowerCase().includes('openai')) {
      return parseOpenAiResponse(parsed)
    }
    const text = parsed.choices?.[0]?.message?.content || raw
    return { text, citations: [] }
  } catch {
    return { text: raw, citations: [] }
  }
})

const columns: ColumnDef<MonitoredPromptRun>[] = [
  { accessorKey: 'run_at',
    cell: ({ row }) => h('div', { class: "cursor-pointer" }, [new Date(row.original.run_at).toLocaleString(), h(MousePointerClick, { class: "inline ml-1 mt-[-8px]", size: 16 })]),
    header: 'Run At' 
  },
  { accessorKey: 'llm_provider', header: 'Provider', cell: ({ row }) => providerHumanName[row.original.llm_provider as keyof typeof providerHumanName] || row.original.llm_provider },
  // { accessorKey: 'llm_model', header: 'Model' },
  {
    accessorKey: 'brand_mentioned',
    header: 'Brand Mentioned',
    cell: ({ row }) => (row.original.brand_mentioned ? h('span', { class: "text-positive" }, 'Yes') : 'No'),
  },
  {
    accessorKey: 'company_domain_rank',
    header: 'Website Cited',
    cell: ({ row }) => (!!row.original.company_domain_rank ? h('span', { class: "text-positive" }, 'Yes') : 'No'),
  },
  {
    accessorKey: 'top_domain',
    header: '1st source',
    cell: ({ row }) => (row.original.top_domain),
  },
]
</script>

<template>
  <div class="p-4 space-y-4">
    <Teleport v-if="mounted" to="#page-header-teleport-target">
      {{ pageTitle }}
    </Teleport>
    <div class="space-y-2">
      <Label for="prompt">Prompt Text</Label>
      <div class="p-2">{{prompt}}</div>
      <Label for="refreshIntervalDays">Refresh interval</Label>
      <div class="flex items-center space-x-2">
        <Select v-model="refreshIntervalDays">
          <SelectTrigger class="w-40">
            <SelectValue :placeholder="`${refreshIntervalDays}d`" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="d in intervalOptions" :key="d" :value="d">
              {{ d }}d
            </SelectItem>
          </SelectContent>
        </Select>
        <div class="flex-1 text-right space-x-2">
          <Button variant="outline" as-child>
            <RouterLink :to="{ name: 'prompts', params: { id: props.companyId } }">Back</RouterLink>
          </Button>
          <Button @click="handleSave">Save</Button>
        </div>
      </div>
    </div>
    <DataTable
      :columns="columns"
      :data="runs"
      :totalItems="total"
      v-model:pagination="pagination"
      v-model:rowSelection="rowSelection"
      :onPaginationChange="handlePaginationChange"
      :onRowSelectionChange="updateRowSelection"
      :onRowClick="handleRowClick"
      :showPagination="true"
    />
    <Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
      <DialogContent v-if="runDetail" class="min-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader class="sticky top-0 bg-background border-b px-6 py-4">
          <DialogTitle>Original {{ providerHumanName[runDetail.llm_provider as keyof typeof providerHumanName] || runDetail.llm_provider }}'s Response</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto p-6" >
          <div class="p-2 border rounded mb-4 ml-32">{{ prompt }}</div>
          <div class="p-2 border rounded mr-16 model-response" v-html="marked(runResponse.text)"></div>
          <div v-if="runResponse.citations.length" class="p-2 border rounded mr-16 mt-4">
            <ol class="list-decimal pl-6 space-y-1">
              <li v-for="(c, i) in runResponse.citations" :key="i">
                <a :href="c.url" target="_blank" rel="noopener" class="underline">{{ c.title || c.url }}</a>
              </li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
<style>
.model-response a {
  color: var(--primary);
  text-decoration: underline;
}
</style>
