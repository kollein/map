# Export vietnam-latest.osm.pbf to province.geojson

```
jq '.features |= map(select(.properties.shapeName == "Bạc Liêu")) | {type: "FeatureCollection", features: .features}' geoBoundaries-VNM.geojson > geoBoundaries-VNM-baclieu.geojson
```

```
osmium extract --polygon=geoBoundaries-VNM-baclieu.geojson vietnam-latest.osm.pbf -o baclieu.osm.pbf
```

```
osmium export baclieu.osm.pbf -o baclieu.geojson
```

### Filter: `type: Point`
```
jq '.features |= map(select(.geometry.type == "Point"))' baclieu.geojson > baclieu_points.geojson
```

### Filter: `type: Point` and `properties.amenity`
```
jq '.features |= map(select(.geometry.type == "Point" and .properties.amenity))' baclieu.geojson > baclieu_amenity_points.geojson
```
