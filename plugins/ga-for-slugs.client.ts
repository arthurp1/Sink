import { defineNuxtPlugin } from '#app'
import { trackRedirect } from '~/utils/analytics'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const gaMeasurementId = config.public.gaMeasurementId || 'G-YTWJTM33GX'

  // Check if we're on a slug page
  const _router = useRouter()
  const _route = useRoute()

  nuxtApp.hook('app:created', () => {
    // Add Google Analytics script to head when it doesn't exist already
    if (typeof document !== 'undefined' && !document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaMeasurementId}"]`)) {
      // Create the gtag.js script
      const gtagScript = document.createElement('script')
      gtagScript.async = true
      gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`
      document.head.appendChild(gtagScript)

      // Create the gtag config script
      const configScript = document.createElement('script')
      configScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaMeasurementId}');
      `
      document.head.appendChild(configScript)
    }
  })

  nuxtApp.hook('page:finish', () => {
    // Check if this is a slug path (not starting with /dashboard, etc.)
    const path = window.location.pathname
    const { slugRegex, reserveSlug } = useAppConfig()
    const slug = path.replace(/^\/|\/$/g, '') // Remove leading/trailing slashes

    if (slug && !reserveSlug.includes(slug) && slugRegex.test(slug)) {
      // Track that we're handling a slug that will redirect
      trackRedirect(slug)
    }
  })
})
