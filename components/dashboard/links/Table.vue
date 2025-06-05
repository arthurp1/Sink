<script setup>
import { useClipboard } from '@vueuse/core'
import { ArrowDown, ArrowUp, Clipboard as ClipboardIcon, Copy, CopyCheck, Eraser, QrCode, SquarePen } from 'lucide-vue-next'
import { parseURL } from 'ufo'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import QRCode from './QRCode.vue'

const _props = defineProps({
  links: {
    type: Array,
    required: true,
  },
  sortBy: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:link', 'update:sortBy'])

const { t } = useI18n()
const { origin } = location

const editPopoverOpen = ref(false)

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

function _getLinkHost(url) {
  const { host } = parseURL(url)
  return host
}

function copyLinkText(slug) {
  return computed(() => `${origin}/${slug}`).value.replace(/^(https?:\/\/)/, '')
}

const { copy, copied } = useClipboard({ source: '', copiedDuring: 400 })

function copyShortLink(slug) {
  copy(copyLinkText(slug))
  toast(t('links.copy_success'))
}

const displayedOriginalUrl = url => computed(() => stripMarketingParams(url)).value

const { copy: copyOriginal, copied: copiedOriginal } = useClipboard({ source: '', copiedDuring: 400 })

function copyOriginalLink(url) {
  copyOriginal(displayedOriginalUrl(url))
  toast(t('links.copy_success'))
}

function navigateToOriginalUrl(url) {
  window.open(url, '_blank')
}

function updateLink(link, type) {
  emit('update:link', link, type)
  editPopoverOpen.value = false
}

function handleSort(column) {
  let newSortBy = ''
  switch (column) {
    case 'slug':
      newSortBy = _props.sortBy === 'slug_az' ? 'slug_za' : 'slug_az'
      break
    case 'original_url':
      newSortBy = _props.sortBy === 'url_az' ? 'url_za' : 'url_az'
      break
    case 'clicks':
      newSortBy = _props.sortBy === 'clicks_asc' ? 'clicks_desc' : 'clicks_asc'
      break
    case 'createdAt':
      newSortBy = _props.sortBy === 'newest' ? 'oldest' : 'newest'
      break
    default:
      newSortBy = 'newest'
  }
  emit('update:sortBy', newSortBy)
}
</script>

<template>
  <div class="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[90px] cursor-pointer" @click="handleSort('slug')">
            <div class="flex items-center">
              {{ $t('common.slug') }}
              <template v-if="sortBy.startsWith('slug_')">
                <ArrowUp v-if="sortBy === 'slug_az'" class="ml-1 w-4 h-4" />
                <ArrowDown v-else class="ml-1 w-4 h-4" />
              </template>
            </div>
          </TableHead>
          <TableHead class="max-w-[250px] overflow-hidden cursor-pointer" @click="handleSort('original_url')">
            <div class="flex items-center">
              {{ $t('common.original_url') }}
              <template v-if="sortBy.startsWith('url_')">
                <ArrowUp v-if="sortBy === 'url_az'" class="ml-1 w-4 h-4" />
                <ArrowDown v-else class="ml-1 w-4 h-4" />
              </template>
            </div>
          </TableHead>
          <TableHead class="cursor-pointer" @click="handleSort('clicks')">
            <div class="flex items-center">
              {{ $t('common.clicks') }}
              <template v-if="sortBy.startsWith('clicks_')">
                <ArrowUp v-if="sortBy === 'clicks_asc'" class="ml-1 w-4 h-4" />
                <ArrowDown v-else class="ml-1 w-4 h-4" />
              </template>
            </div>
          </TableHead>
          <TableHead class="cursor-pointer" @click="handleSort('createdAt')">
            <div class="flex items-center">
              {{ $t('common.created_at') }}
              <template v-if="sortBy.startsWith('newest') || sortBy.startsWith('oldest')">
                <ArrowUp v-if="sortBy === 'oldest'" class="ml-1 w-4 h-4" />
                <ArrowDown v-else class="ml-1 w-4 h-4" />
              </template>
            </div>
          </TableHead>
          <TableHead class="w-[100px]">
            {{ $t('common.actions') }}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="link in links" :key="link.id">
          <TableCell class="font-medium">
            <div class="flex items-center cursor-pointer" @click="copyShortLink(link.slug)">
              <div class="font-bold leading-5 truncate text-md">
                {{ link.slug }}
              </div>
              <CopyCheck v-if="copied" class="w-4 h-4 ml-1 shrink-0" />
              <Copy v-else class="w-4 h-4 ml-1 shrink-0" />
            </div>
          </TableCell>
          <TableCell class="max-w-[250px] overflow-hidden">
            <div class="flex items-center">
              <TooltipProvider @click.stop>
                <Tooltip @click.stop>
                  <TooltipTrigger as-child @click.stop>
                    <span
                      class="truncate text-muted-foreground cursor-pointer hover:underline flex-1 min-w-0"
                      @click.stop="navigateToOriginalUrl(link.url)"
                    >
                      {{ displayedOriginalUrl(link.url) }}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent @click.stop>
                    <p class="max-w-[90svw] break-all">
                      {{ displayedOriginalUrl(link.url) }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Copy
                v-if="!copiedOriginal"
                class="w-4 h-4 shrink-0 text-muted-foreground cursor-pointer ml-1"
                @click.stop="copyOriginalLink(link.url)"
              />
              <CopyCheck
                v-else
                class="w-4 h-4 shrink-0 text-muted-foreground ml-1"
              />
            </div>
          </TableCell>
          <TableCell>
            <TooltipProvider>
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
          </TableCell>
          <TableCell>{{ shortDate(link.createdAt) }}</TableCell>
          <TableCell class="flex gap-2 items-center">
            <Popover @click.stop>
              <PopoverTrigger as-child @click.stop>
                <QrCode class="w-5 h-5 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent class="w-auto max-w-sm p-3" @click.stop>
                <QRCode :data="`${origin}/${link.slug}`" />
              </PopoverContent>
            </Popover>
            <Popover v-model:open="editPopoverOpen" @click.stop>
              <PopoverTrigger as-child @click.stop>
                <SquarePen class="w-5 h-5 cursor-pointer" />
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
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
