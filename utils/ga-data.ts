/**
 * GA4 Data API utilities
 *
 * These functions help fetch analytics data from Google Analytics 4
 * using the Data API and the Measurement Protocol
 */

/**
 * Fetch event count for a specific slug
 * This is a simple wrapper around the GA4 API for demonstration purposes
 *
 * @param slug The slug to get data for
 * @returns The event count data
 */
export const fetchSlugEventCount = async (slug: string) => {
  try {
    // Make a request to our server-side API that will fetch from GA4
    const response = await fetch(`/api/analytics/slug-data?slug=${encodeURIComponent(slug)}`)

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching GA data:', error)
    return { error: error.message }
  }
}

/**
 * Verify GA4 configuration
 * This function tests whether the GA4 integration is working correctly
 *
 * @returns Configuration status
 */
export const verifyGAConfig = async () => {
  try {
    const response = await fetch('/api/analytics/verify')
    return await response.json()
  } catch (error) {
    console.error('Error verifying GA config:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Format for GA4 slug tracking filter
 * This utility creates the proper filter format for GA4 API queries
 *
 * @param slug The slug to filter events by
 * @returns GA4 filter object
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
