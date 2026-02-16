<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import type { Recommendation } from '@/interfaces/recommendation'
import RecommendationShareDialog from '@edition-component/RecommendationShareDialog.vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{ companyId: number; recId: number }>()

const recommendationStore = useRecommendationStore()
const item = ref<Recommendation | null>(null)
const pageTitle = 'Recommendation Details'
const mounted = ref(false)
const shareDialog = ref<InstanceType<typeof RecommendationShareDialog> | null>(null)

onMounted(async () => {
    item.value = await recommendationStore.actionGet(props.companyId, props.recId)
    mounted.value = true
})

function openShare() {
    if (shareDialog.value) {
        shareDialog.value.open = true
    }
}
</script>

<template>
  <div class="p-4">
    <Teleport v-if="mounted" to="#page-header-teleport-target">{{ pageTitle }}</Teleport>
    <RecommendationShareDialog
      ref="shareDialog"
      :companyId="props.companyId"
      :recId="props.recId"
      :plan="item?.what_to_do || ''"
    />
    <div v-if="item" class="space-y-4">
      <div class="flex justify-end">
        <Button @click="openShare">Share plan</Button>
      </div>
      <div>
        <h3 class="font-medium">What to do</h3>
        <p>{{ item.what_to_do }}</p>
      </div>
      <div>
        <h3 class="font-medium">Why not you</h3>
        <p>{{ item.why_not_user }}</p>
      </div>
      <div>
        <h3 class="font-medium">Why competitor</h3>
        <p>{{ item.why_competitor }}</p>
      </div>
    </div>
  </div>
</template>
