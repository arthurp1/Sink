import { defineNuxtPlugin } from '#app'
// Google Analytics Integration for Nuxt 3
import { createGtm } from '@gtm-support/vue-gtm'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const gtmId = config.public.googleTagManagerId

  // Enable GTM in all environments, but log extra info in development
  const isDevMode = process.env.NODE_ENV !== 'production'

  // Log initialization attempt in development
  if (isDevMode) {
    console.log(`Initializing Google Tag Manager with ID: ${gtmId || 'Not configured'}`)
  }

  // Only initialize if we have an ID
  if (gtmId && gtmId !== 'GTM-XXXXXXX') {
    try {
      nuxtApp.vueApp.use(
        createGtm({
          id: gtmId,
          debug: isDevMode, // Enable debug mode in development
          enabled: true, // Always enable, we'll check environment conditions elsewhere
          loadScript: true,
          vueRouter: useRouter(),
          trackOnNextTick: false,
        }),
      )

      // Check if dataLayer is properly initialized
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || []

        // Add a test event in development mode
        if (isDevMode) {
          window.dataLayer.push({
            event: 'gtm_initialized',
            gtm_id: gtmId,
          })
          console.log('Google Tag Manager initialized successfully')
        }
      }
    }
    catch (error) {
      console.error('Failed to initialize Google Tag Manager:', error)
    }
  }
  else if (isDevMode) {
    console.warn('Google Tag Manager not initialized: Missing or invalid GTM ID')
  }
})
