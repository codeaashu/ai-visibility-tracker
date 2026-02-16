<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <section class="w-full max-w-2xl rounded-xl border p-8 space-y-6 bg-card">
      <div class="space-y-2">
        <h1 class="text-3xl font-semibold">AiCMO</h1>
        <p class="text-muted-foreground">
          Track your AI visibility, monitor prompts, and compare your share of voice.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <Button as-child>
          <RouterLink to="/onboarding">Get Started</RouterLink>
        </Button>
        <Button variant="outline" as-child>
          <RouterLink to="/companies">Open App</RouterLink>
        </Button>
      </div>
    </section>
  </main>
</template>
