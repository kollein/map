#!/usr/bin/env python3
import math, os, time, random, requests, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, parse_qs

# ======= CONFIG =======
# Bạc Liêu bounding box (WGS84)
min_lon, min_lat = 105.3000, 8.9500
max_lon, max_lat = 105.8500, 9.6000

# Mở rộng & chia nhỏ khu vực
BBOX_PADDING_DEG = 0.05
CELL_SIZE_DEG = 0.125

# Zoom range
min_zoom = 0
max_zoom = 10

# Goong tile URL
sample_url = "https://tiles.goong.io/tiles/composite/{z}/{x}/{y}.pbf?api_key=f0bqt7o2tfAN9yoArwRcs3eHtaGy4nDcD9n6zO8o"

OUT_DIR = "tiles_baclieu"
MAX_WORKERS = 20  # số luồng song song tối đa
REQUESTS_TIMEOUT = 30
SLEEP_BETWEEN = 0.05
MAX_RETRIES = 5
BACKOFF_FACTOR = 1.5

# User-Agent (tốt để set)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    "Referer": "https://maps.goong.io/",
    "Origin": "https://maps.goong.io/"
}

# ======= UTILS =======
def extract_api_key(url):
    qs = parse_qs(urlparse(url).query)
    for key in ["api_key", "access_token"]:
        if key in qs:
            return qs[key][0]
    return None

API_KEY = extract_api_key(sample_url)
if not API_KEY:
    sys.exit("❌ Không tìm thấy API key trong sample_url")

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    x = int((lon_deg + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

def build_tile_url(z, x, y):
    base = sample_url.split("?")[0]
    return base.format(z=z, x=x, y=y) + f"?api_key={API_KEY}"

# ======= DOWNLOAD FUNC =======
def download_tile(z, x, y, out_path):
    """Tải 1 tile đơn, retry nếu lỗi tạm thời"""
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return True  # bỏ qua file đã tồn tại

    url = build_tile_url(z, x, y)
    retry = 0
    wait = SLEEP_BETWEEN
    while retry <= MAX_RETRIES:
        try:
            r = requests.get(url, headers=HEADERS, timeout=REQUESTS_TIMEOUT)
            if r.status_code == 200:
                with open(out_path, "wb") as f:
                    f.write(r.content)
                return True
            elif r.status_code == 404:
                return False
            elif r.status_code == 429:
                time.sleep(wait)
                wait *= BACKOFF_FACTOR
            elif 500 <= r.status_code < 600:
                time.sleep(wait)
                wait *= BACKOFF_FACTOR
            else:
                print(f"HTTP {r.status_code}: {url}")
                return False
        except Exception as e:
            time.sleep(wait)
            wait *= BACKOFF_FACTOR
        retry += 1
    return False

# ======= TILE BBOX =======
def generate_tiles(min_lon, min_lat, max_lon, max_lat, z):
    x1, y1 = deg2num(min_lat, min_lon, z)
    x2, y2 = deg2num(max_lat, max_lon, z)
    x_min, x_max = min(x1, x2) - 1, max(x1, x2) + 1
    y_min, y_max = min(y1, y2) - 1, max(y1, y2) + 1
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            yield z, x, y

# ======= MAIN PROCESS =======
def process_bbox(min_lon, min_lat, max_lon, max_lat):
    total_dl = 0
    for z in range(min_zoom, max_zoom + 1):
        tiles = list(generate_tiles(min_lon, min_lat, max_lon, max_lat, z))
        print(f"🧩 Zoom {z}: {len(tiles)} tiles")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            futures = {}
            for z, x, y in tiles:
                out_dir = os.path.join(OUT_DIR, str(z), str(x))
                ensure_dir(out_dir)
                out_path = os.path.join(out_dir, f"{y}.pbf")
                f = pool.submit(download_tile, z, x, y, out_path)
                futures[f] = (z, x, y)
                time.sleep(SLEEP_BETWEEN)

            done = 0
            for f in as_completed(futures):
                done += 1
                ok = f.result()
                if ok:
                    total_dl += 1
                if done % 50 == 0 or done == len(futures):
                    print(f"   Progress: {done}/{len(futures)} ({total_dl} ok)", end="\r", flush=True)
            print()
    return total_dl

def main():
    global min_lon, min_lat, max_lon, max_lat
    min_lon -= BBOX_PADDING_DEG
    max_lon += BBOX_PADDING_DEG
    min_lat -= BBOX_PADDING_DEG
    max_lat += BBOX_PADDING_DEG

    ensure_dir(OUT_DIR)

    total_ok = 0
    lon = min_lon
    while lon < max_lon:
        lat = min_lat
        while lat < max_lat:
            sub_min_lon = lon
            sub_max_lon = min(lon + CELL_SIZE_DEG, max_lon)
            sub_min_lat = lat
            sub_max_lat = min(lat + CELL_SIZE_DEG, max_lat)
            print(f"\n📦 Sub-cell: ({sub_min_lon:.3f},{sub_min_lat:.3f}) → ({sub_max_lon:.3f},{sub_max_lat:.3f})")
            ok = process_bbox(sub_min_lon, sub_min_lat, sub_max_lon, sub_max_lat)
            total_ok += ok
            lat += CELL_SIZE_DEG
        lon += CELL_SIZE_DEG

    print(f"\n✅ Tổng cộng tải thành công {total_ok} tile.")

if __name__ == "__main__":
    main()
