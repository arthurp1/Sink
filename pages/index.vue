<script setup>
// Simple redirect to aibuilders.club
// This avoids using components that might depend on runtimeConfig
onMounted(() => {
  // Direct redirect without any config dependencies
  window.location.href = 'https://aibuilders.club'
})
</script>

<template>
  <div class="flex items-center justify-center h-screen bg-background">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-2">
        Redirecting...
      </h1>
      <p class="text-muted-foreground">
        You will be redirected to AIBuilders.club
      </p>
    </div>
  </div>
</template>
