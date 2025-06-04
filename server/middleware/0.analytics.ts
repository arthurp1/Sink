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
      }
      setResponseHeader(event, 'X-Analytics-Error', 'no-cloudflare-context')
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
        }
        setResponseHeader(event, 'X-Analytics-Error', 'link-not-found')
        return
      }

      // Store link in context for 1.redirect to use (if it hasn't been set already)
      if (!event.context.link) {
        event.context.link = link
      }

      // Prepare analytics data
      const measurementId = gaMeasurementId
      const analyticsEndpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

      const clientId = getHeader(event, 'cf-connecting-ip') || getRequestIP(event) || '555'
      const userAgent = getHeader(event, 'user-agent') || ''
      const targetUrl = link.url || ''
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
            page_location: `https://${host}/${slug}`,
            page_path: `/${slug}`,
          },
        }, {
          name: 'link_click',
          params: {
            slug,
            destination: targetUrl,
            referrer: getHeader(event, 'referer') || '',
          },
        }, {
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

      // Create the analytics promise
      const analyticsPromise = fetch(analyticsEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`0.analytics error: ${response.status} ${response.statusText}`)
          console.error('0.analytics error response:', errorText)
          setResponseHeader(event, 'X-Analytics-Error', `ga-api-error-${response.status}`)
          return { success: false, status: response.status, error: errorText }
        }
        else {
          if (isDevMode) {
            console.log('0.analytics event sent successfully!')
          }
          setResponseHeader(event, 'X-Analytics-Debug', 'success')
          return { success: true, status: response.status }
        }
      }).catch((fetchError) => {
        console.error('0.analytics fetch failed:', fetchError)
        setResponseHeader(event, 'X-Analytics-Error', 'fetch-failed')
        return { success: false, error: fetchError.message }
      })

      // Critical: Use waitUntil to ensure analytics completes
      // This prevents the Worker from terminating before the GA request finishes
      if (typeof event.waitUntil === 'function') {
        event.waitUntil(analyticsPromise)
      }
      else if (event.context?.cloudflare?.ctx?.waitUntil) {
        // Alternative access pattern for Cloudflare context
        event.context.cloudflare.ctx.waitUntil(analyticsPromise)
      }
      else {
        // Fallback: await the promise to ensure completion
        await analyticsPromise
      }

      // Set success headers
      setResponseHeader(event, 'X-Analytics-Tracked', 'server-side')
      setResponseHeader(event, 'X-Analytics-Source', '0.analytics')
    }
    catch (linkError) {
      console.error('0.analytics link lookup error:', linkError)
      setResponseHeader(event, 'X-Analytics-Error', 'link-lookup-failed')
    }
  }
  else {
    // More detailed logging about why tracking didn't happen
    if (!gaMeasurementId) {
      console.warn('0.analytics: Missing GA_MEASUREMENT_ID')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-measurement-id')
    }
    else if (!apiSecret) {
      console.warn('0.analytics: Missing GA_API_SECRET')
      setResponseHeader(event, 'X-Analytics-Error', 'missing-api-secret')
    }
    else if (!slug || reserveSlug.includes(slug) || !slugRegex.test(slug)) {
      console.warn('0.analytics: Invalid or reserved slug')
      setResponseHeader(event, 'X-Analytics-Error', 'invalid-slug')
    }
    else {
      setResponseHeader(event, 'X-Analytics-Error', 'unknown-condition')
    }
  }
})
