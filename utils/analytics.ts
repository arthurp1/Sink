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

// Add TypeScript support for the dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
