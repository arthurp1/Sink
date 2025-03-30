<script setup>
// Simple redirect to aibuilders.club
// This avoids using components that might depend on runtimeConfig

// Use a clean white background during page initialization
// to prevent any UI flash
definePageMeta({
  layout: false, // Disable default layout to prevent UI flash
})

// Immediate redirect
if (import.meta.client) {
  window.location.href = 'https://aibuilders.club'
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-white" style="background-color: white; z-index: 9999;">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-2">
        Redirecting...
      </h1>
      <p class="text-gray-500">
        You will be redirected to AIBuilders.club
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Force white background at the highest level */
:root, html, body {
  background-color: white !important;
}
</style>
