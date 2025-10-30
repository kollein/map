#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tải song song các file .pbf từ HAR (tối đa 10 luồng).
Tự động retry, tạo thư mục z/x/y.pbf đúng chuẩn.
"""

import os, json, sys, time, random, requests
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# ==== CẤU HÌNH ====
MAX_WORKERS = 10          # số luồng song song tối đa
MAX_RETRIES = 5           # số lần thử lại
BACKOFF_FACTOR = 1.8      # hệ số tăng delay khi retry
SLEEP_BETWEEN = 0.05      # delay nhỏ giữa các lượt tải
TIMEOUT = 30              # timeout mỗi request

# User-Agent (tốt để set)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    "Referer": "https://maps.goong.io/",
    "Origin": "https://maps.goong.io/"
}

# ===================

def download_file(url, out_path):
    """Tải 1 file có retry logic"""
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return True

    retry, delay = 0, SLEEP_BETWEEN
    while retry <= MAX_RETRIES:
        try:
            r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            if r.status_code == 200:
                os.makedirs(os.path.dirname(out_path), exist_ok=True)
                with open(out_path, "wb") as f:
                    f.write(r.content)
                return True
            elif r.status_code in (429, 500, 502, 503, 504):
                time.sleep(delay)
                delay *= BACKOFF_FACTOR
                retry += 1
            else:
                print(f"[WARN] HTTP {r.status_code} {url}")
                return False
        except Exception as e:
            retry += 1
            time.sleep(delay)
            delay *= BACKOFF_FACTOR
    return False


def extract_pbf_urls(har_path):
    with open(har_path, "r", encoding="utf-8") as f:
        har = json.load(f)
    entries = har.get("log", {}).get("entries", [])
    urls = []
    for e in entries:
        url = e.get("request", {}).get("url", "")
        if url.endswith(".pbf") or ".pbf?" in url:
            urls.append(url)
    return urls


def url_to_path(url, out_dir):
    parsed = urlparse(url)
    parts = parsed.path.strip("/").split("/")
    out_path = os.path.join(out_dir, *parts[-4:])
    return out_path


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 download_from_har_concurrent.py <file.har> [out_dir]")
        sys.exit(1)

    har_path = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) >= 3 else "tiles_from_har"

    os.makedirs(out_dir, exist_ok=True)
    urls = extract_pbf_urls(har_path)

    print(f"📦 Tổng request trong HAR: {len(urls)} file .pbf được tìm thấy.")
    print(f"🚀 Bắt đầu tải song song tối đa {MAX_WORKERS} luồng...\n")

    downloaded = 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for url in urls:
            out_path = url_to_path(url, out_dir)
            futures[executor.submit(download_file, url, out_path)] = url

        for i, future in enumerate(as_completed(futures), start=1):
            url = futures[future]
            try:
                result = future.result()
                if result:
                    downloaded += 1
                    print(f"[{i}/{len(urls)}] ✅ OK: {url}")
                else:
                    print(f"[{i}/{len(urls)}] ❌ FAIL: {url}")
            except Exception as e:
                print(f"[{i}/{len(urls)}] 💥 ERROR {e} @ {url}")
            time.sleep(random.uniform(0, 0.02))

    print(f"\n✅ Hoàn tất: {downloaded}/{len(urls)} file tải thành công.")
    print(f"📁 Lưu tại: {os.path.abspath(out_dir)}")


if __name__ == "__main__":
    main()
