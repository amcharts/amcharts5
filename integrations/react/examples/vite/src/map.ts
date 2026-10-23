// A map as a JSON config: the countries of the column chart, shaded by their
// visits. A config names its geodata, "am5geodata_worldLow", instead of
// carrying it: the component gets the geodata in its `resources` prop.
export const mapConfig = {
	"type": "MapChart",
	"settings": {
		"projectionName": "geoMercator",
		"homeGeoPoint": { "longitude": 24, "latitude": 60 },
		"homeZoomLevel": 4,
		"autoHome": true
	},
	"properties": {
		"series": ["#world", "#visited"]
	},
	"refs": [
		{
			"visits": [
				{ "id": "LT", "value": 501 },
				{ "id": "LV", "value": 301 },
				{ "id": "EE", "value": 201 },
				{ "id": "FI", "value": 165 }
			]
		},
		{
			"worldPolygon": {
				"type": "Template",
				"settings": {
					"fill": { "type": "Color", "value": "#d9d9d9" }
				}
			}
		},
		{
			"visitedPolygon": {
				"type": "Template",
				"settings": {
					"tooltipText": "{name}: {value} visits"
				}
			}
		},
		{
			// Every country, in grey, as the background
			"world": {
				"type": "MapPolygonSeries",
				"settings": {
					"geoJSON": "am5geodata_worldLow",
					"exclude": ["AQ"]
				},
				"properties": {
					"mapPolygons": {
						"properties": { "template": "#worldPolygon" }
					}
				}
			}
		},
		{
			// The countries with data, shaded from light to dark by their visits
			"visited": {
				"type": "MapPolygonSeries",
				"settings": {
					"geoJSON": "am5geodata_worldLow",
					"include": ["LT", "LV", "EE", "FI"],
					"valueField": "value",
					"calculateAggregates": true,
					"heatRules": [
						{
							"target": "#visitedPolygon",
							"dataField": "value",
							"key": "fill",
							"min": { "type": "Color", "value": "#9ecae1" },
							"max": { "type": "Color", "value": "#08519c" },
							"__parse": true
						}
					]
				},
				"properties": {
					"data": "#visits",
					"mapPolygons": {
						"properties": { "template": "#visitedPolygon" }
					}
				}
			}
		}
	]
};
