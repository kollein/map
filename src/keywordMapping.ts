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

  'công-ty': { class: 'amenity', subclass: 'company', rank: 3 },

  building: { class: 'amenity', subclass: 'building', rank: 3 },
  'toà-nhà': { class: 'amenity', subclass: 'building', rank: 3 },

  hospital: { class: 'amenity', subclass: 'hospital', rank: 4 },
  clinic: { class: 'amenity', subclass: 'hospital', rank: 4 },
  pharmacity: { class: 'amenity', subclass: 'hospital', rank: 4 },
  'bệnh-viện': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'trạm-y-tế': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'nhà-thuốc': { class: 'amenity', subclass: 'hospital', rank: 4 },
  'phòng-răng': { class: 'amenity', subclass: 'hospital', rank: 4 },

  school: { class: 'amenity', subclass: 'school', rank: 4 },
  'trường-học': { class: 'amenity', subclass: 'school', rank: 4 },

  'nhà-thờ': { class: 'amenity', subclass: 'church', rank: 5 },

  chùa: { class: 'amenity', subclass: 'pagoda', rank: 5 },
  miếu: { class: 'amenity', subclass: 'pagoda', rank: 5 },

  'hớt-tóc': { class: 'information', subclass: 'marker', rank: 5 },
  'salon-tóc': { class: 'information', subclass: 'marker', rank: 5 },
  'trang-điểm': { class: 'information', subclass: 'marker', rank: 5 },
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
