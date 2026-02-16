<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css'
useColorMode({ disableTransition: false })

</script>

<template>
  <router-view />
  <Toaster />
</template>
