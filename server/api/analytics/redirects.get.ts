import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

export default defineEventHandler(async () => {
  try {
    const redirectCounts = readRedirectCounts()
    return { data: redirectCounts, timestamp: new Date().toISOString() }
  }
  catch (error) {
    console.error('Error reading redirect counts:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve redirect counts',
    })
  }
})
