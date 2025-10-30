import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Đường dẫn tới MBTiles và style JSON
const mbtilesPath = "./poi_custom.mbtiles";
const stylePath = "./style.json";
const newStylePath = "./style_with_minmax.json";

async function addMinMaxZoomToStyle() {
  // Mở MBTiles
  const db = await open({ filename: mbtilesPath, driver: sqlite3.Database });

  // Lấy metadata minzoom & maxzoom
  const minzoomRow = await db.get("SELECT value FROM metadata WHERE name='minzoom'");
  const maxzoomRow = await db.get("SELECT value FROM metadata WHERE name='maxzoom'");
  const minzoom = parseFloat(minzoomRow.value);
  const maxzoom = parseFloat(maxzoomRow.value);

  // Đọc style JSON
  const style = JSON.parse(fs.readFileSync(stylePath, "utf8"));

  // Tìm layer poi_custom và cập nhật minzoom/maxzoom
  const layer = style.layers.find((l) => l.id === "poi_custom");
  if (layer) {
    layer.minzoom = minzoom;
    layer.maxzoom = maxzoom;
  }

  // Ghi style mới
  fs.writeFileSync(newStylePath, JSON.stringify(style, null, 2));
  console.log(`Updated style saved to ${newStylePath} with minzoom=${minzoom}, maxzoom=${maxzoom}`);

  await db.close();
}

addMinMaxZoomToStyle().catch(console.error);
