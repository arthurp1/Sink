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
export async function fetchSlugEventCount(slug: string) {
  try {
    // Make a request to our server-side API that will fetch from GA4
    const response = await fetch(`/api/analytics/slug-data?slug=${encodeURIComponent(slug)}`)

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    return await response.json()
  }
  catch (error: any) {
    console.error('Error fetching GA data:', error)
    return { error: (error as Error).message }
  }
}

/**
 * Verify GA4 configuration
 * This function tests whether the GA4 integration is working correctly
 *
 * @returns Configuration status
 */
export async function verifyGAConfig() {
  try {
    const response = await fetch('/api/analytics/verify')
    return await response.json()
  }
  catch (error: any) {
    console.error('Error verifying GA config:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Format for GA4 slug tracking filter
 * This utility creates the proper filter format for GA4 API queries
 *
 * @param slug The slug to filter events by
 * @returns GA4 filter object
 */
export function getGASlugFilter(slug: string) {
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

/**
 * Fetch redirect event counts
 *
 * This is a simple wrapper around our server-side API that serves aggregated redirect counts.
 *
 * @returns The aggregated redirect counts data
 */
export async function fetchRedirectCounts() {
  try {
    const response = await fetch('/api/analytics/redirects')

    if (!response.ok) {
      throw new Error('Failed to fetch redirect counts')
    }

    return await response.json()
  }
  catch (error: any) {
    console.error('Error fetching redirect counts:', error)
    return { error: (error as Error).message }
  }
}
