<script setup>
const { title, description, image } = useAppConfig()
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
})

// Track route changes for analytics
const router = useRouter()
router.afterEach((to) => {
  // Only track in client-side
  if (process.client) {
    // Allow the page to finish rendering before sending the page view
    nextTick(() => {
      // Page view tracking is handled automatically by the GTM plugin,
      // this is just an additional way to track specific data if needed
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'nuxt-route-change',
          page_path: to.fullPath,
          page_title: document.title
        })
      }
    })
  }
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#000" />
    <NuxtPage />
    <Toaster />
  </NuxtLayout>
</template>
