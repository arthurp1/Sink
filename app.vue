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
        // Google Tag Manager
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${config.public.googleTagManagerId || 'GTM-XXXXXXX'}');
      `,
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
      // Page view tracking is handled automatically by the GTM plugin,
      // this is just an additional way to track specific data if needed
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'nuxt-route-change',
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
    <NuxtLoadingIndicator color="#000" />
    <NuxtPage />
    <Toaster />
  </NuxtLayout>
</template>
