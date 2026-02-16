<script setup lang="ts">
import type { CompanyConfig, Company } from '@/interfaces/company';
import { ref, watch } from 'vue';
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import LoadingButton from '@/components/ui/loading-button.vue'

const companyForm = ref<CompanyConfig>({
  name: '',
  description: '',
  name_aliases: null,
  website: '',
  products: '',
})

const props = defineProps<{
  company: Company,
  isSavingOrLoading: boolean,
}>()

const emit = defineEmits<{
  (e: 'submit', company: CompanyConfig): void
}>()

async function onSubmit() {
  emit('submit', companyForm.value)
}

watch(() => props.company, (newVal) => {
  if (newVal) {
    companyForm.value = {...newVal}
  }
}, { immediate: true })

</script>
<template>
    <Form @submit="onSubmit">
        <FormField name="name">
            <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
                <Input v-model="companyForm.name" type="text" placeholder="Enter company name" required />
            </FormControl>
            <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="website">
            <FormItem>
            <FormLabel class="mt-4">Website</FormLabel>
            <FormControl>
                <Input v-model="companyForm.website" type="url" placeholder="Enter company website" required />
            </FormControl>
            <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="description">
            <FormItem>
            <FormLabel class="mt-4">Description</FormLabel>
            <FormControl>
                <Textarea class="min-h-[140px]" v-model="companyForm.description" placeholder="Briefly describe your company (optional)" />
            </FormControl>
            <FormMessage />
            </FormItem>
        </FormField>

        <FormField name="products">
            <FormItem>
            <FormLabel class="mt-4">Products Summary</FormLabel>
            <FormControl>
                <Textarea class="min-h-[140px]" v-model="companyForm.products" placeholder="Briefly describe your company products/services" />
            </FormControl>
            <FormMessage />
            </FormItem>
        </FormField>

        <div class="flex justify-end mt-2">
            <LoadingButton 
                type="submit" 
                :loading="isSavingOrLoading"
                loading-text="Saving..."
            >
                Update Company Details
            </LoadingButton>
        </div>
    </Form>
</template>    