<script setup>
import { useClipboard } from '@vueuse/core'
import { CalendarPlus2, Clipboard as ClipboardIcon, Copy, CopyCheck, Eraser, Hourglass, QrCode, SquareChevronDown, SquarePen } from 'lucide-vue-next'
import { parseURL } from 'ufo'
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import QRCode from './QRCode.vue'

const props = defineProps({
  link: {
    type: Object,
    required: true,
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
const linkIcon = computed(() => `https://unavatar.io/${getLinkHost(props.link.url)}?fallback=https://sink.cool/icon.png`)

const copyLinkText = computed(() => shortLink.value)

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
</script>

<template>
  <Card class="min-h-[150px]">
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
          <PopoverContent @click.stop>
            <QRCode
              :data="shortLink"
              :image="linkIcon"
            />
          </PopoverContent>
        </Popover>

        <Popover v-model:open="editPopoverOpen" @click.stop>
          <PopoverTrigger as-child @click.stop>
            <SquareChevronDown
              class="w-5 h-5 cursor-pointer"
            />
          </PopoverTrigger>
          <PopoverContent
            class="w-auto p-0"
            :hide-when-detached="false"
            @click.stop
          >
            <DashboardLinksEditor
              :link="link"
              @update:link="updateLink"
            >
              <div
                class="cursor-pointer flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <SquarePen
                  class="w-5 h-5 mr-2"
                />
                {{ $t('common.edit') }}
              </div>
            </DashboardLinksEditor>

            <Separator />

            <DashboardLinksDelete
              :link="link"
              @update:link="updateLink"
            >
              <div
                class="cursor-pointer flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <Eraser
                  class="w-5 h-5 mr-2"
                /> {{ $t('common.delete') }}
              </div>
            </DashboardLinksDelete>
          </PopoverContent>
        </Popover>
      </div>
      <div class="flex w-full space-x-2 text-sm mt-auto">
        <TooltipProvider @click.stop>
          <Tooltip @click.stop>
            <TooltipTrigger as-child @click.stop>
              <span class="inline-flex items-center leading-5"><CalendarPlus2 class="w-4 h-4 mr-1" /> {{ shortDate(link.createdAt) }}</span>
            </TooltipTrigger>
            <TooltipContent @click.stop>
              <p>Created At: {{ longDate(link.createdAt) }}</p>
              <p>Updated At: {{ longDate(link.updatedAt) }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <template v-if="link.expiration">
          <Separator orientation="vertical" @click.stop />
          <TooltipProvider @click.stop>
            <Tooltip @click.stop>
              <TooltipTrigger as-child @click.stop>
                <span class="inline-flex items-center leading-5"><Hourglass class="w-4 h-4 mr-1" /> {{ shortDate(link.expiration) }}</span>
              </TooltipTrigger>
              <TooltipContent @click.stop>
                <p>Expires At: {{ longDate(link.expiration) }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </template>
        <Separator orientation="vertical" @click.stop />
        <div class="flex items-center gap-1 flex-grow">
          <ClipboardIcon
            class="w-4 h-4 text-muted-foreground cursor-pointer"
            @click.stop="copyLink"
          />
          <div class="flex-1 flex items-center justify-center">
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-left overflow-hidden text-ellipsis line-clamp-2"
            >
              {{ displayedOriginalUrl }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
