-- CreateEnum
CREATE TYPE "PlaceClass" AS ENUM ('amenity');

-- CreateEnum
CREATE TYPE "PlaceSubClass" AS ENUM ('shop', 'restaurant', 'cafe', 'bar');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('angiang', 'baclieu', 'bentre', 'camau', 'cantho', 'dongthap', 'hauchiang', 'kiengiang', 'longan', 'soctrang', 'tiengiang', 'travinh', 'vinhlong');

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "class" "PlaceClass" NOT NULL,
    "subclass" "PlaceSubClass" NOT NULL,
    "keyword" TEXT,
    "province" "Province" NOT NULL,
    "requireCheck" BOOLEAN NOT NULL DEFAULT false,
    "checkWith" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- Create extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS cube;

CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create index
CREATE INDEX place_name_trgm_idx ON "Place" USING gist (name gist_trgm_ops);

CREATE INDEX place_coords_idx ON "Place" USING gist (ll_to_earth (lat, lng));
