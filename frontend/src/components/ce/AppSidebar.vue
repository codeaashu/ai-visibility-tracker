<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'

import {
  LayoutDashboard,
  MessageSquare,
  Lightbulb,
  Building2,
} from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import TeamSwitcher from '@/components/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const data = {
  navMain: [
    {
      icon: LayoutDashboard,
      title: 'Dashboard',
      route: 'dashboard',
    },
    {
      icon: MessageSquare,
      title: 'Prompts',
      route: 'prompts',
    },
    {
      icon: Lightbulb,
      title: 'Recommendations',
      route: 'recommendations',
    },
    {
      icon: Building2,
      title: 'Company Details',
      route: 'company',
    }
  ],

}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher/>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>
