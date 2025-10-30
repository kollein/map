import { spawn } from "bun";

const keywords = ["Quán Chay"];

for (const k of keywords) {
  const keyword = k.trim().toLowerCase().replace(/( +)/gi, "-");
  spawn(["bun", "./google-map-crawler/scrape_googlemaps.js", `${keyword}-bạc-liêu`], {
    stdout: "inherit",
    stderr: "inherit",
  });
}
