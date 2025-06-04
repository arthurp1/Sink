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
const options = {
  width: 512,
  height: 512,
  data: props.data,
  margin: 20,
  qrOptions: { typeNumber: '0', mode: 'Byte', errorCorrectionLevel: 'Q' },
  imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
  dotsOptions: { type: 'dots', color: '#000000', gradient: null },
  backgroundOptions: { color: 'transparent', gradient: null },
  image: '/icon-192.png',
  dotsOptionsHelper: {
    colorType: { single: true, gradient: false },
    gradient: {
      linear: true,
      radial: false,
      color1: '#6a1a4c',
      color2: '#6a1a4c',
      rotation: '0',
    },
  },
  cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
  cornersSquareOptionsHelper: {
    colorType: { single: true, gradient: false },
    gradient: {
      linear: true,
      radial: false,
      color1: '#000000',
      color2: '#000000',
      rotation: '0',
    },
  },
  cornersDotOptions: { type: 'dot', color: '#000000' },
  cornersDotOptionsHelper: {
    colorType: { single: true, gradient: false },
    gradient: {
      linear: true,
      radial: false,
      color1: '#000000',
      color2: '#000000',
      rotation: '0',
    },
  },
  backgroundOptionsHelper: {
    colorType: { single: true, gradient: false },
    gradient: {
      linear: true,
      radial: false,
      color1: 'transparent',
      color2: 'transparent',
      rotation: '0',
    },
  },
}

const qrCode = new QRCodeStyling(options)
const qrCodeEl = ref(null)

function updateColor(newColor) {
  qrCode.update({
    dotsOptions: { type: 'dots', color: newColor, gradient: null },
    cornersSquareOptions: { type: 'extra-rounded', color: newColor },
    cornersDotOptions: { type: 'dot', color: newColor },
  })
}

watch(color, (newColor) => {
  updateColor(newColor)
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
  <div class="flex flex-col items-center gap-4">
    <div
      ref="qrCodeEl"
      :data-text="data"
      class="rounded-lg"
    />
    <p class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
      aib.club/{{ data.split('/').pop() }}
    </p>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <a
        :href="data"
        target="_blank"
        class="text-blue-500 hover:underline"
      >
        {{ data.replace('https://', '') }}
      </a>
    </p>
    <div class="flex items-center gap-4">
      <div class="relative flex items-center">
        <div
          class="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden"
          :style="{ backgroundColor: color }"
          title="Change QR code color"
        >
          <input
            v-model="color"
            type="color"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Change QR code color"
          >
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="downloadQRCode"
      >
        <Download class="w-4 h-4 mr-2" />
        {{ $t('links.download_qr_code') }}
      </Button>
    </div>
  </div>
</template>
