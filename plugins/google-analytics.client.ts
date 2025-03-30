// Google Analytics Integration for Nuxt 3
import { createGtm } from '@gtm-support/vue-gtm'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // Only enable GTM in production to avoid tracking during development
  const enabled = process.env.NODE_ENV === 'production'

  nuxtApp.vueApp.use(
    createGtm({
      id: config.public.googleTagManagerId || 'GTM-XXXXXXX', // Replace with your GTM ID
      debug: false, // Set to true during testing if needed
      enabled,
      loadScript: true,
      vueRouter: useRouter(),
      trackOnNextTick: false,
    })
  )
})
