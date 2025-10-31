type BoundingBox = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

// TODO: Not accurate bounding boxes, need to be fixed later
export const boundingBoxes: Record<string, BoundingBox> = {
  angiang: { minLat: 9.9, maxLat: 10.65, minLng: 105.1, maxLng: 105.8 },
  baclieu: { minLat: 8.993, maxLat: 9.55, minLng: 105.35, maxLng: 105.88 },
  bentre: { minLat: 9.7, maxLat: 10.28, minLng: 106.15, maxLng: 106.92 },
  camau: { minLat: 8.6, maxLat: 9.38, minLng: 104.8, maxLng: 105.5 },
  cantho: { minLat: 9.9, maxLat: 10.5, minLng: 105.5, maxLng: 106.15 },
  dongthap: { minLat: 9.8, maxLat: 10.85, minLng: 105.3, maxLng: 106.45 },
  hauchiang: { minLat: 9.8, maxLat: 10.45, minLng: 105.25, maxLng: 105.9 },
  kiengiang: { minLat: 9.6, maxLat: 10.9, minLng: 104.3, maxLng: 105.5 },
  longan: { minLat: 10.25, maxLat: 10.95, minLng: 105.6, maxLng: 106.8 },
  soctrang: { minLat: 8.9, maxLat: 9.8, minLng: 104.8, maxLng: 105.8 },
  tiengiang: { minLat: 10.1, maxLat: 10.8, minLng: 106.3, maxLng: 106.9 },
  travinh: { minLat: 9.9, maxLat: 10.65, minLng: 105.1, maxLng: 106.1 },
  vinhlong: { minLat: 9.95, maxLat: 10.65, minLng: 105.8, maxLng: 106.35 },
}

export function getBoundingBoxByProvince(province: string): BoundingBox | undefined {
  const key = province.toLowerCase().replace(/\s+/g, '')
  return boundingBoxes[key]
}
