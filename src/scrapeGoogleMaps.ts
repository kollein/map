import { getBoundingBoxByProvince } from '@/boundingBox'
import { getKeywordMapping } from '@/keywordMapping'
import { sendPlaceMessage } from '@/producer'
import { PlaceMessage } from '@/type'
import { removeVietnameseTones } from '@/utils'
import { PlaceClass, PlaceSubClass, Province } from '@prisma/client'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import puppeteer, { Browser } from 'puppeteer'

// ===== CONFIG =====
const keyword = process.argv[2]
const province = process.argv[3]
const subclass = process.argv[4]
const provinceLatin = removeVietnameseTones(province)
const folderPath = `./src/output/${provinceLatin}/${subclass}`
await fs.ensureDir(folderPath)

console.log(chalk.blue.bold('Keyword & Province:', keyword, province))
const start = { lat: 9.2818974, lng: 105.7197254 } // Tiem Banh Huynh Minh Thanh

// Bounding box tỉnh Bạc Liêu
const bounds = getBoundingBoxByProvince(provinceLatin)
if (!bounds) {
  throw new Error(`Bounding box not found for province: ${provinceLatin}`)
}

// Output files
// const outputFile = path.resolve(`${folderPath}/${keyword}.json`)
const stateFile = path.resolve(`${folderPath}/state_${keyword}.json`)

// Crawl parameters
const STEP_METERS = 3000
const MAX_SCROLL_ITER = 20
const MIN_SCROLL_ITER = 10
const SCROLL_DELAY_MIN = 1000
const SCROLL_DELAY_VAR = 400
const SAVE_THRESHOLD = 1
const ZOOM = 21
const JITTER_DEG = 0.001

