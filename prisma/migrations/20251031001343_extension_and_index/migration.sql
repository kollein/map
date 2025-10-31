-- Create extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS cube;

CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create index
CREATE INDEX place_name_trgm_idx ON "Place" USING gist (name gist_trgm_ops);

CREATE INDEX place_coords_idx ON "Place" USING gist (ll_to_earth (lat, lng));

-- CreateEnum
CREATE TYPE "PlaceClass" AS ENUM ('amenity');

-- CreateEnum
CREATE TYPE "PlaceSubClass" AS ENUM ('shop', 'restaurant', 'cafe', 'bar');

-- AlterTable
ALTER TABLE "Place"
ADD COLUMN "class" "PlaceClass" NOT NULL DEFAULT 'amenity',
ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "subclass" "PlaceSubClass" NOT NULL DEFAULT 'shop';
