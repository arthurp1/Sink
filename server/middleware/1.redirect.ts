import type { LinkSchema } from '@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { homeURL, linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context

  if (event.path === '/' && homeURL)
    return sendRedirect(event, homeURL)

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

      // Check if Google Analytics is enabled and use client-side redirect for tracking
      const { googleTagManagerId } = useRuntimeConfig(event).public
      if (googleTagManagerId) {
        // Client-side redirection to ensure Google Analytics tracking fires
        const target = redirectWithQuery ? withQuery(link.url, getQuery(event)) : link.url

        // Render the client component with target URL for proper Google Analytics tracking
        return {
          slug,
          target,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Redirecting...</title>
                <script>
                  // Wait for GTM to load and track the page view
                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                    event: 'page_view',
                    page_title: 'Redirect: ${slug}',
                    page_path: '/${slug}'
                  });

                  // Redirect after a small delay to ensure tracking fires
                  setTimeout(function() {
                    window.location.href = '${target.replace(/'/g, "\\'")}';
                  }, 100);
                </script>
              </head>
              <body>
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, sans-serif;">
                  <div style="text-align: center;">
                    <h1 style="margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: bold;">Redirecting...</h1>
                    <p style="color: #666;">You will be redirected momentarily</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }
      }

      // If Google Analytics is not configured, use direct server-side redirect
      const target = redirectWithQuery ? withQuery(link.url, getQuery(event)) : link.url
      return sendRedirect(event, target, +useRuntimeConfig(event).redirectStatusCode)
    }
  }
})
