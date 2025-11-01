import { Client } from '@elastic/elasticsearch'
import { getPlaceIndexByProvince } from '@/search/shared'

const client = new Client({ node: 'http://localhost:9200' })

interface Place {
  id: string
  name: string
  address: string
  province: string
  category?: string
  tags?: string[]
  location?: {
    lat: number
    lon: number
  }
}

export async function bulkUpsertPlaces(province: string, places: Place[]) {
  const indexName = getPlaceIndexByProvince(province)

  const body = places.flatMap((place) => [
    { update: { _index: indexName, _id: place.id } },
    { doc: place, doc_as_upsert: true },
  ])

  try {
    const response = await client.bulk({ refresh: true, body })

    if (response.errors) {
      const erroredDocuments = response.items
        .filter((item: any) => item.update && item.update.error)
        .map((item: any) => ({
          id: item.update._id,
          error: item.update.error,
        }))
      console.error('❌ Bulk upsert errors:', erroredDocuments)
    } else {
      console.log(`✅ Upserted ${places.length} documents into ${indexName}`)
    }
  } catch (error) {
    console.error('❌ Bulk upsert failed:', error)
  }
}

// === Example ===
const samplePlaces: Place[] = [
  {
    id: '1',
    name: 'Quán Cà Phê Hương Biển',
    address: '123 Lê Duẩn, Phường 3',
    province: 'baclieu',
    category: 'cafe',
    tags: ['coffee', 'beach'],
    location: { lat: 9.2845, lon: 105.7242 },
  },
  {
    id: '2',
    name: 'Nhà Hàng Biển Xanh',
    address: '45 Trần Phú',
    province: 'baclieu',
    category: 'restaurant',
    tags: ['seafood', 'family'],
    location: { lat: 9.2859, lon: 105.7273 },
  },
  {
    id: '3',
    name: 'Nhà Hàng Biển Xanh',
    address: '45 Trần Phú',
    province: 'baclieu',
    category: 'restaurant',
    tags: ['seafood', 'family', 'vip-room'],
    location: { lat: 9.2859, lon: 105.7273 },
  },
  {
    id: '4',
    name: 'Nhà Hàng Biển Xanh',
    address: '45 Trần Phú',
    province: 'camau',
    category: 'restaurant',
    tags: ['seafood', 'family'],
    location: { lat: 9.2859, lon: 105.7273 },
  },
]

bulkUpsertPlaces('baclieu', samplePlaces)
