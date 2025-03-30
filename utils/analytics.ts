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

  const isDevMode = process.env.NODE_ENV !== 'production'

  // Push to dataLayer first (for GTM)
  try {
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: eventName,
        ...params,
      })

      if (isDevMode) {
        console.log(`Analytics event sent to dataLayer: ${eventName}`, params)
      }

      // If we have dataLayer, that's sufficient for tracking
      return
    }
    else if (isDevMode) {
      console.warn('dataLayer not initialized')
    }
  }
  catch (dataLayerError) {
    console.error('Failed to push to dataLayer:', dataLayerError)
  }

  // Fallback to direct gtag if available
  try {
    const gtag = (window as any).gtag

    if (typeof gtag === 'function') {
      gtag('event', eventName, params)

      if (isDevMode) {
        console.log(`Analytics event sent via gtag: ${eventName}`, params)
      }
      return
    }
    else if (isDevMode) {
      console.warn('Google Analytics (gtag) not initialized')
    }
  }
  catch (gtagError) {
    console.error('Failed to send event via gtag:', gtagError)
  }

  // Final fallback - log that tracking failed
  if (isDevMode) {
    console.warn(`Unable to track event: ${eventName} - No analytics handlers available`)
  }
}

/**
 * Get environment variable configurations for analytics
 * This helps ensure consistent configuration access across components
 */
export function getAnalyticsConfig() {
  // For client-side use to get public runtime config
  if (typeof window !== 'undefined') {
    try {
      const config = useRuntimeConfig()
      // Make sure config and config.public exist before accessing properties
      if (config && config.public) {
        return {
          measurementId: config.public.gaMeasurementId || '',
          googleTagManagerId: config.public.googleTagManagerId || '',
          isDomainConfigured: !!config.public.domainName && config.public.domainName !== 'localhost:3000',
        }
      }
    }
    catch (error) {
      console.error('Failed to get analytics config:', error)
    }
  }
  // Return empty config if unable to access runtime config
  return {
    measurementId: '',
    googleTagManagerId: '',
    isDomainConfigured: false,
  }
}

/**
 * Track a page view
 * @param path The page path to track
 * @param title The page title
 */
export function trackPageView(path?: string, title?: string) {
  trackEvent('page_view', {
    page_path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
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
  return !!(config.measurementId || config.googleTagManagerId)
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
    destination: typeof window !== 'undefined' ? window.location.href : '',
    domain: typeof window !== 'undefined' ? window.location.hostname : '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    timestamp: new Date().toISOString(),
  })
}

// Add TypeScript support for the dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
