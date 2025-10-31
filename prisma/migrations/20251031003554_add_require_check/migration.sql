/*
  Warnings:

  - Added the required column `updatedAt` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."place_name_trgm_idx";

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "requireCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
