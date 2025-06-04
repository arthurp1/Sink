import { blobsMap } from '@/server/utils/access-log'
import QRCodeStyling from 'qr-code-styling'
import { z } from 'zod'

export default eventHandler(async (event) => {
  // Check authentication
  const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
  const { siteToken } = useRuntimeConfig(event)

  if (!token || token !== siteToken) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  const { slug } = await getValidatedQuery(event, z.object({
    slug: z.string().trim().max(1024),
  }).parse)

  const { caseSensitive } = useRuntimeConfig(event)

  // Check if the slug exists in KV
  const { cloudflare } = event.context
  const { KV } = cloudflare.env

  const slugKey = !caseSensitive ? slug.toLowerCase() : slug
  const link = await KV.get(`link:${slugKey}`, { type: 'json' })

  if (!link) {
    throw createError({
      status: 404,
      statusText: 'Link not found',
    })
  }

  // Get metrics for the link
  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const shortLink = `${protocol}://${host}/${slugKey}`

  // Get favicon
  const faviconUrl = '/icon-192.png' // Use the AI Builders favicon

  // Generate QR code image (base64 encoded)
  let qrCodeImage = null

  try {
    // We want to keep this QR generation logic similar to the frontend QRCode.vue component
    const qrCode = new QRCodeStyling({
      width: 384, // Increased by 1.5x
      height: 384, // Increased by 1.5x
      data: shortLink,
      margin: 10,
      qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'Q' },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 2 },
      dotsOptions: { type: 'dots', color: '#000000' },
      backgroundOptions: { color: 'transparent' },
      image: faviconUrl,
      cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
      cornersDotOptions: { type: 'dot', color: '#000000' },
    })

    const qrDataUrl = await qrCode.getDataUrl()
    qrCodeImage = qrDataUrl
  }
  catch (error: any) {
    console.error('Failed to generate QR code:', error)
  }

  // Get analytics data
  let analytics = {}

  try {
    if (process.env.NODE_ENV === 'production' && link.id) {
      const { cfAccountId, cfApiToken } = useRuntimeConfig(event)

      // Only attempt to fetch analytics if Cloudflare credentials are set
      if (cfAccountId && cfApiToken) {
        const { dataset } = useRuntimeConfig(event)
        const query = `
          SELECT blob1, blob2, blob3, blob4, blob5, blob6, blob7, blob8, blob9, blob10, blob11, blob12, blob13, blob14, blob15, COUNT(*) as count
          FROM ${dataset}
          WHERE index1 = '${link.id}'
          GROUP BY blob1, blob2, blob3, blob4, blob5, blob6, blob7, blob8, blob9, blob10, blob11, blob12, blob13, blob14, blob15
          ORDER BY count DESC
          LIMIT 100
        `

        const result = await useWAE(event, query)

        if (result && Array.isArray(result)) {
          analytics = {
            totalHits: result.reduce((sum, row) => sum + row.count, 0),
            detailedData: result.map((row) => {
              // Convert blob data to readable analytics
              const logData = {}
              Object.keys(blobsMap).forEach((key) => {
                if (row[key] !== undefined) {
                  const fieldName = blobsMap[key]
                  logData[fieldName] = row[key]
                }
              })
              return {
                ...logData,
                count: row.count,
              }
            }),
          }
        }
      }
      else {
        // Return placeholder analytics if Cloudflare credentials are not set
        analytics = {
          totalHits: 0,
          message: 'Analytics not available. Cloudflare credentials not configured.',
        }
      }
    }
    else {
      // In development mode, return placeholder analytics
      analytics = {
        totalHits: Math.floor(Math.random() * 1000),
        detailedData: [
          { os: 'Windows', count: Math.floor(Math.random() * 500) },
          { os: 'macOS', count: Math.floor(Math.random() * 300) },
          { os: 'iOS', count: Math.floor(Math.random() * 200) },
          { os: 'Android', count: Math.floor(Math.random() * 100) },
        ],
      }
    }
  }
  catch (error) {
    console.error('Failed to fetch analytics:', error)
    analytics = {
      error: 'Failed to fetch analytics data',
      message: error.message,
    }
  }

  return {
    link,
    shortLink,
    faviconUrl,
    qrCodeImage,
    analytics,
  }
})
