// =============================
// 🗺️ Decode .pbf tiles → GeoJSON (kèm raw info)
// =============================

import fs from "fs";
import path from "path";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";

// 🧭 Thư mục chứa tiles
const TILE_ROOT = "./tiles_out_from_har/composite/";
// 🧩 Layer cần export
const TARGET_LAYER = "point_map";
// 📦 File đầu ra
const OUTPUT_FILE = "output.geojson";

// === Đệ quy lấy danh sách file .pbf ===
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

// === Hàm decode 1 file ===
function decodePBF(filePath) {
  const data = fs.readFileSync(filePath);
  return new VectorTile(new Protobuf(data));
}

// === In ra thông tin raw của 1 tile ===
function logRawTileInfo(tile, filePath) {
  console.log(`\n📂 [RAW] File: ${filePath}`);
  const layerNames = Object.keys(tile.layers);
  console.log(`   🧩 Layers: ${layerNames.join(", ")}`);

  for (const layerName of layerNames) {
    const layer = tile.layers[layerName];
    console.log(`   ├── Layer "${layerName}" → ${layer.length} features`);
    if (layer.length > 0) {
      const sample = layer.feature(0);
      const geomType = ["Unknown", "Point", "LineString", "Polygon"][sample.type] || "Unknown";
      console.log(`   │   ├─ Geometry type: ${geomType}`);
      console.log(`   │   ├─ Sample properties:`, sample.properties);
    }
  }
}

// === Chuyển feature → GeoJSON ===
function featureToGeoJSON(feature, tileX, tileY, zoom) {
  try {
    // Đảo Y (vì Goong có thể dùng TMS)
    const tileY_XYZ = Math.pow(2, zoom) - 1 - tileY;
    return feature.toGeoJSON(tileX, tileY_XYZ, zoom);
  } catch (err) {
    console.warn("⚠️ Lỗi decode feature:", err);
    return null;
  }
}

// === GeoJSON container ===
const geojson = { type: "FeatureCollection", features: [] };

// === Bắt đầu decode ===
const files = getAllPBFs(TILE_ROOT);
console.log(`🧩 Tổng số file .pbf: ${files.length}`);

for (const file of files) {
  const parts = path.relative(TILE_ROOT, file).split(path.sep);
  if (parts.length !== 3) {
    console.warn("⚠️ Bỏ qua (sai cấu trúc Z/X/Y.pbf):", file);
    continue;
  }

  const zoom = parseInt(parts[0]);
  const tileX = parseInt(parts[1]);
  const tileY = parseInt(parts[2].replace(".pbf", ""));

  const tile = decodePBF(file);
  logRawTileInfo(tile, file); // 🧾 in thông tin raw

  // Decode layer cần thiết
  if (!tile.layers[TARGET_LAYER]) continue;
  const layer = tile.layers[TARGET_LAYER];

  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    const geo = featureToGeoJSON(f, tileX, tileY, zoom);
    if (geo) geojson.features.push(geo);
  }
}

// === Xuất file GeoJSON ===
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
console.log(`✅ Hoàn tất! Đã xuất ${geojson.features.length} features → ${OUTPUT_FILE}`);
