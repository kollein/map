import { PrismaClient, Province } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

const PROVINCE = Province.baclieu

async function exportPlacesToGeoJSON() {
  // 1️⃣ Lấy dữ liệu từ Prisma
  const places = await prisma.place.findMany({ where: { province: PROVINCE } })

  // 2️⃣ Tạo cấu trúc GeoJSON
  const geojson = {
    type: 'FeatureCollection',
    features: places.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat],
      },
      properties: {
        id: p.id,
        name: p.name,
        rank: p.rank,
        class: p.class,
        subclass: p.subclass,
        province: p.province,
      },
    })),
  }

  // 3️⃣ Ghi ra file
  fs.writeFileSync(`places_${PROVINCE}.geojson`, JSON.stringify(geojson, null, 2))
  console.log(`✅ Exported ${places.length} places → places.geojson`)
}

exportPlacesToGeoJSON()
  .catch((err) => {
    console.error('❌ Error exporting:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
