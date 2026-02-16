<script setup lang="ts">
import { ChevronsUpDown, Plus } from 'lucide-vue-next'

import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { useCompanyStore } from '@/stores/company'
import { useQuotaStore } from '@edition-store/quota'
import { useRouter, useRoute } from 'vue-router'

const companyStore = useCompanyStore()
const quotaStore = useQuotaStore()
const router = useRouter()
const route = useRoute()
const { isMobile } = useSidebar()


const companies = computed(() => companyStore.companies)
const activeCompanyId = computed(() => companyStore.activeCompanyId || +route.params.id || companies.value[0].id)
const activeCompany = computed(() => companies.value.find((company) => company.id === activeCompanyId.value))
const remainingCompanies = computed(() => {
  const q = quotaStore.quota
  if (!q) {
    return 1
  }
  return q.companies.total - q.companies.used
})

function changeCompany(companyId: number) {
  const targetRoute = route.path.startsWith('/company') ? route.name : 'dashboard'
  companyStore.activeCompanyId = companyId
  router.push({ name: targetRoute, params: { id: companyId } })
}
</script>

<template>
  <SidebarMenu v-if="companies.length >= 1">
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
          
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ activeCompany?.name || 'Select company' }}
              </span>
              <span class="truncate text-xs text-muted-foreground">{{ activeCompany?.website }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Companies
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="company in companies"
            :key="company.name"
            class="gap-2 p-2"
            @click="changeCompany(company.id)"
          >
            {{ company.name }}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <span tabindex="0">
                  <DropdownMenuItem class="gap-2 p-2" @click="router.push({ name: 'onboarding' })" :disabled="remainingCompanies <= 0">
                    <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <Plus class="size-4" />
                    </div>
                    <div class="font-medium text-muted-foreground">
                      Add company
                    </div>
                  </DropdownMenuItem>
                </span>
              </TooltipTrigger>
              <TooltipContent v-if="remainingCompanies <= 0">
                Company limit reached
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
