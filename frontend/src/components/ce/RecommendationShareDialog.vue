<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ companyId: number; recId: number; plan: string }>()

const open = ref(false)
defineExpose({ open })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share plan</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 py-4">
        Sharing is not available in CE
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
