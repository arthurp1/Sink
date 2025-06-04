<script setup>
import { Download } from 'lucide-vue-next'
import QRCodeStyling from 'qr-code-styling'

const props = defineProps({
  data: {
    type: String,
    required: true,
  },
})

const color = ref('#000000')
const showFavicon = ref(true)
const whiteBackground = ref(false)

const computedOptions = computed(() => ({
  width: 512,
  height: 512,
  data: props.data,
  margin: 20,
  qrOptions: { typeNumber: '0', mode: 'Byte', errorCorrectionLevel: 'Q' },
  imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
  dotsOptions: { type: 'dots', color: color.value, gradient: null },
  backgroundOptions: { color: whiteBackground.value ? '#ffffff' : 'transparent', gradient: null },
  image: showFavicon.value ? '/icon-192.png' : undefined,
  cornersSquareOptions: { type: 'extra-rounded', color: color.value },
  cornersDotOptions: { type: 'dot', color: color.value },
}))

const qrCode = new QRCodeStyling(computedOptions.value)
const qrCodeEl = ref(null)

function updateQRCode() {
  qrCode.update(computedOptions.value)
}

watch([color, showFavicon, whiteBackground], () => {
  updateQRCode()
})

function downloadQRCode() {
  const slug = props.data.split('/').pop()
  qrCode.download({
    extension: 'png',
    name: `qr_${slug}`,
  })
}

onMounted(() => {
  qrCode.append(qrCodeEl.value)
})
</script>

<template>
  <div class="flex flex-col gap-3 w-full min-w-0">
    <!-- QR Code Display -->
    <div
      ref="qrCodeEl"
      :data-text="data"
      class="w-full aspect-square rounded-lg overflow-hidden"
      :class="{ 'bg-white': whiteBackground }"
    />

    <!-- Compact Info -->
    <div class="text-center space-y-1">
      <p class="text-xs font-medium">
        aib.club/{{ data.split('/').pop() }}
      </p>
      <p class="text-xs text-muted-foreground truncate">
        <a
          :href="data"
          target="_blank"
          class="hover:underline"
        >
          {{ data.replace('https://', '') }}
        </a>
      </p>
    </div>

    <!-- Compact Controls -->
    <div class="space-y-2">
      <!-- Checkboxes -->
      <div class="flex items-center justify-between text-xs gap-2">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input
            v-model="whiteBackground"
            type="checkbox"
            class="w-3 h-3"
          >
          <span>White background</span>
        </label>
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input
            v-model="showFavicon"
            type="checkbox"
            class="w-3 h-3"
          >
          <span>Show favicon</span>
        </label>
      </div>

      <!-- Color and Download -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <div
            class="w-6 h-6 rounded border cursor-pointer overflow-hidden"
            :style="{ backgroundColor: color }"
            title="Change QR code color"
          >
            <input
              v-model="color"
              type="color"
              class="absolute w-6 h-6 opacity-0 cursor-pointer"
              title="Change QR code color"
            >
          </div>
          <span class="text-xs text-muted-foreground">Color</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2 text-xs"
          @click="downloadQRCode"
        >
          <Download class="w-3 h-3 mr-1" />
          Download
        </Button>
      </div>
    </div>
  </div>
</template>
