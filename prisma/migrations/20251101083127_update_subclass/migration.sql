-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlaceSubClass" ADD VALUE 'building';
ALTER TYPE "PlaceSubClass" ADD VALUE 'church';
ALTER TYPE "PlaceSubClass" ADD VALUE 'company';
ALTER TYPE "PlaceSubClass" ADD VALUE 'hospital';
ALTER TYPE "PlaceSubClass" ADD VALUE 'hotel';
ALTER TYPE "PlaceSubClass" ADD VALUE 'marker';
ALTER TYPE "PlaceSubClass" ADD VALUE 'pagoda';
ALTER TYPE "PlaceSubClass" ADD VALUE 'school';

-- DropIndex
DROP INDEX "public"."place_name_trgm_idx";
