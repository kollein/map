/*
  Warnings:

  - Added the required column `province` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Province" AS ENUM ('angiang', 'baclieu', 'bentre', 'camau', 'cantho', 'dongthap', 'hauchiang', 'kiengiang', 'longan', 'soctrang', 'tiengiang', 'travinh', 'vinhlong');

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "province" "Province" NOT NULL,
ALTER COLUMN "class" DROP DEFAULT,
ALTER COLUMN "rank" DROP DEFAULT,
ALTER COLUMN "subclass" DROP DEFAULT;
