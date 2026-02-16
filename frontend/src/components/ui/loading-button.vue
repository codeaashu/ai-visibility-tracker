<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Loader2Icon } from 'lucide-vue-next'

interface Props {
  loading?: boolean
  loadingText?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  class?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: '',
  variant: 'default',
  size: 'default',
  type: 'button',
  disabled: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <Button
    :type="type"
    :variant="variant"
    :size="size"
    :disabled="loading || disabled"
    :class="$props.class"
    @click="$emit('click', $event)"
  >
    <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot v-if="!loading || !loadingText" />
    <span v-else>{{ loadingText }}</span>
  </Button>
</template>
