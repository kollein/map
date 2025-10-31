// @ts-ignore
import { spawn } from 'bun'
import { getKeywordsBySubclass } from '@/keywordMapping'

const keywords = getKeywordsBySubclass('cafe')
const province = 'bạc-liêu'

// Maximum number of processes running concurrently
const MAX_CONCURRENT = 10

// Function to spawn a single keyword process, returns a Promise
function spawnKeyword(keyword: string) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn({
      cmd: ['bun', './src/scrapeGoogleMaps.ts', keyword, province],
      stdout: 'inherit',
      stderr: 'inherit',
    })

    proc.exited.then((code: number) => {
      if (code === 0) {
        resolve()
        console.log('✅ Done')
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
      console.log('⚽ ~ runKeywords ~ keyword:', keyword)
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
      console.log('race done')

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
