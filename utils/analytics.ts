/**
 * Analytics utility functions
 * These functions help with tracking events and managing analytics configuration
 */

// Analytics event types
export interface AnalyticsEventParams {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Track an event with Google Analytics
 * This function sends an event to GA4 using the Measurement Protocol
 *
 * @param eventName The name of the event to track
 * @param params Additional parameters for the event
 */
export function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  // Only run in browser
  if (typeof window === 'undefined')
    return

  // Get the Google Analytics object
  const gtag = (window as any).gtag

  // Also support dataLayer for legacy GTM implementation
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    })
  }

  if (!gtag) {
    console.warn('Google Analytics not initialized')
    return
  }

  try {
    gtag('event', eventName, params)

    // Log in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Analytics event sent: ${eventName}`, params)
    }
  }
  catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Get environment variable configurations for analytics
 * This helps ensure consistent configuration access across components
 */
export function getAnalyticsConfig() {
  // For client-side use to get public runtime config
  if (typeof window !== 'undefined') {
    const config = useRuntimeConfig()
    return {
      measurementId: config.public.gaMeasurementId,
      isDomainConfigured: !!config.public.domainName && config.public.domainName !== 'localhost:3000',
    }
  }
  // Server-side will get full config with API secret
  return {}
}

/**
 * Track a page view
 * @param path The page path to track
 * @param title The page title
 */
export function trackPageView(path?: string, title?: string) {
  trackEvent('page_view', {
    page_path: path || window.location.pathname,
    page_title: title || document.title,
  })
}

/**
 * Track a link click
 * @param url The URL that was clicked
 * @param text The link text
 * @param isExternal Whether the link is external
 */
export function trackLinkClick(url: string, text: string, isExternal: boolean = false) {
  trackEvent('link_click', {
    url,
    link_text: text,
    is_external: isExternal,
  })
}

/**
 * Check if analytics is properly configured
 * @returns Whether GA is configured
 */
export function isAnalyticsConfigured(): boolean {
  const config = getAnalyticsConfig()
  return !!config.measurementId
}

/**
 * Track a link redirect in Google Analytics
 * Uses the built-in page_view event with the slug as the path
 * @param slug The slug that was accessed
 */
export function trackRedirect(slug: string) {
  // Track the standard page_view event for backward compatibility
  trackEvent('page_view', {
    page_title: `Redirect: ${slug}`,
    page_path: `/${slug}`,
  })

  // Track the custom 'redirect' event with additional info
  trackEvent('redirect', {
    slug,
    destination: window.location.href,
    domain: window.location.hostname,
    referrer: document.referrer || '',
  })
}

// Add TypeScript support for the dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
