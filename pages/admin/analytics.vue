<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '#imports'
import { verifyGAConfig } from '~/utils/ga-data'

definePageMeta({
  middleware: ['auth']
})

useHead({
  title: 'Analytics Dashboard',
  meta: [
    { name: 'description', content: 'View Google Analytics data for your content' }
  ]
})

const slug = ref('home')
const slugInput = ref('home')
const configStatus = ref(null)
const statusLoading = ref(false)
const statusError = ref(null)

const checkConfigStatus = async () => {
  statusLoading.value = true
  statusError.value = null

  try {
    configStatus.value = await verifyGAConfig()
  } catch (err) {
    statusError.value = 'Failed to verify configuration'
    console.error(err)
  } finally {
    statusLoading.value = false
  }
}

const updateSlug = () => {
  if (slugInput.value && slugInput.value.trim()) {
    // Remove leading and trailing slashes if present
    let cleanSlug = slugInput.value.trim()
    if (cleanSlug.startsWith('/')) {
      cleanSlug = cleanSlug.substring(1)
    }
    if (cleanSlug.endsWith('/')) {
      cleanSlug = cleanSlug.substring(0, cleanSlug.length - 1)
    }

    slug.value = cleanSlug
  }
}

// Check configuration status on page load
checkConfigStatus()
</script>

<template>
  <div class="container mx-auto py-6 px-4">
    <h1 class="text-2xl font-bold mb-6">Analytics Dashboard</h1>

    <!-- Configuration Status -->
    <div
      v-if="configStatus"
      class="mb-6 p-4 rounded border"
      :class="configStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
    >
      <h2 class="font-semibold text-lg mb-2">
        <span v-if="configStatus.success" class="text-green-600">Google Analytics is properly configured</span>
        <span v-else class="text-red-600">Google Analytics configuration issue</span>
      </h2>

      <p v-if="configStatus.message" class="mb-2">
        {{ configStatus.message }}
      </p>

      <p v-if="configStatus.error" class="text-red-600">
        Error: {{ configStatus.error }}
      </p>

      <button
        @click="checkConfigStatus"
        class="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        :disabled="statusLoading"
      >
        {{ statusLoading ? 'Checking...' : 'Recheck Configuration' }}
      </button>
    </div>

    <!-- Slug Input -->
    <div class="mb-6 p-4 bg-white rounded border">
      <label class="block mb-2 font-medium">Select Content to Analyze:</label>
      <div class="flex">
        <input
          v-model="slugInput"
          type="text"
          placeholder="Enter URL slug (e.g., home, blog/post-1)"
          class="flex-grow px-3 py-2 border rounded-l"
        />
        <button
          @click="updateSlug"
          class="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
        >
          View
        </button>
      </div>
      <p class="mt-2 text-sm text-gray-500">
        Current selection: <span class="font-mono">{{ slug }}</span>
      </p>
    </div>

    <!-- Analytics Dashboard -->
    <ClientOnly>
      <AnalyticsDashboard :slug="slug" />
    </ClientOnly>
  </div>
</template>
