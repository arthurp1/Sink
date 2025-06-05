import { defu } from 'defu'
import { toast } from 'vue-sonner'
import { clearSiteToken, getSiteToken } from '~/utils/auth'

/**
 * API utility function for making authenticated requests
 * @param api API endpoint path
 * @param options Fetch options
 * @returns Promise with API response
 */
export function useAPI(api: string, options?: object): Promise<unknown> {
  // Get token from our auth utility with fallback to localStorage for backward compatibility
  const token = getSiteToken() || localStorage.getItem('SinkSiteToken') || ''

  // Make API request with authentication header
  return $fetch(api, defu(options || {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })).catch((error) => {
    // Handle authentication errors
    if (error?.status === 401) {
      // Clear token from both storage locations
      clearSiteToken()
      localStorage.removeItem('SinkSiteToken')

      // Redirect to login page
      navigateTo('/dashboard/login')
    }

    // Show error toast for meaningful errors
    if (error?.data?.statusMessage) {
      toast.error(error?.data?.statusMessage)
    }
    else if (error?.data?.message) {
      toast.error(error?.data?.message)
    }

    // Reject the promise to allow proper error handling
    return Promise.reject(error)
  })
}
