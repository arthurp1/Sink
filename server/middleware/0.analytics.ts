import { parsePath } from 'ufo'

export default eventHandler(async (event) => {
  // Only process on successful redirects
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { googleTagManagerId } = useRuntimeConfig(event).public

  // Only track if Google Analytics is configured and the slug is valid
  if (googleTagManagerId && slug && !reserveSlug.includes(slug) && slugRegex.test(slug)) {
    // We'll use Nitro's built-in fetch to send an event to Google Analytics
    // This is more reliable than client-side JS which may not execute during redirects
    try {
      const measurementId = googleTagManagerId.replace('GTM-', 'G-') // Convert GTM ID to GA4 ID if applicable
      const analyticsEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${process.env.GA_API_SECRET || 'analytics_secret'}`

      const clientId = getHeader(event, 'cf-connecting-ip') || getRequestIP(event) || '555' // Anonymous client ID as fallback
      const userAgent = getHeader(event, 'user-agent') || ''

      // Prepare the analytics payload
      const payload = {
        client_id: clientId,
        user_agent: userAgent,
        events: [{
          name: 'page_view',
          params: {
            page_title: `Redirect: ${slug}`,
            page_location: `${getRequestURL(event).origin}/${slug}`,
            page_path: `/${slug}`
          }
        }]
      }

      // Send the event to Google Analytics asynchronously
      // We don't await this to avoid slowing down the redirect
      fetch(analyticsEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.error('Failed to send analytics event:', error)
      })
    } catch (error) {
      console.error('Analytics error:', error)
    }
  }
})
