import { parsePath } from 'ufo'

export default eventHandler(async (event) => {
  // Only process on successful redirects
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const config = useRuntimeConfig(event)
  const { gaMeasurementId, domainName, googleTagManagerId } = config.public
  const apiSecret = config.gaApiSecret
  const isDevMode = process.env.NODE_ENV !== 'production'

  // Log configuration status in development mode
  if (isDevMode) {
    console.log(`Analytics middleware processing request for path: ${event.path}`)
    console.log(`GA Measurement ID configured: ${!!gaMeasurementId}`)
    console.log(`GA API Secret configured: ${!!apiSecret}`)
    console.log(`GTM ID configured: ${!!googleTagManagerId}`)
  }

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
      const host = getHeader(event, 'host') || domain

      // Prepare the analytics payload
      const payload = {
        client_id: clientId,
        user_agent: userAgent,
        events: [{
          name: 'page_view',
          params: {
            page_title: `Redirect: ${slug}`,
            page_location: `https://${host}/${slug}`, // Use actual host from request
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
            domain: host,
            referrer: getHeader(event, 'referer') || '',
            user_agent: userAgent,
            timestamp: new Date().toISOString(),
            event_category: 'Slug',
            event_label: slug,
          },
        }, {
          // Add another custom event specifically for redirects to ensure consistent tracking
          name: 'custom_redirect',
          params: {
            slug,
            destination: targetUrl,
            domain: host,
            referrer: getHeader(event, 'referer') || '',
            user_agent: userAgent,
            timestamp: new Date().toISOString(),
          },
        }],
      }

      // For debugging, log the payload in development
      if (isDevMode) {
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
          if (isDevMode) {
            response.text().then((text) => {
              console.error('Analytics error response:', text)
            }).catch((e) => {
              console.error('Could not get response text:', e)
            })
          }
        }
        else if (isDevMode) {
          console.log('Analytics event sent successfully!')

          // Set debug header in development mode
          setResponseHeader(event, 'X-Analytics-Debug', 'success')
        }
      }).catch((error) => {
        console.error('Failed to send analytics event:', error)
      })

      // Always add a tracking header so the client knows we attempted to track
      setResponseHeader(event, 'X-Analytics-Tracked', 'true')
    }
    catch (error) {
      console.error('Analytics error:', error)
    }
  }
  else if (isDevMode) {
    // More detailed logging about why tracking didn't happen
    if (!gaMeasurementId) {
      console.warn('Google Analytics not configured: Missing GA_MEASUREMENT_ID environment variable')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-measurement-id')
    }
    else if (!apiSecret) {
      console.warn('Google Analytics not configured: Missing GA_API_SECRET environment variable')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-api-secret')
    }
    else if (!slug || reserveSlug.includes(slug) || !slugRegex.test(slug)) {
      console.warn('Not tracking: Invalid or reserved slug')
      setResponseHeader(event, 'X-Analytics-Error', 'invalid-slug')
    }
  }
})
