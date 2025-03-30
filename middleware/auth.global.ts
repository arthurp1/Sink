import { getSiteToken, hasSiteToken } from '~/utils/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server)
    return

  if (to.path.startsWith('/dashboard') && to.path !== '/dashboard/login') {
    if (!hasSiteToken()) {
      const legacyToken = window.localStorage.getItem('SinkSiteToken')

      if (!legacyToken) {
        return navigateTo('/dashboard/login')
      }
    }
  }

  if (to.path === '/dashboard/login') {
    try {
      const token = getSiteToken() || window.localStorage.getItem('SinkSiteToken')

      if (token) {
        await useAPI('/api/verify')
        return navigateTo('/dashboard')
      }
    }
    catch (e) {
      console.warn('Auth verification failed:', e)
    }
  }

  // Skip root route handling since we're handling it directly in the page component
  // to avoid runtimeConfig errors and ensure direct redirection to aibuilders.club
  /*
  if (to.path === '/') {
    try {
      const token = getSiteToken() || window.localStorage.getItem('SinkSiteToken')

      if (token) {
        await useAPI('/api/verify')
        return navigateTo('/dashboard/links')
      }

      return navigateTo('/dashboard/login')
    } catch (e) {
      console.warn('Auth verification failed:', e)
      return navigateTo('/dashboard/login')
    }
  }
  */
})
