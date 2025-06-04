<script setup>
const { title, description, image } = useAppConfig()
const config = useRuntimeConfig()

useSeoMeta({
  title: `${title} - ${description}`,
  description,
  ogType: 'website',
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: image,
  twitterCard: 'summary_large_image',
})

// Add Google Tag Manager direct script to head
useHead({
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
      tagPosition: 'head',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: '/icon-192.png',
    },
  ],
  script: [
    {
      children: `
        // Direct Google Analytics 4 implementation
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.public.gaMeasurementId || 'G-YTWJTM33GX'}');
      `,
      tagPosition: 'head',
    },
    {
      src: `https://www.googletagmanager.com/gtag/js?id=${config.public.gaMeasurementId || 'G-YTWJTM33GX'}`,
      async: true,
      tagPosition: 'head',
    },
  ],
})

// Track route changes for analytics
const router = useRouter()
router.afterEach((to) => {
  // Only track in client-side
  if (import.meta.client) {
    // Allow the page to finish rendering before sending the page view
    nextTick(() => {
      // Track page views with GA4 directly
      if (window.gtag) {
        window.gtag('config', config.public.gaMeasurementId || 'G-YTWJTM33GX', {
          page_path: to.fullPath,
          page_title: document.title,
        })
      }
    })
  }
})
</script>

<template>
  <NuxtLayout>
    <!-- Loading indicator with improved visibility and background -->
    <NuxtLoadingIndicator color="#000" height="4px" />

    <Suspense>
      <template #default>
        <NuxtPage />
      </template>
      <template #fallback>
        <div class="fixed inset-0 flex items-center justify-center bg-white" style="background-color: white; z-index: 9999;">
          <div class="text-center">
            <h1 class="text-2xl font-bold mb-2">
              Loading...
            </h1>
          </div>
        </div>
      </template>
    </Suspense>

    <Toaster />
  </NuxtLayout>
</template>

<style>
/* Add global style to ensure white background during page transitions */
.page-enter-active,
.page-leave-active {
  background-color: white !important;
}
</style>