// ===== STATE =====
const visited = new Set<string>()
let results: { name: string; lat: number; lng: number }[] = []
let lastDistance = 0
// ===== UTILS =====
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const keyOf = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`
const inBounds = (lat: number, lng: number) =>
  lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng

const degLatPerMeter = 1 / 111000
const stepLatDeg = STEP_METERS * degLatPerMeter
function stepLngDegAt(lat: number) {
  return STEP_METERS / (111000 * Math.cos((lat * Math.PI) / 180))
}

// ===== Distance Calculator =====
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ===== File Ops / Kafka =====
async function safeSave() {
  // Filter only required fields
  const filtered = results.map(({ name, lat, lng }) => ({ name, lat, lng }))

  // Send each item to Kafka
  for (const item of filtered) {
    try {
      const getKeywordMappingResult = getKeywordMapping(keyword)
      if (!getKeywordMappingResult) {
        console.warn(`⚠️ getKeywordMappingResult is null for keyword ${keyword}`)
        continue
      }

      const { rank } = getKeywordMappingResult
      const message: PlaceMessage = {
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        keyword,
        province: provinceLatin as Province,
        class: getKeywordMappingResult.class as PlaceClass,
        subclass: getKeywordMappingResult.subclass as PlaceSubClass,
        rank,
        requireCheck: false,
      }
      await sendPlaceMessage(message)
      console.log(chalk.bold.greenBright(`✈️ Send place ${item.name} to Kafka for keyword ${keyword}`))
    } catch (err) {
      console.error(`⚠️ Failed to send Kafka message for ${item.name}:`, err)
    }
  }
}

// async function loadResume() {
//   if (await fs.pathExists(outputFile)) {
//     const arr = await fs.readJSON(outputFile)
//     if (Array.isArray(arr)) {
//       results = arr
//       arr.forEach((it) => visited.add(keyOf(it.lat, it.lng)))
//       console.log(`🔁 Resume loaded ${arr.length} items for keyword ${keyword}`)
//     }
//   }
// }

async function saveState(state: any) {
  await fs.writeJSON(stateFile, state, { spaces: 2 })
  console.log(
    `🧭 Saved spiral state → step=${state.step}, moveCount=${state.moveCount}, direction=${state.direction} for keyword ${keyword}`
  )
}

async function loadState() {
  if (await fs.pathExists(stateFile)) {
    const s = await fs.readJSON(stateFile)
    console.log(`🔁 Resume spiral state for keyword ${keyword}:`, s)
    return s
  }
  return null
}

// ===== PAGE SCRAPER =====
async function getPageData(browser: Browser, keyword: string, lat: number, lng: number) {
  const jitterLat = lat + (Math.random() * 2 - 1) * JITTER_DEG
  const jitterLng = lng + (Math.random() * 2 - 1) * JITTER_DEG
  const searchKeyword = `${keyword}-${province}`
  const url = `https://www.google.com/maps/search/${encodeURIComponent(
    searchKeyword
  )}/@${jitterLat},${jitterLng},${ZOOM}z`
  console.log(`🌍 Crawling url: ${url}`)

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  await page.setExtraHTTPHeaders({
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  })

  console.log(`🌍 Crawling ${keyword} @ (${jitterLat.toFixed(5)}, ${jitterLng.toFixed(5)})`)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

  try {
    await page.waitForSelector('[aria-label^="Results for"]', { timeout: 20000 })
  } catch {
    console.log(`⚠️ No results found for keyword ${keyword}, skipping.`)
    await page.close()
    return []
  }

  // Scroll to load all results
  const feedSelector = 'div[role="feed"]'
  let prevCount = 0
  const scrollIterations = lastDistance < 10 ? MAX_SCROLL_ITER : MIN_SCROLL_ITER
  let queryClass = '.Nv2PK.THOPZb'
  for (let i = 0; i < scrollIterations; i++) {
    const try1 = await page.$$eval(queryClass, (els: any) => els.length)
    if (try1 === 0) queryClass = '.hfpxzc'
    const count = try1 === 0 ? try1 : await page.$$eval(queryClass, (els: any) => els.length)

    if (count > prevCount) {
      prevCount = count
      console.log(`  📜 loaded ${count} items (scroll ${i + 1}) for keyword ${keyword}`)
      await page.evaluate((sel) => {
        const feed = document.querySelector(sel)
        if (feed) feed.scrollBy(0, feed.scrollHeight)
        else window.scrollBy(0, window.innerHeight)
      }, feedSelector)
      await sleep(SCROLL_DELAY_MIN + Math.random() * SCROLL_DELAY_VAR)
    } else break
  }

  const items = await page.$$eval(queryClass, (nodes: any) => {
    return nodes
      .map((el: any) => {
        const a = el.querySelector('a')
        if (!a) return null
        const name = a.getAttribute('aria-label') || ''
        const href = a.getAttribute('href') || ''
        const match = href.match(/!3d([0-9.\-]+)!4d([0-9.\-]+)/)
        if (!match) return null
        return { name, lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
      })
      .filter(Boolean) as { name: string; lat: number; lng: number }[]
  })

  await page.close()
  return items
}

// ===== MAIN CRAWLER (SPIRAL) =====
async function crawlSpiral(browser: Browser) {
  const stepLng = stepLngDegAt(start.lat)
  let state = (await loadState()) || {
    lat: start.lat,
    lng: start.lng,
    direction: 0,
    step: 1,
    moveCount: 0,
  }

  while (true) {
    const { lat, lng, direction, step, moveCount } = state
    const key = keyOf(lat, lng)
    if (visited.has(key) || !inBounds(lat, lng)) {
      console.log(`⏭️ Skipping visited/out-of-bound for keyword ${keyword}:`, key)
      break
    }
    visited.add(key)

    const items = await getPageData(browser, keyword, lat, lng)
    let added = 0
    results = [] // Clear previous results to save memory
    for (const item of items) {
      const id = keyOf(item.lat, item.lng)
      if (!visited.has(id) && inBounds(item.lat, item.lng)) {
        results.push(item)
        visited.add(id)
        added++
      }
    }
    console.log(`✅ Found ${items.length} items for keyword ${keyword}, added ${added} new.`)
    if (added >= SAVE_THRESHOLD) await safeSave()

    // ===== Spiral direction logic =====
    let newMoveCount = moveCount + 1
    let newDirection = direction
    let newStep = step
    if (newMoveCount > newStep) {
      newMoveCount = 1
      newDirection = (direction + 1) % 4
      if (newDirection === 0 || newDirection === 2) newStep++
    }

    let nextLat = lat
    let nextLng = lng
    switch (newDirection) {
      case 0:
        nextLng += stepLng
        break
      case 1:
        nextLat -= stepLatDeg
        break
      case 2:
        nextLng -= stepLng
        break
      case 3:
        nextLat += stepLatDeg
        break
    }

    lastDistance = haversine(start.lat, start.lng, nextLat, nextLng)
    const dirEmoji = ['➡️', '⬇️', '⬅️', '⬆️'][newDirection]
    console.log(
      `↪️ Move ${dirEmoji} (${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}) for keyword ${keyword} ~`,
      chalk.bgHex('#22ff00ff').bold.white(`${lastDistance.toFixed(2)} km from center`)
    )

    // Save new state
    state = { lat: nextLat, lng: nextLng, direction: newDirection, step: newStep, moveCount: newMoveCount }
    await saveState(state)

    if (!inBounds(nextLat, nextLng)) {
      console.log(`🛑 Reached boundary, stopping spiral crawl for keyword ${keyword}.`)
      break
    }
  }
}

// ===== MAIN =====
;(async () => {
  // await loadResume()

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    await crawlSpiral(browser)
  } catch (err) {
    console.error('❌ Error:', err)
  } finally {
    await browser.close()
    console.log('👋 Browser closed, exiting.')
    process.exit(0)
  }
})()
