import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";

// ===== CONFIG =====
const keyword = "quán ăn";
const start = { lat: 9.280557, lng: 105.7086667 };

// Bounding box tỉnh Bạc Liêu
const bounds = { minLat: 8.993, maxLat: 9.55, minLng: 105.35, maxLng: 105.88 };

// Output file (resume nếu file tồn tại)
const outputFile = path.resolve("./baclieu_quanan_grid_resume.json");

// Grid & crawl tuning
const STEP_METERS = 3000; // mỗi ô dịch chuyển ~500 m
const MAX_SCROLL_ITER = 10;
const SCROLL_DELAY_MIN = 1200;
const SCROLL_DELAY_VAR = 800;
const SAVE_EVERY = 2;
const ZOOM = 14;
const JITTER_DEG = 0.001;

// ===== STATE =====
const visited = new Set(); // chứa keys "lat,lng"
const results = [];
let browser;

// ===== UTILS =====
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const keyOf = (lat, lng) => `${lat.toFixed(5)},${lng.toFixed(5)}`;
const inBounds = (lat, lng) =>
  lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;

const degLatPerMeter = 1 / 111000;
const stepLatDeg = STEP_METERS * degLatPerMeter;
function stepLngDegAt(lat) {
  return STEP_METERS / (111000 * Math.cos((lat * Math.PI) / 180));
}

// safe save
async function safeSave() {
  await fs.writeJSON(outputFile, results, { spaces: 2 });
  console.log(`💾 Saved ${results.length} items -> ${outputFile}`);
}

// resume
async function loadResume() {
  if (await fs.pathExists(outputFile)) {
    try {
      const arr = await fs.readJSON(outputFile);
      if (Array.isArray(arr)) {
        arr.forEach((it) => {
          if (it && typeof it.lat === "number" && typeof it.lng === "number") {
            results.push(it);
            visited.add(keyOf(it.lat, it.lng));
          }
        });
        console.log(`🔁 Resume: loaded ${results.length} places`);
      }
    } catch (e) {
      console.warn("⚠ Could not parse existing output file, starting fresh.", e.message);
    }
  } else console.log("🆕 No existing output file — starting fresh.");
}

// scroll helper
async function scrollUntilStable(page) {
  const feedSelector = 'div[role="feed"]';
  let prevCount = 0;
  for (let i = 0; i < MAX_SCROLL_ITER; i++) {
    const count = await page.$$eval(".Nv2PK.THOPZb.CpccDe", (els) => els.length);
    if (count > prevCount) {
      prevCount = count;
      console.log(`  📜 loaded ${count} items (scroll iter ${i + 1})`);
      await page.evaluate((sel) => {
        const feed = document.querySelector(sel);
        if (feed) feed.scrollBy(0, feed.scrollHeight);
        else window.scrollBy(0, window.innerHeight);
      }, feedSelector);
      await sleep(SCROLL_DELAY_MIN + Math.random() * SCROLL_DELAY_VAR);
    } else break;
  }
  return prevCount;
}

// extract items
async function extractPlaces(page) {
  return await page.$$eval(".Nv2PK.THOPZb.CpccDe", (els) =>
    els
      .map((el) => {
        const name = el.querySelector(".qBF1Pd")?.textContent?.trim();
        const url = el.querySelector("a.hfpxzc")?.href || "";
        const m = url.match(/!3d([-.\d]+)!4d([-.\d]+)/);
        const lat = m ? parseFloat(m[1]) : null;
        const lng = m ? parseFloat(m[2]) : null;
        return name && lat && lng ? { name, lat, lng, url } : null;
      })
      .filter(Boolean)
  );
}

// crawl single cell
async function crawlCell(lat, lng) {
  const key = keyOf(lat, lng);
  if (visited.has(key)) return;
  visited.add(key);
  if (!inBounds(lat, lng)) return;

  const jitterLat = lat + (Math.random() * 2 - 1) * JITTER_DEG;
  const jitterLng = lng + (Math.random() * 2 - 1) * JITTER_DEG;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${jitterLat},${jitterLng},${ZOOM}z`;

  console.log(`🌍 Crawling ${keyword} @ ${jitterLat.toFixed(5)},${jitterLng.toFixed(5)}`);

  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);
    await scrollUntilStable(page);
    const places = await extractPlaces(page);

    let added = 0;
    for (const p of places) {
      const pKey = keyOf(p.lat, p.lng);
      if (!visited.has(pKey) && inBounds(p.lat, p.lng)) {
        visited.add(pKey);
        results.push(p);
        added++;
      }
    }

    console.log(`✅ Found ${places.length}, added ${added} new places.`);
    if (added > 0) await safeSave();
  } catch (e) {
    console.error(`❌ Error crawling ${lat},${lng}`, e.message);
  } finally {
    await page.close();
  }
}

// main loop: quét theo grid (lên/xuống/trái/phải)
async function crawlGrid() {
  console.log("🚀 Starting browser...");
  browser = await puppeteer.launch({ headless: true });

  const stepLat = stepLatDeg;
  let current = { ...start };
  let queue = [current];
  const directions = [
    { dx: 0, dy: stepLat, name: "⬆️ lên" },
    { dx: 0, dy: -stepLat, name: "⬇️ xuống" },
    { dx: stepLngDegAt(current.lat), dy: 0, name: "➡️ phải" },
    { dx: -stepLngDegAt(current.lat), dy: 0, name: "⬅️ trái" },
  ];

  while (queue.length > 0) {
    const { lat, lng } = queue.shift();
    if (!inBounds(lat, lng)) continue;

    await crawlCell(lat, lng);

    // thêm các ô lân cận
    for (const dir of directions) {
      const next = { lat: lat + dir.dy, lng: lng + dir.dx };
      if (!inBounds(next.lat, next.lng)) continue;
      const key = keyOf(next.lat, next.lng);
      if (!visited.has(key)) {
        console.log(`   ↳ Dịch chuyển ${dir.name} → (${next.lat.toFixed(5)}, ${next.lng.toFixed(5)})`);
        queue.push(next);
      }
    }
  }

  await safeSave();
  await browser.close();
  console.log("✅ Crawl completed!");
}

// ===== RUN =====
await loadResume();
await crawlGrid();
