import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const RedirectDataSchema = z.array(z.object({
  landingPage: z.string(),
  sessionSource: z.string(),
  country: z.string(),
  totalUsers: z.string().transform(Number),
  sessions: z.string().transform(Number),
  eventCount: z.string().transform(Number),
}))

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '../../data')
const filePath = join(dataDir, 'redirect_counts.json')

function ensureDataDirExists() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}

function readRedirectCounts() {
  ensureDataDirExists()
  if (existsSync(filePath)) {
    const data = readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  }
  return []
}

function writeRedirectCounts(data: any) {
  ensureDataDirExists()
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export default defineEventHandler(async (event) => {
  // For simplicity, no authentication is added here initially for n8n to post data.
  // In a production environment, you would add authentication/authorization.

  try {
    const body = await readBody(event)
    const validatedData = RedirectDataSchema.parse(body)

    const currentCounts = readRedirectCounts()
    const updatedCounts = [...currentCounts]

    validatedData.forEach((newData) => {
      const existingIndex = updatedCounts.findIndex(item => item.landingPage === newData.landingPage)
      if (existingIndex > -1) {
        // Aggregate eventCount for existing landingPage
        updatedCounts[existingIndex].eventCount += newData.eventCount
        // You might want to update other fields like totalUsers, sessions based on your needs
      }
      else {
        updatedCounts.push(newData)
      }
    })

    writeRedirectCounts(updatedCounts)

    return { status: 'success', message: 'Redirect counts updated successfully' }
  }
  catch (error) {
    console.error('Error processing redirect data:', error)
    throw createError({
      statusCode: 400,
      message: 'Invalid data format or processing error',
    })
  }
})
