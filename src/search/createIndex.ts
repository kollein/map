import { Client } from '@elastic/elasticsearch'
import { getPlaceIndexByProvince } from '@/search/shared'

const client = new Client({ node: 'http://localhost:9200' })

export async function createIndex(province: string) {
  const indexName = getPlaceIndexByProvince(province)

  // 🧹 Delete old index if exists
  await client.indices.delete({ index: indexName }, { ignore: [404] })

  // 🧱 Create new index
  await client.indices.create({
    index: indexName,
    body: {
      settings: {
        analysis: {
          filter: {
            edge_ngram_filter: {
              type: 'edge_ngram',
              min_gram: 3,
              max_gram: 5,
            },
          },
          analyzer: {
            autocomplete: {
              tokenizer: 'standard',
              filter: [
                'lowercase',
                'asciifolding', // remove accents
                'edge_ngram_filter', // support autocomplete
              ],
            },
            folding: {
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
      mappings: {
        properties: {
          name: {
            type: 'text',
            analyzer: 'autocomplete',
            search_analyzer: 'folding',
          },
          address: {
            type: 'text',
            analyzer: 'autocomplete',
            search_analyzer: 'folding',
          },
          province: { type: 'keyword' },
          category: { type: 'keyword' },
          tags: { type: 'keyword' },
          location: { type: 'geo_point' },
        },
      },
    },
  } as any)

  console.log(`✅ Index ${indexName} created with shingle(2) + edge_ngram + folding + fvh`)
}

await createIndex('baclieu')
