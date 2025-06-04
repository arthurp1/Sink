<script setup>
import { RefreshCw, X } from 'lucide-vue-next'

const props = defineProps({
  links: {
    type: Array,
    default: () => [],
  },
  isLoadingAll: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:selectedDomains'])

const selectedDomains = ref([])

// Extract the main domain from URL (reusing the same logic from Index.vue)
function extractMainDomain(url) {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    const parts = hostname.split('.')

    if (parts.length <= 1) {
      return hostname
    }

    const twoPartTlds = ['co.uk', 'com.au', 'co.jp', 'com.br', 'co.za', 'com.mx', 'co.in']
    const lastTwoParts = parts.slice(-2).join('.')

    if (twoPartTlds.includes(lastTwoParts)) {
      return parts.length >= 3 ? parts[parts.length - 3] : parts[0]
    }
    else {
      return parts.length >= 3 ? parts[parts.length - 2] : parts[0]
    }
  }
  catch (_error) {
    return url.toLowerCase()
  }
}

// Get display name for domain (special case for lu.ma)
function getDisplayName(domain, isOthers) {
  if (isOthers) {
    return $t('links.filter.others')
  }
  if (domain === 'lu.ma') {
    return 'luma'
  }
  return domain
}

// Compute domain groups
const domainTags = computed(() => {
  if (!props.links.length)
    return []

  // Count domains
  const domainCounts = {}
  props.links.forEach((link) => {
    const domain = extractMainDomain(link.url)
    domainCounts[domain] = (domainCounts[domain] || 0) + 1
  })

  // Separate domains with 3+ links and others
  const majorDomains = []
  const minorDomains = []
  let othersCount = 0

  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count >= 3) {
      majorDomains.push({ domain, count })
    }
    else {
      minorDomains.push({ domain, count })
      othersCount += count
    }
  })

  // Sort major domains by count (descending)
  majorDomains.sort((a, b) => b.count - a.count)

  // Add "Others" if there are minor domains
  const tags = [...majorDomains]
  if (minorDomains.length > 0) {
    tags.push({
      domain: 'others',
      count: othersCount,
      isOthers: true,
      minorDomains: minorDomains.map(d => d.domain),
    })
  }

  return tags
})

function toggleDomain(domainTag, event) {
  const domain = domainTag.domain
  const index = selectedDomains.value.indexOf(domain)

  // Check for modifier keys (Command on Mac, Ctrl on Windows/Linux, or Shift)
  const isMultiSelect = event.metaKey || event.ctrlKey || event.shiftKey

  if (isMultiSelect) {
    // Multi-select mode: add/remove without affecting others
    if (index > -1) {
      selectedDomains.value.splice(index, 1)
    }
    else {
      selectedDomains.value.push(domain)
    }
  }
  else {
    // Single-select mode: toggle between selected and none
    if (index > -1) {
      selectedDomains.value = []
    }
    else {
      selectedDomains.value = [domain]
    }
  }

  emit('update:selectedDomains', selectedDomains.value)
}

function clearFilters() {
  selectedDomains.value = []
  emit('update:selectedDomains', [])
}

function isDomainSelected(domain) {
  return selectedDomains.value.includes(domain)
}
</script>

<template>
  <div v-if="domainTags.length || isLoadingAll" class="space-y-2">
    <!-- Loading indicator -->
    <div v-if="isLoadingAll" class="flex items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw class="w-3 h-3 animate-spin" />
      <span>Loading all links for accurate filter counts...</span>
    </div>

    <!-- Filter Tags with inline reset -->
    <div class="flex flex-wrap gap-1.5 items-center">
      <Badge
        v-for="tag in domainTags"
        :key="`tag-${tag.domain}`"
        :variant="isDomainSelected(tag.domain) ? 'default' : (tag.isOthers ? 'outline' : 'secondary')"
        class="cursor-pointer transition-colors text-xs px-2 py-0.5 h-6"
        :class="[
          {
            'opacity-70': isLoadingAll,
            'hover:bg-primary/80': !tag.isOthers || isDomainSelected(tag.domain),
            'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border-muted': tag.isOthers && !isDomainSelected(tag.domain),
          },
        ]"
        @click="toggleDomain(tag, $event)"
      >
        <span class="capitalize">{{ getDisplayName(tag.domain, tag.isOthers) }}</span>
        <span class="ml-1 opacity-70">({{ tag.count }}{{ isLoadingAll ? '+' : '' }})</span>
      </Badge>

      <!-- Inline Reset Button -->
      <Button
        v-if="selectedDomains.length"
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        @click="clearFilters"
      >
        <X class="w-3 h-3" />
      </Button>
    </div>
  </div>
</template>
