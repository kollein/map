import { getAllSubclasses, getKeywordsBySubclass } from '@/keywordMapping'
import { Province } from '@prisma/client'
// @ts-ignore
import { spawn } from 'bun'
import { getProvinceVietnameseName } from './utils'

console.log(`🚀 Starting with subclass:${process.argv[2]} and province:${process.argv[3]}`)
const subclass = process.argv[2]
const province = process.argv[3]

if (!subclass || !province) {
  console.error('Usage: npm run start:crawler <subclass> <province>')
  const subclasses = Object.values(getAllSubclasses()).join(', ')
  const provinces = Object.keys(Province)
    .map((p) => getProvinceVietnameseName(p)?.provinceNoSpaces)
    .join(', ')
  console.info('List of subclasses:\n', subclasses)
  console.info('List of provinces:\n', provinces)
  process.exit(1)
}

const keywords = getKeywordsBySubclass(subclass)

// Maximum number of processes running concurrently
const MAX_CONCURRENT = 10

// Function to spawn a single keyword process, returns a Promise
function spawnKeyword(keyword: string) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn({
      cmd: ['bun', './src/scrapeGoogleMaps.ts', keyword, province, subclass],
      stdout: 'inherit',
      stderr: 'inherit',
    })

    proc.exited.then((code: number) => {
      if (code === 0) {
        resolve()
        console.log('✅ Done:', keyword)
      } else {
        console.error('❌ Error with exit code', code)
        reject(new Error(`Exit code ${code}`))
      }
    })
  })
}

// Function to run multiple keywords with concurrency limit
async function runKeywords(keywords: string[]) {
  const queue = [...keywords] // copy the keywords array
  const active: Promise<void>[] = []

  while (queue.length > 0 || active.length > 0) {
    // Start new tasks while below max concurrency
    while (queue.length > 0 && active.length < MAX_CONCURRENT) {
      const k = queue.shift()!
      const keyword = k.trim().toLowerCase().replace(/( +)/gi, '-')
      const p = spawnKeyword(keyword)
      active.push(p)

      // Remove from active array when done
      p.finally(() => {
        const index = active.indexOf(p)
        if (index >= 0) active.splice(index, 1)
      })
    }

    // Wait for at least one process to finish before continuing
    if (active.length > 0) {
      await Promise.race(active)
    }
  }
}

// Run the keywords
runKeywords(keywords)
  .then(() => {
    console.log('All keywords processed!')
  })
  .catch((err) => {
    console.error('Error processing keywords:', err.message)
  })
