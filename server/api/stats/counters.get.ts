import { z } from 'zod'

// Base schema for query validation
const QuerySchema = z.object({
  startAt: z.string().or(z.number()).optional(),
  endAt: z.string().or(z.number()).optional(),
  limit: z.number().default(100),
})

// Generate mock counter data
function generateMockCounterData(): any {
  return {
    visits: Math.floor(Math.random() * 1000) + 500,
    visitors: Math.floor(Math.random() * 500) + 250,
    referers: Math.floor(Math.random() * 100) + 30,
  }
}

export default defineEventHandler(async (event) => {
  // Ensure the request is authenticated
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
  const config = useRuntimeConfig(event)

  if (!token || token !== config.siteToken) {
    throw createError({
      statusCode: 403,
      message: 'Unauthorized access to statistics',
    })
  }

  try {
    // Parse and validate the query parameters
    const query = getQuery(event)
    const _validated = QuerySchema.parse(query)

    // Generate and return mock data
    return generateMockCounterData()
  }
  catch (error) {
    console.error('Error in counters endpoint:', error)
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
    })
  }
})
