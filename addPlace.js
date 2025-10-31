import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const THRESHOLD_SIMILARITY = 0.8; // 80% giống tên
const DISTANCE_LIMIT = 150; // 150 mét

async function getFirstMostSimilarPlace(name, lat, lng) {
  const result = await prisma.$queryRaw`
    SELECT 
      id, 
      name, 
      lat, 
      lng,
      similarity(name, ${name}) AS name_similarity,
      earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(lat, lng)) AS distance_m
    FROM "Place"
    WHERE 
      (
        similarity(name, ${name}) > ${THRESHOLD_SIMILARITY}
        AND earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(lat, lng)) < ${DISTANCE_LIMIT}
      )
      OR (
        earth_distance(ll_to_earth(${lat}, ${lng}), ll_to_earth(lat, lng)) <= 5
      )
      OR (
        similarity(name, ${name}) = 1
      )
    ORDER BY name_similarity DESC, distance_m ASC
    LIMIT 1;
  `;

  return result[0];
}

async function addPlace(name, lat, lng, keyword) {
  const place = await getFirstMostSimilarPlace(name, lat, lng);
  console.log(`Place: ${name}`, place);

  if (!place) {
    await prisma.place.create({
      data: { name, lat, lng, keyword },
    });
    console.log(`✅ Saved: ${name}`);
    return;
  }

  const { name_similarity, distance_m } = place;
  if (name_similarity === 1 && distance_m === 0) {
    console.log("match:1:0:return");
    return;
  }

  if (name_similarity >= THRESHOLD_SIMILARITY && distance_m === 0) {
    console.log(`match:>=${THRESHOLD_SIMILARITY}:0:return`);
    await prisma.place.create({
      data: { name, lat, lng, keyword, requireCheck: true },
    });
    console.log(`✅ Saved: ${name} with requireCheck`);
    return;
  }

  if (name_similarity === 1 && distance_m <= DISTANCE_LIMIT) {
    console.log(`match:1:${DISTANCE_LIMIT}:return`);
    await prisma.place.create({
      data: { name, lat, lng, keyword, requireCheck: true },
    });
    console.log(`✅ Saved: ${name} with requireCheck`);
    return;
  }
}

// await addPlace("Vĩnh đẹp trai", 9.21, 105.86, "cafe");
await addPlace("Vĩnh đẹp trai salon", 9.21, 105.8610002, "cafe");
