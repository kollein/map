// file: extractGeoJSON_fixed_latlng.js
import fs from "fs";
import path from "path";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";

const TILE_ROOT = "./tiles_vietnam/";
const TARGET_LAYER = "poi_label";
const TILE_SIZE = 4096; // mapbox vector tile spec

function getAllPBFs(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllPBFs(fullPath));
    } else if (file.endsWith(".pbf")) {
      results.push(fullPath);
    }
  }
  return results;
}

function decodePBF(filePath) {
  const data = fs.readFileSync(filePath);
  return new VectorTile(new Protobuf(data));
}

// Convert tile local coord → EPSG:4326
function localToLonLat(localX, localY, tileX, tileY, zoom) {
  const n = Math.pow(2, zoom);

  const lon = ((tileX + localX / TILE_SIZE) / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (tileY + localY / TILE_SIZE)) / n)));
  const lat = (180 / Math.PI) * latRad;

  return [lon, lat];
}

function featureToGeoJSONManual(feature, tileX, tileY, zoom) {
  const geom = feature.loadGeometry();
  const features = [];

  for (const ring of geom) {
    for (const point of ring) {
      const [lon, lat] = localToLonLat(point.x, point.y, tileX, tileY, zoom);
      features.push([lon, lat]);
    }
  }

  let geometry;
  switch (feature.type) {
    case 1:
      geometry = { type: "Point", coordinates: features[0] };
      break;
    case 2:
      geometry = { type: "LineString", coordinates: features };
      break;
    case 3:
      geometry = { type: "Polygon", coordinates: [features] };
      break;
    default:
      return null;
  }

  return {
    type: "Feature",
    geometry,
    properties: feature.properties,
  };
}

// --- Main ---
const geojson = { type: "FeatureCollection", features: [] };
const files = getAllPBFs(TILE_ROOT);
console.log(`🧭 Found ${files.length} .pbf tiles`);

let c = 0;
for (const file of files) {
  const parts = path.relative(TILE_ROOT, file).split(path.sep);
  if (parts.length !== 3) continue;

  const zoom = parseInt(parts[0]);
  const tileX = parseInt(parts[1]);
  const tileY = parseInt(parts[2].replace(".pbf", ""));

  const tile = decodePBF(file);
  if (zoom === 14) {
    console.log("⚽ ~ tile:", tile);
  }
  const layer = tile.layers[TARGET_LAYER];
  if (!layer) continue;

  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    const geo = featureToGeoJSONManual(f, tileX, tileY, zoom);
    if (geo) geojson.features.push(geo);
  }

  if (c === 0) break;
}

fs.writeFileSync("output_fixed.geojson", JSON.stringify(geojson, null, 2));
console.log(`✅ Done! Exported ${geojson.features.length} features → output_fixed.geojson`);
