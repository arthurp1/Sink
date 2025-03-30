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
        setResponseHeader(event, 'X-Analytics-Tracked', 'true')

        // If GA is configured, instead of immediate redirect, we'll return an HTML page with Google Analytics
        // that will automatically redirect after ensuring GA script is loaded
        if (gaMeasurementId && gaMeasurementId !== 'G-XXXXXXX') {
          setResponseHeader(event, 'Content-Type', 'text/html')
          return `<!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <!-- Google tag (gtag.js) -->
            <script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
            <script>
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');

              // Track the redirect event
              gtag('event', 'page_view', {
                page_title: 'Redirect: ${slug}',
                page_path: '/${slug}'
              });

              gtag('event', 'redirect', {
                slug: '${slug}',
                destination: '${target}',
                domain: window.location.hostname,
                referrer: document.referrer || '',
                timestamp: new Date().toISOString()
              });

              // Redirect after a tiny delay to ensure tracking is sent
              setTimeout(function() {
                window.location.href = "${target}";
              }, 50);
            </script>
          </head>
          <body>
            <p>Redirecting to ${target}...</p>
          </body>
          </html>`
        }
      }

      // Use standard HTTP redirect if we didn't return the HTML tracking page
      return sendRedirect(event, target, +useRuntimeConfig(event).redirectStatusCode)
    }
  }
})
