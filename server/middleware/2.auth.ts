export default eventHandler((event) => {
  // Get token from Authorization header
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
  const config = useRuntimeConfig(event)

  // Check if this is an API route that requires authentication
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/_')) {
    // Validate token
    if (!token) {
      throw createError({
        status: 401,
        statusText: 'Unauthorized',
        message: 'Authentication token is required',
      })
    }

    // Check token length
    if (token.length < 8) {
      throw createError({
        status: 401,
        statusText: 'Invalid Token',
        message: 'Token is too short, must be at least 8 characters',
      })
    }

    // Verify token matches the configured site token
    if (token !== config.siteToken) {
      throw createError({
        status: 401,
        statusText: 'Unauthorized',
        message: 'Invalid authentication token',
      })
    }
  }
})
