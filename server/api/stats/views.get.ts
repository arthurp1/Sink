import type { H3Event } from 'h3'
import { z } from 'zod'

// Base schema for query validation
const QuerySchema = z.object({
  startAt: z.string().or(z.number()).optional(),
  endAt: z.string().or(z.number()).optional(),
  limit: z.number().default(100),
});

// Schema specific to views endpoint
const ViewsQuerySchema = QuerySchema.extend({
  unit: z.string(),
  clientTimezone: z.string().default('Etc/UTC'),
});

// Mock data for view statistics
function generateMockViewData(query: z.infer<typeof ViewsQuerySchema>): any[] {
  const { unit } = query;
  const results = [];
  const now = new Date();

  // Generate data for the last 7 days or 24 hours depending on the unit
  const dataPoints = unit === 'hour' ? 24 : 7;

  for (let i = 0; i < dataPoints; i++) {
    const date = new Date(now);
    if (unit === 'hour') {
      date.setHours(date.getHours() - (dataPoints - i - 1));
      results.push({
        time: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}`,
        visits: Math.floor(Math.random() * 50) + 10,
        visitors: Math.floor(Math.random() * 30) + 5
      });
    } else {
      date.setDate(date.getDate() - (dataPoints - i - 1));
      results.push({
        time: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
        visits: Math.floor(Math.random() * 200) + 50,
        visitors: Math.floor(Math.random() * 100) + 20
      });
    }
  }

  return results;
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
    const query = getQuery(event);
    const validated = ViewsQuerySchema.parse(query);

    // Generate and return mock data
    return generateMockViewData(validated);
  } catch (error) {
    console.error('Error in views endpoint:', error);
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
    });
  }
})
