<script setup lang="ts">
// @ts-ignore
import Logo from '@/assets/aicmo-logo.svg?component'

</script>

<template>
  <div>
    <div class="flex items-center gap-2 mr-6">
      <Logo class="h-6 w-6 header-logo min-w-6 min-h-6" viewBox="0 0 666 666" width="24" height="24"/>
      <div class="text-sm/4 text-muted-foreground">
          <div>AiCMO</div>
      </div>
    <!-- Teleport target for dynamic page headers/breadcrumbs -->
    <div id="page-header-teleport-target" class="flex items-center justify-between w-full ml-4 text-sm"></div>
    </div>
  </div>
</template>
<style lang="scss">
.header-logo {
    path, rect, circle {
        stroke: var(--muted-foreground) !important;
    }
    circle {
        fill: var(--muted-foreground) !important;
    }
}
</style>
