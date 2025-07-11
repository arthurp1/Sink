<script setup>
import { Button } from '@/components/ui/button'
import { useClipboard } from '@vueuse/core'
import { Clipboard as ClipboardIcon, Copy, CopyCheck, Eraser, Hourglass, QrCode, SquarePen } from 'lucide-vue-next'
import { parseURL } from 'ufo'
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { DashboardLinksDelete } from './Delete.vue'
import DashboardLinksEditor from './Editor.vue'
import QRCode from './QRCode.vue'

const props = defineProps({
  link: {
    type: Object,
    default: () => ({}),
  },
})
const emit = defineEmits(['update:link'])

const { t } = useI18n()
const editPopoverOpen = ref(false)

const { origin } = location

function getLinkHost(url) {
  const { host } = parseURL(url)
  return host
}

function stripMarketingParams(url) {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    const marketingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'mc_cid',
      'mc_eid',
      'igshid',
      's_cid',
      'ref',
      'origin_url',
      'source',
      'campaign',
      'medium',
      'content',
      'term',
      'variant_id',
    ]

    marketingParams.forEach(param => params.delete(param))
    urlObj.search = params.toString()
    return urlObj.toString().replace(/^(https?:\/\/(?:www\\.)?)/, '')
  }

  catch (_e) {
    return url.replace(/^(https?:\/\/(?:www\\.)?)/, '')
  }
}

const shortLink = computed(() => `${origin}/${props.link.slug}`)
const linkIcon = computed(() => {
  const host = getLinkHost(props.link.url)

  // Special handling for WhatsApp domains
  if (host && host.includes('whatsapp')) {
    // For WhatsApp URLs, try multiple approaches for better icon resolution
    if (host === 'web.whatsapp.com' || host === 'api.whatsapp.com') {
      // These subdomains might not have good favicons, so use the main whatsapp.com
      return `https://unavatar.io/whatsapp.com?fallback=https://sink.cool/icon.png`
    }
    // For chat.whatsapp.com and other WhatsApp domains, add cache busting
    return `https://unavatar.io/${host}?fallback=https://sink.cool/icon.png&v=2`
  }

  // Multi-service high-resolution strategy
  // 1. Try Google's favicon service (often has higher quality)
  // 2. Fallback to our own icon as last resort
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=64`

  // Use unavatar.io with Google's service as fallback for better resolution
  return `https://unavatar.io/${host}?fallback=${encodeURIComponent(googleFaviconUrl)}`
})

const copyLinkText = computed(() => shortLink.value.replace(/^(https?:\/\/)/, ''))

const { copy, copied } = useClipboard({ source: copyLinkText.value, copiedDuring: 400 })

function updateLink(link, type) {
  emit('update:link', link, type)
  editPopoverOpen.value = false
}

function copyLink() {
  copy(copyLinkText.value)
  toast(t('links.copy_success'))
}

const displayedOriginalUrl = computed(() => stripMarketingParams(props.link.url))

const { copy: copyOriginal, copied: copiedOriginal } = useClipboard({ source: displayedOriginalUrl.value, copiedDuring: 400 })

function copyOriginalLink() {
  copyOriginal(displayedOriginalUrl.value)
  toast(t('links.copy_success'))
}

function navigateToOriginalUrl() {
  window.open(props.link.url, '_blank')
}
</script>

<template>
  <Card>
    <div
      class="flex flex-col p-4 space-y-3 h-full"
    >
      <div class="flex items-center justify-center space-x-3">
        <Avatar class="w-6 h-6" @click.stop>
          <AvatarImage
            :src="linkIcon"
            alt="@radix-vue"
            loading="lazy"
          />
          <AvatarFallback>
            <img
              src="/icon.png"
              alt="Sink"
              loading="lazy"
            >
          </AvatarFallback>
        </Avatar>

        <div class="flex-1 overflow-hidden">
          <div class="flex items-center cursor-pointer" @click="copyLink">
            <div class="font-bold leading-5 truncate text-md">
              {{ link.slug }}
            </div>

            <CopyCheck
              v-if="copied"
              class="w-4 h-4 ml-1 shrink-0"
            />
            <Copy
              v-else
              class="w-4 h-4 ml-1 shrink-0"
            />
          </div>

          <TooltipProvider @click.stop>
            <Tooltip @click.stop>
              <TooltipTrigger as-child @click.stop>
                <p class="text-sm truncate">
                  {{ link.comment || link.title || link.description }}
                </p>
              </TooltipTrigger>
              <TooltipContent @click.stop>
                <p class="max-w-[90svw] break-all">
                  {{ link.comment || link.title || link.description }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Popover @click.stop>
          <PopoverTrigger as-child @click.stop>
            <QrCode
              class="w-5 h-5 cursor-pointer"
            />
          </PopoverTrigger>
          <PopoverContent class="w-auto max-w-sm p-3" @click.stop>
            <QRCode
              :data="shortLink"
            />
          </PopoverContent>
        </Popover>

        <DashboardLinksEditor
          :link="link"
          @update:link="updateLink"
        >
          <SquarePen
            class="w-5 h-5 cursor-pointer ml-2"
          />
          <template #delete-button="{ link: editorLink }">
            <DashboardLinksDelete
              :link="editorLink"
              @update:link="updateLink"
            >
              <Button
                type="button"
                variant="destructive"
                class="w-full justify-start"
              >
                <Eraser class="w-5 h-5 mr-2" />
                {{ $t('common.delete') }}
              </Button>
            </DashboardLinksDelete>
          </template>
        </DashboardLinksEditor>
      </div>
      <div class="flex items-center text-sm mt-auto opacity-60 h-5">
        <TooltipProvider @click.stop>
          <Tooltip @click.stop>
            <TooltipTrigger as-child @click.stop>
              <span class="shrink-0">{{ shortDate(link.createdAt) }}</span>
            </TooltipTrigger>
            <TooltipContent @click.stop>
              <p>Created At: {{ longDate(link.createdAt) }}</p>
              <p>Updated At: {{ longDate(link.updatedAt) }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <template v-if="link.expiration">
          <Separator orientation="vertical" class="mx-2" @click.stop />
          <TooltipProvider @click.stop>
            <Tooltip @click.stop>
              <TooltipTrigger as-child @click.stop>
                <span class="inline-flex items-center shrink-0"><Hourglass class="w-4 h-4 mr-1" /> {{ shortDate(link.expiration) }}</span>
              </TooltipTrigger>
              <TooltipContent @click.stop>
                <p>Expires At: {{ longDate(link.expiration) }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </template>
        <Separator orientation="vertical" class="mx-2" @click.stop />
        <Copy
          v-if="!copiedOriginal"
          class="w-4 h-4 shrink-0 text-muted-foreground cursor-pointer mr-1"
          @click.stop="copyOriginalLink"
        />
        <CopyCheck
          v-else
          class="w-4 h-4 shrink-0 text-muted-foreground mr-1"
        />
        <span
          class="truncate text-muted-foreground cursor-pointer hover:underline flex-1 min-w-0"
          @click.stop="navigateToOriginalUrl"
        >
          {{ displayedOriginalUrl }}
        </span>
        <TooltipProvider class="ml-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="inline-flex items-center shrink-0">
                <ClipboardIcon class="w-4 h-4 mr-1" />
                {{ kFormatter(link.clicks) }}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clicks: {{ link.clicks }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </Card>
</template>
