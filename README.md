## Start tile server gl

```
tileserver-gl --config ./data/config.json
```

## Custom poi (point of interest)

1. Build custom.mbtiles file from geojson file using tippecanoe tool
   The name of the file `poi_custom.geojson` is used to define the `source-layer` and the `id`

```
tippecanoe -o poi_custom.mbtiles poi_custom.geojson --force
```

1. Check source layer name

```
sqlite3 poi_custom.mbtiles

SELECT * FROM metadata;
```

3. Update tileservergl config with poi_custom.mbtiles

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
    "poi_custom": {
      "mbtiles": "poi_custom.mbtiles"
    }
  }
}
```

4. Update map style.json
   Add poi_custom into sources and layers properties

```
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "url": "mbtiles://vietnam"
    },
    "poi_custom": {
      "type": "vector",
      "url": "mbtiles://poi_custom"
    }
  },
  "layers": [
    {
      "id": "poi_custom",
      "type": "symbol",
      "source": "poi_custom",
      "source-layer": "poi_custom",
      "layout": {
        "icon-image": "marker-15",
        "icon-size": 1,
        "text-field": "{name}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0.6],
        "text-anchor": "top"
      }
    }
  ]
```
