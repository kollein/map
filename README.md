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
    "composite": {
      "mbtiles": "composite.mbtiles"
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
    "composite": {
      "type": "vector",
      "url": "mbtiles://composite"
    }
  },
  "layers": [
    ...,
    {
      "id": "poi_custom",
      "type": "symbol",
      "source": "composite",
      "source-layer": "poi_custom",
      "minzoom": 14,
      "maxzoom": 24,
      "filter": ["all", ["!in", "subclass", "zoo"]],
      "layout": {
        "text-optional": true,
        "text-line-height": 1.2,
        "text-size": {
          "stops": [
            [16, 11],
            [20, 13]
          ]
        },
        "text-allow-overlap": false,
        "icon-image": {
          "stops": [
            [14, "{subclass}"],
            [15, "{subclass}"]
          ]
        },
        "icon-rotation-alignment": "auto",
        "text-ignore-placement": false,
        "text-font": ["Roboto Regular"],
        "icon-allow-overlap": false,
        "text-padding": 1,
        "visibility": "visible",
        "text-offset": [0, 1],
        "icon-optional": false,
        "icon-size": 1.2,
        "text-anchor": "top",
        "text-field": "{name}",
        "text-letter-spacing": 0.02,
        "text-max-width": 8,
        "icon-ignore-placement": false
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

5. Join multiple .mbtiles with different layer ids into one composite.mbtiles

```
tile-join -o composite.mbtiles poi_custom.mbtiles poi_vinh.mbtiles --no-tile-size-limit
```

6. Check layer ids inside composite.mbtiles via sqlite3 then update tileservergl `config.json` and map `style.json`

```
sqlite3 composite.mbtiles

SELECT json_extract(value, '$.vector_layers') FROM metadata WHERE name='json';
```
