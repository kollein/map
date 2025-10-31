import { Place } from '@prisma/client'

export type PlaceMessage = Pick<
  Place,
  'name' | 'lat' | 'lng' | 'keyword' | 'class' | 'subclass' | 'rank' | 'requireCheck' | 'province'
>

export type SimilarPlace = Pick<Place, 'id' | 'name' | 'lat' | 'lng'> & {
  name_similarity: number
  distance_m: number
}
