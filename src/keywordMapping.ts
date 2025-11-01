type KeywordMappingResult = {
  class: string
  subclass: string
  rank: number
}

export const keywordMapping: { [key: string]: KeywordMappingResult } = {
  shop: { class: 'amenity', subclass: 'shop', rank: 3 },
  'cửa-hàng': { class: 'amenity', subclass: 'shop', rank: 3 },
  'tiệm-bánh': { class: 'amenity', subclass: 'shop', rank: 3 },
  'tạp-hoá': { class: 'amenity', subclass: 'shop', rank: 3 },

  cafe: { class: 'amenity', subclass: 'cafe', rank: 3 },
  'quán-cà-phê': { class: 'amenity', subclass: 'cafe', rank: 3 },
  'trà-sữa': { class: 'amenity', subclass: 'cafe', rank: 3 },

  restaurant: { class: 'amenity', subclass: 'restaurant', rank: 3 },
  'nhà-hàng': { class: 'amenity', subclass: 'restaurant', rank: 3 },
  'quán-ăn': { class: 'amenity', subclass: 'restaurant', rank: 3 },

  company: { class: 'amenity', subclass: 'company', rank: 3 },
  'công-ty': { class: 'amenity', subclass: 'company', rank: 3 },

  building: { class: 'amenity', subclass: 'building', rank: 3 },
  'toà-nhà': { class: 'amenity', subclass: 'building', rank: 3 },

  hotel: { class: 'amenity', subclass: 'hotel', rank: 3 },
  'khách-sạn': { class: 'amenity', subclass: 'hotel', rank: 3 },
  'nhà-nghỉ': { class: 'amenity', subclass: 'hotel', rank: 3 },

  hospital: { class: 'amenity', subclass: 'hospital', rank: 4 },
  'bệnh-viện': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'trạm-y-tế': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'nhà-thuốc-tây': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'phòng-khám': { class: 'amenity', subclass: 'hospital', rank: 4 },

  school: { class: 'amenity', subclass: 'school', rank: 4 },
  'trường-học': { class: 'amenity', subclass: 'school', rank: 4 },

  'place-of-church': { class: 'amenity', subclass: 'church', rank: 4 },

  chùa: { class: 'amenity', subclass: 'pagoda', rank: 4 },
  miếu: { class: 'amenity', subclass: 'pagoda', rank: 4 },

  'hớt-tóc': { class: 'amenity', subclass: 'marker', rank: 4 },
  'salon-tóc': { class: 'amenity', subclass: 'marker', rank: 4 },
  'trang-điểm': { class: 'amenity', subclass: 'marker', rank: 4 },
}

export function getKeywordMapping(keyword: string): KeywordMappingResult | null {
  const normalized = keyword.toLowerCase()
  return keywordMapping[normalized] || null
}

export function getKeywordsBySubclass(subclass: string): string[] {
  return Object.keys(keywordMapping).filter((key) => keywordMapping[key].subclass === subclass)
}

export function getAllSubclasses() {
  const subclasses: string[] = []
  Object.values(keywordMapping).forEach((mapping) => {
    if (!subclasses.includes(mapping.subclass)) {
      subclasses.push(mapping.subclass)
    }
  })
  return subclasses
}
