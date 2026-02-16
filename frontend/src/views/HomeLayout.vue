<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies'
import { RouterView } from 'vue-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import SiteHeader from '@/components/SiteHeader.vue'
import AppSidebar from '@edition-component/AppSidebar.vue'

const cookies = useCookies(['sidebar_state'])
</script>

<template>
  <SidebarProvider :defaultOpen="cookies.get('sidebar_state')" @update:open="cookies.set('sidebar_state', $event)">
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <SiteHeader />
        </div>
      </header>
      <RouterView class="ml-4 mt-2" />
    </SidebarInset>
  </SidebarProvider>
</template>
