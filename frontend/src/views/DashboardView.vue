<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { DashboardStats } from '@/interfaces/dashboard'
import { getDashboardStats, getShareOfVoicePrompts } from '@/api/dashboard'
import { Info } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PromptMonitoringTable from '@/components/PromptMonitoringTable.vue'
import type { PromptMonitoringItem } from '@/interfaces/prompt_monitoring'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { valueUpdater } from '@/lib/utils'
import { type PaginationState, type Updater } from '@tanstack/vue-table'
import ShareOfVoiceTable from '@/components/ShareOfVoiceTable.vue'
import { DonutChart } from '@/components/ui/chart-donut'

const props = defineProps<{ id: number }>()

const stats = ref<DashboardStats | null>(null)
const isLoading = ref(false)
const mounted = ref(false)
const isSovPanelOpen = ref(false)
const selectedDomain = ref('')
const sovPrompts = ref<PromptMonitoringItem[]>([])
const sovTotal = ref(0)
const sovPagination = ref<PaginationState>({ pageIndex: 0, pageSize: 30 })
const mentionedPercentage = computed(() => (stats.value?.ai_visibility_score ?? 0) * 100)
const donutDataVisibilityScore = computed(() => {
    if (!stats.value?.ai_visibility_score) {
        return []
    }
    const mentioned = mentionedPercentage.value
    const notMentioned = 100 - mentioned
    return [
        { name: 'Mentioned', count: mentioned},
        { name: 'Not Mentioned', count: notMentioned},
    ]
})
const citedPercentage = computed(() => (stats.value?.website_citation_share ?? 0) * 100)
const donutDataCitationShare = computed(() => {
    if (!stats.value?.website_citation_share) {
        return []
    }
    const cited = citedPercentage.value
    const notCited = 100 - cited
    return [
        { name: 'Cited', count: cited},
        { name: 'Not Cited', count: notCited},
    ]
})

function valueFormatter(value: number) {
    return value.toFixed(2) + '%'
}

async function loadStats() {
    isLoading.value = true
    try {
        stats.value = await getDashboardStats(props.id)
    } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        stats.value = {
            ai_visibility_score: 0,
            website_citation_share: 0,
            share_of_voice: [],
            total_runs: 0,
        }
    } finally {
        isLoading.value = false
    }
}

onMounted(async function () {
    await loadStats()
    mounted.value = true
})

watch(() => props.id, loadStats)

async function loadSovPrompts() {
    if (!selectedDomain.value) {
        return
    }
    const res = await getShareOfVoicePrompts(
        props.id,
        selectedDomain.value,
        sovPagination.value.pageIndex,
        sovPagination.value.pageSize,
    )
    sovPrompts.value = res.items
    sovTotal.value = res.total
}

function handleDomainClick(domain: string) {
    selectedDomain.value = domain
    sovPagination.value.pageIndex = 0
    isSovPanelOpen.value = true
    loadSovPrompts()
}

function handleSovPaginationChange(newPagination: Updater<PaginationState>) {
    valueUpdater(newPagination, sovPagination)
}

watch(
    () => sovPagination.value,
    async () => {
        if (isSovPanelOpen.value) {
            await loadSovPrompts()
        }
    },
    { deep: true },
)
</script>

<template>
  <div class="p-4 space-y-4">
    <Teleport v-if="mounted" to="#page-header-teleport-target">
      Dashboard
    </Teleport>
    <div v-if="isLoading">Loading...</div>
    <div v-else class="grid gap-4 grid-cols-3">
      <Card class="flex-row gap-0 py-4">
        <CardContent class="pl-0">
          <DonutChart 
            :data="donutDataVisibilityScore" 
            index="name" 
            category="count" 
            :valueFormatter="valueFormatter" 
            :colors="['oklch(0.606 0.25 292.717)', 'rgba(0, 0, 0, 0.2)']"
            :centralLabel="`${mentionedPercentage.toFixed(0)}%`"
            class="h-48 w-48"
            :show-legend="false"
          />
        </CardContent>
        <div>
          <CardTitle class="mt-4">
            AI Visibility Score
          </CardTitle>
          <p class="text-sm text-muted-foreground mt-3">
            Product prompts where your brand or website is mentioned
          </p>
        </div>
      </Card>
      <Card class="flex-row gap-0 py-4">
        <CardContent class="pl-0">
          <DonutChart 
            :data="donutDataCitationShare" 
            index="name" 
            category="count" 
            :valueFormatter="valueFormatter" 
            :colors="['oklch(0.606 0.25 292.717)', 'rgba(0, 0, 0, 0.2)']"
            :centralLabel="`${citedPercentage.toFixed(0)}%`"
            class="h-48 w-48"
            :show-legend="false"
          />
        </CardContent>
        <div>
          <CardTitle class="mt-4">
            Website Citation
          </CardTitle>
          <p class="text-sm text-muted-foreground mt-3">
            Prompts where your website is cited
          </p>
        </div>
      </Card>
      <Card class="col-span-2">
        <CardHeader>
          <CardTitle>
            Share of Voice (top 20)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Info :size="16" class="inline text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p class="max-w-xs">
                    Share of Voice is the number of times your website is cited in relation to all citations across monitored prompts. Blue - company, Red - competitor, Gray - other.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent class="px-0">
          <div v-if="!stats?.share_of_voice.length" class="text-sm text-muted-foreground">No data</div>
          <div v-else class="space-y-2">
            <ShareOfVoiceTable :stats="stats" @domain-click="handleDomainClick" />
          </div>
        </CardContent>
      </Card>
    </div>
    <Sheet :open="isSovPanelOpen" @update:open="isSovPanelOpen = $event">
      <SheetContent side="right" class="max-w-2/5 sm:max-w-2/5">
        <SheetHeader>
          <SheetTitle>Prompts citing {{ selectedDomain }}</SheetTitle>
        </SheetHeader>
        <PromptMonitoringTable
          :items="sovPrompts"
          :total="sovTotal"
          :companyId="props.id"
          :pagination="sovPagination"
          :onPaginationChange="handleSovPaginationChange"
          :compact="true"
          :navigation="true"
        />
      </SheetContent>
    </Sheet>
  </div>
</template>

