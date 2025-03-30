import type { H3Event } from 'h3'
import { z } from 'zod'

// Base schema for query validation
const QuerySchema = z.object({
  startAt: z.string().or(z.number()).optional(),
  endAt: z.string().or(z.number()).optional(),
  limit: z.number().default(100),
});

// Schema specific to metrics endpoint
const MetricsQuerySchema = QuerySchema.extend({
  type: z.string(),
});

// Mock data for different metric types
function generateMockMetricsData(type: string): any[] {
  switch (type) {
    case 'os':
      return [
        { name: 'Windows', count: Math.floor(Math.random() * 200) + 100 },
        { name: 'Mac OS', count: Math.floor(Math.random() * 180) + 80 },
        { name: 'iOS', count: Math.floor(Math.random() * 150) + 50 },
        { name: 'Android', count: Math.floor(Math.random() * 120) + 40 },
        { name: 'Linux', count: Math.floor(Math.random() * 50) + 20 },
        { name: 'Other', count: Math.floor(Math.random() * 30) + 10 },
      ];

    case 'device':
      return [
        { name: 'Desktop', count: Math.floor(Math.random() * 300) + 200 },
        { name: 'Mobile', count: Math.floor(Math.random() * 250) + 150 },
        { name: 'Tablet', count: Math.floor(Math.random() * 100) + 50 },
        { name: 'Other', count: Math.floor(Math.random() * 30) + 10 },
      ];

    case 'referer':
      return [
        { name: 'Direct', count: Math.floor(Math.random() * 200) + 100 },
        { name: 'Google', count: Math.floor(Math.random() * 150) + 80 },
        { name: 'Twitter', count: Math.floor(Math.random() * 100) + 50 },
        { name: 'Facebook', count: Math.floor(Math.random() * 80) + 40 },
        { name: 'LinkedIn', count: Math.floor(Math.random() * 60) + 30 },
        { name: 'GitHub', count: Math.floor(Math.random() * 40) + 20 },
      ];

    case 'language':
      return [
        { name: 'en-US', count: Math.floor(Math.random() * 250) + 150 },
        { name: 'en-GB', count: Math.floor(Math.random() * 100) + 50 },
        { name: 'fr-FR', count: Math.floor(Math.random() * 80) + 40 },
        { name: 'de-DE', count: Math.floor(Math.random() * 70) + 30 },
        { name: 'es-ES', count: Math.floor(Math.random() * 60) + 20 },
        { name: 'zh-CN', count: Math.floor(Math.random() * 50) + 10 },
      ];

    case 'country':
      return [
        { name: 'United States', count: Math.floor(Math.random() * 200) + 100 },
        { name: 'United Kingdom', count: Math.floor(Math.random() * 120) + 60 },
        { name: 'Germany', count: Math.floor(Math.random() * 100) + 50 },
        { name: 'France', count: Math.floor(Math.random() * 80) + 40 },
        { name: 'Canada', count: Math.floor(Math.random() * 70) + 35 },
        { name: 'Australia', count: Math.floor(Math.random() * 60) + 30 },
        { name: 'Netherlands', count: Math.floor(Math.random() * 50) + 25 },
        { name: 'China', count: Math.floor(Math.random() * 40) + 20 },
      ];

    default:
      return [
        { name: 'Category 1', count: Math.floor(Math.random() * 200) + 100 },
        { name: 'Category 2', count: Math.floor(Math.random() * 150) + 75 },
        { name: 'Category 3', count: Math.floor(Math.random() * 100) + 50 },
        { name: 'Other', count: Math.floor(Math.random() * 50) + 25 },
      ];
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
    const query = getQuery(event);
    const validated = MetricsQuerySchema.parse(query);

    // Generate and return mock data
    return generateMockMetricsData(validated.type);
  } catch (error) {
    console.error('Error in metrics endpoint:', error);
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
    });
  }
})
