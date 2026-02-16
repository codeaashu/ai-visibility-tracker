<script setup lang="ts">
import { Stepper, StepperItem, StepperSeparator, StepperTitle, StepperIndicator } from "@/components/ui/stepper"
import { Check, Circle, Dot } from 'lucide-vue-next'

defineProps<{
    steps: {
        step: number,
        title: string,
    }[],
    step: number,
}>()

</script>
<template>
<Stepper :model-value="step" class="flex w-full items-start gap-2">
    <StepperItem
      v-for="step in steps"
      :key="step.step"
      v-slot="{ state }"
      class="relative flex w-full flex-col items-center justify-center"
      :step="step.step"
    >
      <StepperSeparator
        v-if="step.step !== steps[steps.length - 1].step"
        class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary"
      />

      <StepperIndicator as-child>
        <Check v-if="state === 'completed'" class="size-6 mt-1" />
        <Circle v-if="state === 'active'" class="size-8 mt-1" />
        <Dot v-if="state === 'inactive'" class="size-8 mt-1" />
      </StepperIndicator>

      <div class="mt-1 flex flex-col items-center text-center">
        <StepperTitle
          :class="[state === 'active' && 'text-primary']"
          class="text-sm font-normal transition lg:text-base"
        >
          {{ step.title }}
        </StepperTitle>
      </div>
    </StepperItem>
</Stepper>
</template>