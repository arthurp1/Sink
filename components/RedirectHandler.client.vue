<script setup>
import { trackRedirect } from '~/utils/analytics'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

onMounted(() => {
  // Track the redirect in Google Analytics
  trackRedirect(props.slug)
})
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-background">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-2">
        Redirecting...
      </h1>
      <p class="text-muted-foreground">
        You will be redirected momentarily
      </p>
    </div>
  </div>
</template>
