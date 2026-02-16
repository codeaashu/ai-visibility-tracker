<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, MoonIcon } from '@radix-icons/vue'
import { useColorMode } from '@vueuse/core'
import { Button } from '@/components/ui/button'

const mode = useColorMode({ disableTransition: false })
const isDark = computed(() => mode.value === 'dark')

function toggleTheme() {
  mode.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
<Button variant="ghost" @click.prevent="toggleTheme">
    <MoonIcon v-if="isDark" class="size-4" />
    <SunIcon v-else class="size-4" />
  </Button>
</template>
