<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCompanyStore } from '@/stores/company'
import { normalizeUrl, isValidUrl } from '@/lib/utils'

const companyStore = useCompanyStore()

const props = defineProps<{
    companyId: number,
}>()

const competitors = computed(() => companyStore.competitors[props.companyId])
const newCompetitorName = ref('')
const newCompetitorWebsite = ref('')


async function addCompetitorItem() {
  const website = normalizeUrl(newCompetitorWebsite.value)
  if (newCompetitorWebsite.value && !isValidUrl(website)) {
    return
  }
  await companyStore.actionAddCompetitor(props.companyId, {
    name: newCompetitorName.value,
    website,
    description: '',
    name_aliases: null,
  })
  newCompetitorName.value = ''
  newCompetitorWebsite.value = ''
}

function removeCompetitor(id: number) {
  companyStore.actionDeleteCompetitor(props.companyId, id)
}

async function loadCompetitors() {
  await companyStore.actionLoadCompetitors(props.companyId)
}

onMounted(() => {
  loadCompetitors()
})

watch(() => props.companyId, () => {
  loadCompetitors()
})

</script>
<template>
    <div>
    <h2 class="mb-2 font-medium">Competitors</h2>
    <ol class="list-decimal mb-2 ml-6">
        <li
        v-for="comp in competitors"
        :key="comp.id"
        >
        <div class="flex items-center justify-between">
        <div class="flex items-start flex-col">
        <span>{{ comp.name }}</span>
        <a :href="comp.website" target="_blank" class="text-xs text-muted-foreground">{{ comp.website }}</a>
        </div>
        <Button
            variant="outline"
            @click="removeCompetitor(comp.id)"
            class="mt-2"
        >
            Remove
        </Button>
        </div>
        </li>
    </ol>
    <div class="flex space-x-2">
        <Input v-model="newCompetitorName" placeholder="Name" />
        <Input v-model="newCompetitorWebsite" placeholder="Website" />
        <Button @click="addCompetitorItem">Add</Button>
    </div>
    </div>
</template>