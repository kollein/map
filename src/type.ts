import { Place } from '@prisma/client'

export type PlaceMessage = Pick<
  Place,
  'name' | 'lat' | 'lng' | 'keyword' | 'class' | 'subclass' | 'rank' | 'requireCheck'
>
