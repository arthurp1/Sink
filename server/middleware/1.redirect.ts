import type { LinkSchema } from '@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context

  if (slug && !reserveSlug.includes(slug) && slugRegex.test(slug) && cloudflare) {
    const { KV } = cloudflare.env

    let link: z.infer<typeof LinkSchema> | null = null

    const getLink = async (key: string) =>
      await KV.get(`link:${key}`, { type: 'json', cacheTtl: linkCacheTtl })

    const lowerCaseSlug = slug.toLowerCase()
    link = await getLink(caseSensitive ? slug : lowerCaseSlug)

    // fallback to original slug if caseSensitive is false and the slug is not found
    if (!caseSensitive && !link && lowerCaseSlug !== slug) {
      console.log('original slug fallback:', `slug:${slug} lowerCaseSlug:${lowerCaseSlug}`)
      link = await getLink(slug)
    }

    if (link) {
      event.context.link = link
      try {
        // Log access to Cloudflare Analytics
        await useAccessLog(event)
      }
      catch (error) {
        console.error('Failed write access log:', error)
      }

      // Check if Google Analytics is enabled
      const { googleTagManagerId, gaMeasurementId } = useRuntimeConfig(event).public
      const target = redirectWithQuery ? withQuery(link.url, getQuery(event)) : link.url

      // Set a header to indicate this was a tracked redirect
      if (googleTagManagerId || gaMeasurementId) {
        setResponseHeader(event, 'X-Analytics-Tracked', 'client-side')
        setResponseHeader(event, 'X-Analytics-Source', '1.redirect')

        // If GA is configured, instead of immediate redirect, we'll return an HTML page with Google Analytics
        // that will automatically redirect after ensuring GA script is loaded
        if (gaMeasurementId && gaMeasurementId !== 'G-XXXXXXX') {
          setResponseHeader(event, 'Content-Type', 'text/html')

          // Extract metadata for better previews
          const pageTitle = link.title || `Redirecting to ${new URL(target).hostname}` || `Redirect: ${slug}`
          const pageDescription = link.description || `Redirecting you to ${target}` || `You will be redirected to ${target}`
          const pageImage = link.image || '/icon-192.png' // Default to site icon
          const siteName = 'AIB Shorten URLs'
          const canonicalUrl = `https://${getHeader(event, 'host') || 'aib.club'}/${slug}`

          return `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>${pageTitle}</title>
            <meta name="description" content="${pageDescription}">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            
            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website">
            <meta property="og:url" content="${canonicalUrl}">
            <meta property="og:title" content="${pageTitle}">
            <meta property="og:description" content="${pageDescription}">
            <meta property="og:image" content="${pageImage}">
            <meta property="og:site_name" content="${siteName}">
            
            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image">
            <meta property="twitter:url" content="${canonicalUrl}">
            <meta property="twitter:title" content="${pageTitle}">
            <meta property="twitter:description" content="${pageDescription}">
            <meta property="twitter:image" content="${pageImage}">
            
            <!-- Canonical URL -->
            <link rel="canonical" href="${canonicalUrl}">
            
            <!-- Favicon -->
            <link rel="icon" href="/favicon.ico">
            <link rel="apple-touch-icon" href="/icon-192.png">
            
            <!-- Reduce flash with styling -->
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                background: #ffffff;
                color: #333;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                text-align: center;
              }
              .container {
                max-width: 500px;
                padding: 2rem;
              }
              h1 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: #2563eb;
              }
              p {
                font-size: 1rem;
                margin-bottom: 1.5rem;
                color: #6b7280;
              }
              .spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f4f6;
                border-radius: 50%;
                border-top-color: #2563eb;
                animation: spin 1s ease-in-out infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              .destination {
                font-size: 0.875rem;
                color: #9ca3af;
                word-break: break-all;
                margin-top: 1rem;
              }
              /* Hide content until page loads to prevent flash */
              .container {
                opacity: 0;
                animation: fadeIn 0.3s ease-in-out forwards;
              }
              @keyframes fadeIn {
                to { opacity: 1; }
              }
            </style>
            
            <!-- Google tag (gtag.js) -->
            <script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');

              // Track the page view event - this is a GA4 best practice for proper page view tracking
              gtag('config', '${gaMeasurementId}', {
                page_title: '${pageTitle.replace(/'/g, '\\\'')}',
                page_path: '/${slug}',
                page_location: window.location.href
              });

              // Track the custom redirect event
              gtag('event', 'redirect', {
                slug: '${slug}',
                destination: '${target.replace(/'/g, '\\\'')}',
                domain: window.location.hostname,
                referrer: document.referrer || '',
                timestamp: new Date().toISOString(),
                event_category: 'Slug',
                event_label: '${slug}'
              });

              // Also track a custom event specifically for redirects
              gtag('event', 'custom_redirect', {
                slug: '${slug}',
                destination: '${target.replace(/'/g, '\\\'')}',
                domain: window.location.hostname,
                referrer: document.referrer || '',
                timestamp: new Date().toISOString()
              });

              // Redirect after a tiny delay to ensure tracking is sent
              setTimeout(function() {
                window.location.href = "${target.replace(/"/g, '&quot;')}";
              }, 100); // Slightly longer delay to ensure all tracking events are sent
            </script>
          </head>
          <body>
            <div class="container">
              <h1>Redirecting...</h1>
              <div class="spinner"></div>
              <p>You will be redirected momentarily</p>
              <div class="destination">Destination: ${new URL(target).hostname}</div>
            </div>
          </body>
          </html>`
        }
      }

      // Use standard HTTP redirect if we didn't return the HTML tracking page
      return sendRedirect(event, target, +useRuntimeConfig(event).redirectStatusCode)
    }
  }
})
