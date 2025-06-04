<script setup>
import { useInfiniteScroll } from '@vueuse/core'
import { Loader } from 'lucide-vue-next'

const links = ref([])
const allLinks = ref([]) // Cache for all links for filter counts
const limit = 24
let cursor = ''
let listComplete = false
let listError = false

const sortBy = ref('newest')
const selectedDomains = ref([])
const isLoadingAllLinks = ref(false)

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

async function getLinks() {
  try {
    const data = await useAPI('/api/link/list', {
      query: {
        limit,
        cursor,
      },
    })
    links.value = links.value.concat(data.links).filter(Boolean) // Sometimes cloudflare will return null, filter out
    cursor = data.cursor
    listComplete = data.list_complete
    listError = false
  }
  catch (error) {
    console.error(error)
    listError = true
  }
}

// Background function to fetch all links for accurate filter counts
async function getAllLinksInBackground() {
  if (isLoadingAllLinks.value)
    return

  isLoadingAllLinks.value = true
  try {
    let allLinksCursor = ''
    let allLinksComplete = false
    const tempAllLinks = []

    // Fetch all links in parallel batches
    while (!allLinksComplete) {
      const data = await useAPI('/api/link/list', {
        query: {
          limit: 100, // Larger batch size for background loading
          cursor: allLinksCursor,
        },
      })

      if (data.links) {
        tempAllLinks.push(...data.links.filter(Boolean))
      }

      allLinksCursor = data.cursor
      allLinksComplete = data.list_complete

      if (!allLinksCursor || allLinksComplete)
        break
    }

    allLinks.value = tempAllLinks
  }
  catch (error) {
    console.error('Error loading all links for filters:', error)
  }
  finally {
    isLoadingAllLinks.value = false
  }
}

const { isLoading } = useInfiniteScroll(
  document,
  getLinks,
  {
    distance: 150,
    interval: 1000,
    canLoadMore: () => {
      return !listError && !listComplete
    },
  },
)

function updateLinkList(link, type) {
  if (type === 'edit') {
    const index = links.value.findIndex(l => l.id === link.id)
    links.value[index] = link

    // Also update in allLinks cache
    const allIndex = allLinks.value.findIndex(l => l.id === link.id)
    if (allIndex > -1) {
      allLinks.value[allIndex] = link
    }
  }
  else if (type === 'delete') {
    const index = links.value.findIndex(l => l.id === link.id)
    links.value.splice(index, 1)

    // Also remove from allLinks cache
    const allIndex = allLinks.value.findIndex(l => l.id === link.id)
    if (allIndex > -1) {
      allLinks.value.splice(allIndex, 1)
    }
  }
  else {
    links.value.unshift(link)
    sortBy.value = 'newest'

    // Also add to allLinks cache
    allLinks.value.unshift(link)
  }
}

// Start background loading when component mounts
onMounted(() => {
  getAllLinksInBackground()
})
</script>

<template>
  <main class="space-y-6">
    <div class="flex flex-col gap-6 sm:gap-2 sm:flex-row sm:justify-between">
      <DashboardNav class="flex-1">
        <div class="flex items-center gap-2">
          <DashboardLinksEditor @update:link="updateLinkList" />
          <DashboardLinksSort v-model:sort-by="sortBy" />
        </div>
      </DashboardNav>
      <LazyDashboardLinksSearch />
    </div>
    <DashboardLinksDomainFilter
      :links="allLinks.length > links.length ? allLinks : links"
      :is-loading-all="isLoadingAllLinks"
      @update:selected-domains="selectedDomains = $event"
    />
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashboardLinksLink
        v-for="link in displayedLinks"
        :key="link.id"
        :link="link"
        @update:link="updateLinkList"
      />
    </section>
    <div
      v-if="isLoading"
      class="flex items-center justify-center"
    >
      <Loader class="animate-spin" />
    </div>

    <div
      v-if="listError"
      class="flex items-center justify-center text-sm"
    >
      {{ $t('links.load_failed') }}
      <Button variant="link" @click="getLinks">
        {{ $t('common.try_again') }}
      </Button>
    </div>
  </main>
</template>
