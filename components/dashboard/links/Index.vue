<script setup>
import { useLocalStorage } from '@vueuse/core'
import { Loader } from 'lucide-vue-next'

const links = useLocalStorage('cached-links', [])
const isLoading = ref(false)
const loadError = ref(false)

const sortBy = useLocalStorage('links-sort-by', 'newest')
const selectedDomains = ref([])
const currentView = useLocalStorage('links-view', 'card') // 'card' or 'table'

const searchTerm = ref('') // New ref for the search term

// Extract the main domain from URL for smart sorting
function extractMainDomain(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    // Split by dots and get the parts
    const parts = hostname.split('.')

    // Handle different cases:
    // For domains like "example.com" -> return "example"
    // For domains like "api.example.com" -> return "example"
    // For domains like "example.co.uk" -> return "example"
    // For IP addresses or single words -> return as is

    if (parts.length <= 1) {
      return hostname // IP or single word
    }

    // Common TLDs that are two parts (country codes with generic TLD)
    const twoPartTlds = ['co.uk', 'com.au', 'co.jp', 'com.br', 'co.za', 'com.mx', 'co.in']
    const lastTwoParts = parts.slice(-2).join('.')

    if (twoPartTlds.includes(lastTwoParts)) {
      // For domains like "example.co.uk" or "sub.example.co.uk"
      // Return the part before the two-part TLD
      return parts.length >= 3 ? parts[parts.length - 3] : parts[0]
    }
    else {
      // For regular domains:
      // "example.com" -> return "example" (parts[0])
      // "api.example.com" -> return "example" (parts[parts.length - 2])
      return parts.length >= 3 ? parts[parts.length - 2] : parts[0]
    }
  }
  catch (_error) {
    // If URL parsing fails, fallback to the original URL
    return url.toLowerCase()
  }
}

// Filter and sort links
const displayedLinks = computed(() => {
  let filtered = [...links.value]

  // Apply search filter
  if (searchTerm.value) {
    const lowerCaseSearchTerm = searchTerm.value.toLowerCase()
    filtered = filtered.filter((link) => {
      const slugMatch = link.slug.toLowerCase().startsWith(lowerCaseSearchTerm)
      const urlMatch = link.url.toLowerCase().includes(lowerCaseSearchTerm) // Simple includes for URL for now

      // Advanced matching for slug after a dash
      const slugAfterDash = link.slug.split('-').pop() || ''
      const slugAfterDashMatch = slugAfterDash.toLowerCase().startsWith(lowerCaseSearchTerm)

      // Advanced matching for domain after a dash
      const urlHost = extractMainDomain(link.url)
      const urlHostAfterDash = urlHost.split('-').pop() || ''
      const urlHostAfterDashMatch = urlHostAfterDash.toLowerCase().startsWith(lowerCaseSearchTerm)

      return slugMatch || urlMatch || slugAfterDashMatch || urlHostAfterDashMatch
    })
  }

  // Apply domain filters
  if (selectedDomains.value.length > 0) {
    filtered = filtered.filter((link) => {
      const domain = extractMainDomain(link.url)

      // Check if "others" is selected
      if (selectedDomains.value.includes('others')) {
        // Get all domains with 3+ links
        const domainCounts = {}
        links.value.forEach((l) => {
          const d = extractMainDomain(l.url)
          domainCounts[d] = (domainCounts[d] || 0) + 1
        })
        const majorDomains = Object.keys(domainCounts).filter(d => domainCounts[d] >= 3)

        // If this link's domain is not a major domain and "others" is selected, include it
        if (!majorDomains.includes(domain)) {
          return true
        }
      }

      // Check if this specific domain is selected
      return selectedDomains.value.includes(domain)
    })
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'newest':
      return filtered.sort((a, b) => b.createdAt - a.createdAt)
    case 'oldest':
      return filtered.sort((a, b) => a.createdAt - b.createdAt)
    case 'url_az':
      return filtered.sort((a, b) => extractMainDomain(a.url).localeCompare(extractMainDomain(b.url)))
    case 'url_za':
      return filtered.sort((a, b) => extractMainDomain(b.url).localeCompare(extractMainDomain(a.url)))
    case 'slug_az':
      return filtered.sort((a, b) => a.slug.localeCompare(b.slug))
    case 'slug_za':
      return filtered.sort((a, b) => b.slug.localeCompare(a.slug))
    default:
      return filtered
  }
})

