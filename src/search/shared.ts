import { removeAccents } from '@/utils'

export const PLACE_INDEX = {
  baclieu: 'places_baclieu',
}

export function getPlaceIndexByProvince(province: string) {
  return PLACE_INDEX[province as keyof typeof PLACE_INDEX] || 'places_general'
}

function fuzzyRegex(word: string): RegExp {
  const pattern = word
    .split('')
    .map((ch) => `${ch}.?`)
    .join('')
  return new RegExp(pattern, 'gi')
}

export function highlightTextAdvanced(text: string, query: string): string {
  if (!query.trim()) return text

  const originalText = text
  const lowerNoAccentText = removeAccents(text.toLowerCase())
  const keywords = removeAccents(query.toLowerCase()).split(/\s+/).filter(Boolean)

  let highlighted = originalText

  for (const kw of keywords) {
    const fuzzy = fuzzyRegex(kw)
    // Find all matches in the no-accent lowercased text
    const matches = [...lowerNoAccentText.matchAll(fuzzy)]

    for (const match of matches) {
      const matchedText = originalText.substr(match.index - 1, match[0].length)
      const safeMatched = matchedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex
      const highlightRegex = new RegExp(safeMatched, 'g')
      highlighted = highlighted.replace(highlightRegex, `<em class="highlight">${matchedText}</em>`)
    }
  }

  // Clean up overlapping highlights
  highlighted = highlighted.replace(/<\/em>\s*<em class="highlight">/g, '')
  // Fix spaces inside highlights
  highlighted = highlighted.replace(/\s{1}<\/em>/g, '</em> ')

  return highlighted
}
