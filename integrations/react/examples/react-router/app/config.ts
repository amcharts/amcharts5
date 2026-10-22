// A pie chart as a JSON config, in the format the amCharts editor and the
// JSON plugin's ChartSerializer save. It is plain data, with no amCharts
// imports: it can come from a file, a server or a database.
// See https://www.amcharts.com/docs/v5/concepts/serializing/
export const config = {
	"type": "PieChart",
	"settings": {
		"layout": { "type": "VerticalLayout" }
	},
	"properties": {
		"series": ["#series"]
	},
	"children": [
		{
			"type": "Legend",
			"settings": {
				"centerX": { "type": "Percent", "value": 50 },
				"x": { "type": "Percent", "value": 50 }
			},
			"properties": { "data": "#series.dataItems" }
		}
	],
	"refs": [
		{
			"data": [
				{ "value": 10, "category": "One" },
				{ "value": 9, "category": "Two" },
				{ "value": 6, "category": "Three" },
				{ "value": 5, "category": "Four" }
			]
		},
		{
			"series": {
				"type": "PieSeries",
				"settings": {
					"valueField": "value",
					"categoryField": "category"
				},
				"properties": { "data": "#data" }
			}
		}
	]
};
