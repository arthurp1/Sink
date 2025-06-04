<script setup>
import { X } from 'lucide-vue-next'

const props = defineProps({
  links: {
    type: Array,
    default: () => [],
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

function toggleDomain(domainTag) {
  const domain = domainTag.domain
  const index = selectedDomains.value.indexOf(domain)

  if (index > -1) {
    selectedDomains.value.splice(index, 1)
  }
  else {
    selectedDomains.value.push(domain)
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
  <div v-if="domainTags.length" class="space-y-2">
    <!-- Filter Tags -->
    <div class="flex flex-wrap gap-1.5">
      <Badge
        v-for="tag in domainTags"
        :key="tag.domain"
        :variant="isDomainSelected(tag.domain) ? 'default' : 'secondary'"
        class="cursor-pointer hover:bg-primary/80 transition-colors text-xs px-2 py-0.5 h-6"
        @click="toggleDomain(tag)"
      >
        <span class="capitalize">{{ tag.isOthers ? $t('links.filter.others') : tag.domain }}</span>
        <span class="ml-1 opacity-70">({{ tag.count }})</span>
      </Badge>
    </div>

    <!-- Clear Filters -->
    <div v-if="selectedDomains.length" class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="h-5 px-1.5 text-xs"
        @click="clearFilters"
      >
        <X class="w-3 h-3 mr-1" />
        {{ $t('links.filter.clear_filters') }}
      </Button>
      <span class="text-xs text-muted-foreground">
        {{ selectedDomains.length }} {{ selectedDomains.length !== 1 ? $t('links.filter.filters_active_plural') : $t('links.filter.filters_active') }} {{ $t('links.filter.active') }}
      </span>
    </div>
  </div>
</template>
