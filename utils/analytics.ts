/**
 * Analytics utility functions
 * These functions help with tracking events and managing analytics configuration
 */

// Analytics event types
export type AnalyticsEventParams = {
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Track an event with Google Analytics
 * This function sends an event to GA4 using the Measurement Protocol
 *
 * @param eventName The name of the event to track
 * @param params Additional parameters for the event
 */
export const trackEvent = (eventName: string, params: AnalyticsEventParams = {}) => {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Get the Google Analytics object
  const gtag = (window as any).gtag;

  if (!gtag) {
    console.warn('Google Analytics not initialized');
    return;
  }

  try {
    gtag('event', eventName, params);

    // Log in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Analytics event sent: ${eventName}`, params);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

/**
 * Get environment variable configurations for analytics
 * This helps ensure consistent configuration access across components
 */
export const getAnalyticsConfig = () => {
  // For client-side use to get public runtime config
  if (typeof window !== 'undefined') {
    const config = useRuntimeConfig();
    return {
      measurementId: config.public.gaMeasurementId,
      isDomainConfigured: !!config.public.domainName && config.public.domainName !== 'localhost:3000',
    };
  }
  // Server-side will get full config with API secret
  return {};
};

/**
 * Track a page view
 * @param path The page path to track
 * @param title The page title
 */
export const trackPageView = (path?: string, title?: string) => {
  trackEvent('page_view', {
    page_path: path || window.location.pathname,
    page_title: title || document.title,
  });
};

/**
 * Track a link click
 * @param url The URL that was clicked
 * @param text The link text
 * @param isExternal Whether the link is external
 */
export const trackLinkClick = (url: string, text: string, isExternal: boolean = false) => {
  trackEvent('link_click', {
    url,
    link_text: text,
    is_external: isExternal,
  });
};

/**
 * Check if analytics is properly configured
 * @returns Whether GA is configured
 */
export const isAnalyticsConfigured = (): boolean => {
  const config = getAnalyticsConfig();
  return !!config.measurementId;
};

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
