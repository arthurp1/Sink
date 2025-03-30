import { parsePath } from 'ufo'

export default eventHandler(async (event) => {
  // Only process on successful redirects
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const config = useRuntimeConfig(event)
  const { gaMeasurementId, domainName } = config.public
  const apiSecret = config.gaApiSecret

  // Only track if Google Analytics is configured and the slug is valid
  if (gaMeasurementId && apiSecret && slug && !reserveSlug.includes(slug) && slugRegex.test(slug)) {
    // We'll use Nitro's built-in fetch to send an event to Google Analytics
    // This is more reliable than client-side JS which may not execute during redirects
    try {
      // Using config values
      const measurementId = gaMeasurementId

      const analyticsEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

      const clientId = getHeader(event, 'cf-connecting-ip') || getRequestIP(event) || '555' // Anonymous client ID as fallback
      const userAgent = getHeader(event, 'user-agent') || ''

      // Get the actual target URL from link for enhanced event tracking
      const link = event.context.link || {}
      const targetUrl = link.url || ''

      // Make sure the domain is set, falling back to localhost if not configured
      const domain = domainName || 'localhost:3000'

      // Prepare the analytics payload
      const payload = {
        client_id: clientId,
        user_agent: userAgent,
        events: [{
          name: 'page_view',
          params: {
            page_title: `Redirect: ${slug}`,
            page_location: `https://${domain}/${slug}`, // Use configured domain
            page_path: `/${slug}`,
          },
        }, {
          // Add a custom event for link clicks with more detailed parameters
          name: 'link_click',
          params: {
            slug,
            destination: targetUrl,
            referrer: getHeader(event, 'referer') || '',
          },
        }, {
          // Add the custom 'redirect' event as requested
          name: 'redirect',
          params: {
            slug,
            destination: targetUrl,
            domain: getHeader(event, 'host') || domain,
            referrer: getHeader(event, 'referer') || '',
            user_agent: userAgent,
          },
        }],
      }

      // For debugging, log the payload in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Analytics payload:', JSON.stringify(payload, null, 2))
      }

      // Send the event to Google Analytics asynchronously
      // We don't await this to avoid slowing down the redirect
      fetch(analyticsEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        if (!response.ok) {
          console.error('Analytics error:', response.status, response.statusText)
        }
        else if (process.env.NODE_ENV !== 'production') {
          console.log('Analytics event sent successfully!')
        }
      }).catch((error) => {
        console.error('Failed to send analytics event:', error)
      })
    }
    catch (error) {
      console.error('Analytics error:', error)
    }
  }
  else if (process.env.NODE_ENV !== 'production' && !gaMeasurementId) {
    // In development, log a message if analytics isn't configured
    console.warn('Google Analytics not configured: Missing GA_MEASUREMENT_ID environment variable')
  }
  else if (process.env.NODE_ENV !== 'production' && !apiSecret) {
    // In development, log a message if analytics isn't configured
    console.warn('Google Analytics not configured: Missing GA_API_SECRET environment variable')
  }
})
