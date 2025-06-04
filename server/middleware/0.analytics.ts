import { parsePath } from 'ufo'

export default eventHandler(async (event) => {
  // Only process on successful redirects
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, ''))
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const config = useRuntimeConfig(event)
  const { gaMeasurementId, domainName, googleTagManagerId } = config.public
  const { linkCacheTtl, caseSensitive } = useRuntimeConfig(event)
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
    // Get the link data independently (don't depend on 1.redirect)
    const { cloudflare } = event.context
    if (!cloudflare) {
      if (isDevMode) {
        console.warn('0.analytics: Cloudflare context not available')
        setResponseHeader(event, 'X-Analytics-Error', 'no-cloudflare-context')
      }
      return
    }

    const { KV } = cloudflare.env
    let link = null

    try {
      const getLink = async (key: string) =>
        await KV.get(`link:${key}`, { type: 'json', cacheTtl: linkCacheTtl })

      const lowerCaseSlug = slug.toLowerCase()
      link = await getLink(caseSensitive ? slug : lowerCaseSlug)

      // fallback to original slug if caseSensitive is false and the slug is not found
      if (!caseSensitive && !link && lowerCaseSlug !== slug) {
        link = await getLink(slug)
      }

      // Only proceed if we found a valid link
      if (!link) {
        if (isDevMode) {
          console.warn(`0.analytics: No link found for slug: ${slug}`)
          setResponseHeader(event, 'X-Analytics-Error', 'link-not-found')
        }
        return
      }

      // Store link in context for 1.redirect to use (if it hasn't been set already)
      if (!event.context.link) {
        event.context.link = link
      }

      // We'll use Nitro's built-in fetch to send an event to Google Analytics
      // This is more reliable than client-side JS which may not execute during redirects
      const measurementId = gaMeasurementId
      const analyticsEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

      const clientId = getHeader(event, 'cf-connecting-ip') || getRequestIP(event) || '555' // Anonymous client ID as fallback
      const userAgent = getHeader(event, 'user-agent') || ''

      // Get the actual target URL from link for enhanced event tracking
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
        console.log('0.analytics payload:', JSON.stringify(payload, null, 2))
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
          console.error('0.analytics error:', response.status, response.statusText)
          if (isDevMode) {
            response.text().then((text) => {
              console.error('0.analytics error response:', text)
            }).catch((e) => {
              console.error('Could not get response text:', e)
            })
          }
        }
        else {
          if (isDevMode) {
            console.log('0.analytics event sent successfully!')
            setResponseHeader(event, 'X-Analytics-Debug', 'success')
          }
        }
      }).catch((error) => {
        console.error('0.analytics failed to send event:', error)
      })

      // Always add a tracking header so we know 0.analytics attempted to track
      setResponseHeader(event, 'X-Analytics-Tracked', 'server-side')
      setResponseHeader(event, 'X-Analytics-Source', '0.analytics')
    }
    catch (linkError) {
      console.error('0.analytics link lookup error:', linkError)
      if (isDevMode) {
        setResponseHeader(event, 'X-Analytics-Error', 'link-lookup-failed')
      }
    }
  }
  else if (isDevMode) {
    // More detailed logging about why tracking didn't happen
    if (!gaMeasurementId) {
      console.warn('0.analytics: Google Analytics not configured - Missing GA_MEASUREMENT_ID environment variable')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-measurement-id')
    }
    else if (!apiSecret) {
      console.warn('0.analytics: Google Analytics not configured - Missing GA_API_SECRET environment variable')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-api-secret')
    }
    else if (!slug || reserveSlug.includes(slug) || !slugRegex.test(slug)) {
      console.warn('0.analytics: Not tracking - Invalid or reserved slug')
      setResponseHeader(event, 'X-Analytics-Error', 'invalid-slug')
    }
  }
})
