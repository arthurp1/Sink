<script setup>
import { useToast } from '@/components/ui/toast/use-toast'
import { Clipboard as ClipboardIcon } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  name: String,
})

const { toast } = useToast()

const fullUrl = computed(() => `https://aib.club/${props.name}`)
const copyText = computed(() => `aib.club/${props.name}`)

async function copyToClipboard() {
  await navigator.clipboard.writeText(copyText.value)
  toast({
    title: 'Copied to clipboard!',
    description: copyText.value,
  })
}

function stripUrlPrefix(url) {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '')
}

const displayedName = computed(() => stripUrlPrefix(props.name))
</script>

<template>
  <div class="inline-flex items-center justify-start w-full gap-2">
    <ClipboardIcon
      class="w-4 h-4 text-muted-foreground cursor-pointer"
      @click="copyToClipboard"
    />
    <NuxtLink
      :to="fullUrl"
      target="_blank"
      class="flex-1 min-w-0"
    >
      <span class="w-full truncate block">{{ displayedName }}</span>
    </NuxtLink>
  </div>
</template>
