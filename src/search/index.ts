import { Client } from '@elastic/elasticsearch'
import { getPlaceIndexByProvince, highlightTextAdvanced } from '@/search/shared'

const client = new Client({ node: 'http://localhost:9200' })

export async function searchPlacesByProvince(province: string, query: string) {
  const indexName = getPlaceIndexByProvince(province)

  const result = await client.search({
    index: indexName,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['name^3', 'address'],
            },
          },
          { term: { province } },
        ],
        should: [{ term: { tags: 'vip-room' } }],
      },
    },
    size: 5,
  })

  // 🔧 Định dạng dữ liệu trả về
  return result.hits.hits.map((hit: any) => ({
    id: hit._id,
    score: hit._score,
    name: highlightTextAdvanced(hit._source?.name, query),
    address: highlightTextAdvanced(hit._source?.address, query),
    province: hit._source?.province,
    category: hit._source?.category,
    tags: hit._source?.tags,
    location: hit._source?.location,
  }))
}

searchPlacesByProvince('baclieu', 'hang bien 45 tran')
  .then((results) => console.log(JSON.stringify(results, null, 2)))
  .catch(console.error)

async function analyzeField(indexName: string, field: string, text: string) {
  const response = await client.indices.analyze({
    index: indexName,
    field,
    text,
  })
  console.log('⚽ ~ index.ts ~ analyzeField ~ response:', response)
}

// await analyzeField('places_baclieu', 'name', 'Quán Cà Phê Hương Biển')

async function testAnalyze() {
  const tokensIndex = await client.indices.analyze({
    index: 'places_baclieu',
    analyzer: 'autocomplete', // analyzer dùng khi index
    text: 'Quán Cà Phê Hương Biển',
  })

  const tokensSearch = await client.indices.analyze({
    index: 'places_baclieu',
    analyzer: 'folding', // analyzer dùng khi search
    text: 'Quán Cà Phê Hương Biển',
  })

  console.log('Tokens when indexing:', tokensIndex.tokens)
  console.log('Tokens when searching:', tokensSearch.tokens)
}

// await testAnalyze()

async function fetchAllItems(indexName: string) {
  const allItems: any[] = []
  let response = await client.search({
    index: indexName,
    body: {
      query: { match_all: {} }, // Get all documents
    },
    size: 1,
    scroll: '10s', // Keep scroll context for 1 minute
  })

  allItems.push(...response.hits.hits)

  let scrollId = response._scroll_id
  if (!scrollId) return allItems

  while (response.hits.hits.length) {
    response = await client.scroll({
      scroll_id: scrollId,
      scroll: '10s',
    })
    if (response.hits.hits.length) {
      allItems.push(...response.hits.hits)
      scrollId = response._scroll_id
    } else {
      break
    }
  }

  return allItems
}

// const items = await fetchAllItems('places_baclieu')
// console.log('Total items:', items.length)
// items.forEach((doc) => console.log(doc._source))
