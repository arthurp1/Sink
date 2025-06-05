<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { onMounted, ref } from 'vue'
import { fetchRedirectCounts, fetchSlugEventCount, verifyGAConfig } from '~/utils/ga-data'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

dayjs.extend(relativeTime)

const data = ref(null)
const loading = ref(false)
const error = ref(null)
const configStatus = ref(null)
const redirectCounts = ref(0)

async function fetchData() {
  loading.value = true
  error.value = null

  try {
    const [slugData, redirectsData] = await Promise.all([
      fetchSlugEventCount(props.slug),
      fetchRedirectCounts(),
    ])

    if (slugData.error) {
      error.value = slugData.error
    }
    else {
      data.value = slugData
    }

    if (redirectsData.error) {
      console.error('Error fetching redirect data:', redirectsData.error)
    }
    else {
      redirectCounts.value = redirectsData.data.reduce((sum: number, item: { eventCount: number }) => sum + item.eventCount, 0)
    }
  }
  catch (err: any) {
    error.value = 'Failed to fetch analytics data'
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

function refreshData() {
  fetchData()
}

async function verifyConfig() {
  loading.value = true
  error.value = null

  try {
    const result = await verifyGAConfig()
    configStatus.value = result

    if (result.success) {
      await fetchData()
    }
    else {
      error.value = `Configuration error: ${result.error || 'Unknown error'}`
    }
  }
  catch (err) {
    error.value = 'Failed to verify configuration'
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

function formatDate(dateString: string) {
  if (!dateString) {
    return {
      displayDate: '',
      fullDate: '',
    }
  }

  const date = dayjs(dateString)
  const now = dayjs()
  const diffInDays = now.diff(date, 'day')

  const fullDate = date.format('DD-MM-YYYY HH:mm:ss') // Full date format for tooltip

  if (diffInDays < 14) {
    return {
      displayDate: date.fromNow(),
      fullDate,
    }
  }
  else {
    return {
      displayDate: date.format('DD-MM-YY'),
      fullDate,
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="analytics-dashboard">
    <h2 class="text-xl font-bold mb-4">
      Analytics Dashboard
    </h2>

    <div v-if="loading" class="p-4 border rounded bg-gray-50">
      <p class="text-gray-500">
        Loading analytics data...
      </p>
    </div>

    <div v-else-if="error" class="p-4 border rounded bg-red-50">
      <p class="text-red-500">
        {{ error }}
      </p>
      <button class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm" @click="verifyConfig">
        Verify Configuration
      </button>
    </div>

    <div v-else-if="data" class="p-4 border rounded bg-white">
      <div class="mb-4">
        <h3 class="font-semibold text-lg">
          {{ data.slug }}
        </h3>
        <p class="text-sm text-gray-500">
          Data for last 7 days
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="p-3 bg-blue-50 rounded shadow-sm">
          <p class="text-sm text-gray-600">
            Page Views
          </p>
          <p class="text-2xl font-bold">
            {{ data.pageviews }}
          </p>
        </div>

        <div class="p-3 bg-green-50 rounded shadow-sm">
          <p class="text-sm text-gray-600">
            Link Clicks
          </p>
          <p class="text-2xl font-bold">
            {{ data.events?.linkClick || 0 }}
          </p>
        </div>

        <div class="p-3 bg-purple-50 rounded shadow-sm">
          <p class="text-sm text-gray-600">
            Downloads
          </p>
          <p class="text-2xl font-bold">
            {{ data.events?.download || 0 }}
          </p>
        </div>

        <div class="p-3 bg-orange-50 rounded shadow-sm">
          <p class="text-sm text-gray-600">
            Redirects
          </p>
          <p class="text-2xl font-bold">
            {{ redirectCounts }}
          </p>
        </div>
      </div>

      <div class="text-xs text-gray-500 mt-4">
        <p>
          Source: {{ data.source }} | Updated:
          <span :title="formatDate(data.timestamp).fullDate">
            {{ formatDate(data.timestamp).displayDate }}
          </span>
        </p>
      </div>
    </div>

    <div class="mt-4">
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        :disabled="loading"
        @click="refreshData"
      >
        Refresh Data
      </button>
    </div>
  </div>
</template>

<style scoped>
.analytics-dashboard {
  padding: 1rem;
  border-radius: 0.375rem;
  background-color: #f9fafb;
}
</style>
