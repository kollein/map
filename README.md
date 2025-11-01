# Start tile server gl

```
tileserver-gl --config ./data/config.json
```

## Custom POI (point of interest)

### Build custom.mbtiles file from geojson file using tippecanoe tool

The name of the file `poi_custom_a.geojson` is used to define the `source-layer` and the `id`

```
tippecanoe -o poi_custom_a.mbtiles poi_custom_a.geojson --force
```

### Join multiple `.mbtiles` with different layer ids into one `composite.mbtiles`

```
tile-join -o composite.mbtiles poi_custom_a.mbtiles poi_custom_b.mbtiles --no-tile-size-limit
```

### Check layer ids inside `composite.mbtiles` via sqlite3 then update tileservergl `config.json` and map `style.json`

```
sqlite3 composite.mbtiles

SELECT json_extract(value, '$.vector_layers') FROM metadata WHERE name='json';
```

### Update tileservergl `config.json` with `composite.mbtiles`

```
{
  "options": {
    "paths": {
      "root": "./",
      "mbtiles": "./",
      "fonts": "fonts",
      "styles": "styles"
    }
  },
  "styles": {
    "maptiler-basic": {
      "style": "maptiler-basic/style.json",
      "tilejson": {
        "type": "vector"
      }
    }
  },
  "data": {
    "vietnam": {
      "mbtiles": "vietnam.mbtiles"
    },
    "composite": {
      "mbtiles": "composite.mbtiles"
    }
  }
}
```

### Update map `style.json`

Add poi_custom into sources and layers properties

```
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "url": "mbtiles://vietnam"
    },
    "composite": {
      "type": "vector",
      "url": "mbtiles://composite"
    }
  },
  "layers": [
    ...,
    {
      "id": "poi_custom_a",
      "type": "symbol",
      "source": "composite",
      "source-layer": "poi_custom_a",
      "minzoom": 14,
      "maxzoom": 24,
      "layout": {
        "text-size": {
          "stops": [
            [16, 11],
            [20, 13]
          ]
        },
      },
      "paint": {
        "text-halo-blur": 0,
        "text-color": "rgba(25, 118, 210, 1)",
        "text-halo-width": 1,
        "text-halo-color": "rgba(255, 255, 255, 1)"
      }
    },
    {
      "id": "poi_custom_b",
      "type": "symbol",
      "source": "composite",
      "source-layer": "poi_custom_b",
      "minzoom": 14,
      "maxzoom": 24,
      "layout": {
        "text-size": {
          "stops": [
            [16, 11],
            [20, 13]
          ]
        },
      },
      "paint": {
        "text-halo-blur": 0,
        "text-color": "rgba(25, 118, 210, 1)",
        "text-halo-width": 1,
        "text-halo-color": "rgba(255, 255, 255, 1)"
      }
    }
  ]
```
