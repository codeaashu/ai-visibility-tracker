<script setup lang="ts">
import { computed } from 'vue'
import { type LucideIcon } from 'lucide-vue-next'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { useRoute } from 'vue-router'
import { useCompanyStore } from '@/stores/company'

const route = useRoute()

defineProps<{
  items: {
    title: string
    route: string
    icon?: LucideIcon
  }[]
}>()

const activeRoute = computed(() => route.name)
const companyStore = useCompanyStore()
const companies = computed(() => companyStore.companies)
const id = computed(() => companyStore.activeCompanyId || +route.params.id || companies.value[0].id)

</script>

<template>
  <SidebarGroup v-if="companies.length >= 1">
    <SidebarGroupContent>
        <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.title">
                <SidebarMenuButton asChild :is-active="activeRoute === item.route">
                    <router-link :to="{name: item.route, params: {id}}">
                        <component :is="item.icon" class="size-5!" />
                        <span class="text-sm">{{item.title}}</span>
                    </router-link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
