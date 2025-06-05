/**
 * Authentication utilities for site token management
 */

// Local storage key for the site token
const SITE_TOKEN_KEY = 'sink_site_token'

/**
 * Store the site token in local storage
 * @param token Site token to store
 */
export function storeSiteToken(token: string): void {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem(SITE_TOKEN_KEY, token)
  }
}

/**
 * Get the site token from local storage
 * @returns The stored site token or null if not found
 */
export function getSiteToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SITE_TOKEN_KEY)
  }
  return null
}

/**
 * Remove the site token from local storage
 */
export function clearSiteToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SITE_TOKEN_KEY)
  }
}

/**
 * Check if a site token exists in local storage
 * @returns Whether a site token exists
 */
export function hasSiteToken(): boolean {
  return !!getSiteToken()
}

/**
 * Validate the stored token against the expected value
 * @param expectedToken The expected token value (optional)
 * @returns True if the stored token matches the expected token
 */
export function isValidToken(expectedToken?: string): boolean {
  const token = getSiteToken()
  if (!token)
    return false

  // If an expected token is provided, validate against it
  if (expectedToken) {
    return token === expectedToken
  }

  // Otherwise just check that the token exists and has a minimum length
  return token.length >= 8
}