async function loadAllLinks() {
  if (links.value.length === 0) {
    isLoading.value = true
  }
  loadError.value = false // Reset error state

  try {
    let currentCursor = '' // Start with an empty cursor for the first request
    let allLinksComplete = false
    let requestCount = 0 // For logging purposes

    do { // Use a do-while loop to ensure at least one request is made
      requestCount++
      console.log(`[Request ${requestCount}] Sending request with cursor: '${currentCursor}'`)

      const data = await useAPI('/api/link/list', {
        query: {
          limit: 100, // Fetch in batches of 100
          cursor: currentCursor,
        },
      })

      const fetchedLinksCount = data.links ? data.links.length : 0
      console.log(`[Response ${requestCount}] Fetched ${fetchedLinksCount} links. Received cursor: '${data.cursor}', List Complete: ${data.list_complete}`)

      if (data.links && Array.isArray(data.links) && data.links.length > 0) {
        // Replace the links array with new data if it's the first batch, otherwise append
        if (currentCursor === '') {
          links.value = data.links.filter(Boolean)
        }
        else {
          links.value.push(...data.links.filter(Boolean))
        }
      }

      currentCursor = data.cursor // Update cursor for the next iteration
      allLinksComplete = data.list_complete // Update completion flag
      console.log(`[Status ${requestCount}] Total links accumulated: ${links.value.length}`)
    } while (!allLinksComplete && currentCursor) // Continue if not complete AND a cursor for the next batch exists
  }
  catch (error) {
    console.error('Error loading all links:', error)
    loadError.value = true
  }
  finally {
    isLoading.value = false
    console.log(`[Index.vue] Total links loaded: ${links.value.length}`) // Add a final log to confirm
  }
}

function updateLinkList(link, type) {
  if (type === 'edit') {
    const index = links.value.findIndex(l => l.id === link.id)
    if (index > -1) {
      links.value[index] = link
    }
  }
  else if (type === 'delete') {
    const index = links.value.findIndex(l => l.id === link.id)
    if (index > -1) {
      links.value.splice(index, 1)
    }
  }
  else { // 'create'
    links.value.unshift(link)
    sortBy.value = 'newest'
  }
  // Trigger a full data refresh after any CRUD operation
  loadAllLinks()
}

function setView(view) {
  currentView.value = view
}

// Start loading all links when component mounts
onMounted(() => {
  loadAllLinks()
})

watch(currentView, (newValue) => {
  if (newValue === 'table') {
    // When switching to table view, default sorting to slug_az if it's currently 'newest' or 'oldest'
    // This ensures a sensible default for the table's clickable headers
    if (sortBy.value === 'newest' || sortBy.value === 'oldest') {
      sortBy.value = 'slug_az'
    }
  }
})
</script>

<template>
  <main class="space-y-6">
    <div class="flex flex-col gap-6 sm:gap-2 sm:flex-row sm:justify-between">
      <DashboardNav
        class="flex-1"
        :current-view="currentView"
        @update:view="setView"
      >
        <div class="flex items-center gap-2">
          <DashboardLinksEditor @update:link="updateLinkList" />
          <DashboardLinksSort v-model:sort-by="sortBy" />
        </div>
      </DashboardNav>
      <!-- Comment out the existing LazyDashboardLinksSearch component -->
      <!-- <LazyDashboardLinksSearch /> -->
      <DashboardLinksSearchQuick v-model:search-term="searchTerm" />
    </div>
    <DashboardLinksDomainFilter
      :links="links"
      :is-loading-all="isLoading"
      @update:selected-domains="selectedDomains = $event"
    />
    <section
      v-if="currentView === 'card'"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <DashboardLinksLink
        v-for="link in displayedLinks"
        :key="link.id"
        :link="link"
        @update:link="updateLinkList"
      />
    </section>

    <DashboardLinksTable
      v-else-if="currentView === 'table'"
      :links="displayedLinks"
      :sort-by="sortBy"
      @update:sort-by="sortBy = $event"
      @update:link="updateLinkList"
    />

    <div
      v-if="isLoading"
      class="flex items-center justify-center"
    >
      <Loader class="animate-spin" />
    </div>

    <div
      v-if="loadError"
      class="flex items-center justify-center text-sm text-red-500"
    >
      {{ $t('links.load_failed') }}
      <Button variant="link" @click="loadAllLinks">
        {{ $t('common.try_again') }}
      </Button>
    </div>
  </main>
</template>
