// Analytics utility functions

/**
 * Track a page view in Google Analytics
 * @param pageTitle The title of the page
 * @param pagePath The path of the page
 */
export const trackPageView = (pageTitle: string, pagePath: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_title: pageTitle,
      page_path: pagePath,
    })
  }
}

/**
 * Track a custom event in Google Analytics
 * @param eventName The name of the event
 * @param eventParams Additional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    })
  }
}

/**
 * Track a link redirect in Google Analytics
 * Uses the built-in page_view event with the slug as the path
 * @param slug The slug that was accessed
 */
export const trackRedirect = (slug: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_title: `Redirect: ${slug}`,
      page_path: `/${slug}`,
    })
  }
}

/**
 * Helper function for future Google Analytics API integration
 * This provides a consistent format for querying GA data for a specific slug
 * @param slug The slug to get analytics for
 * @returns An object with the slug path formatted for Google Analytics
 */
export const getGASlugFilter = (slug: string) => {
  return {
    pagePath: `/${slug}`,
    dimensionFilter: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          matchType: 'EXACT',
          value: `/${slug}`,
        },
      },
    },
  }
}

// Add TypeScript support for the dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
