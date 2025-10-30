## Download Goong .pbf files
```
python3 download_baclieu_tiles.py
```

## Download Goong .pbf files from har file
```
python3 download_from_har_concurrent.py maps.goong.io.har tiles_out/
```

## Join .pbf files into a single .mbtiles file
```
mb-util --scheme=xyz --image_format=pbf tiles_baclieu/ baclieu.mbtiles
```
