export interface Visits {
	country: string;
	visits: number;
}

export const visits: Array<Visits> = [
	{ country: "Lithuania", visits: 501 },
	{ country: "Latvia", visits: 301 },
	{ country: "Estonia", visits: 201 },
	{ country: "Finland", visits: 165 },
];

// New values for the same countries, for the "New data" button
export function randomVisits(): Array<Visits> {
	return visits.map((item) => ({ country: item.country, visits: Math.round(100 + Math.random() * 500) }));
}

// A column chart as code. It runs in the chart's WebView, so it is a string,
// written as for script tags: am5xy is a global there, not an import. It has
// `root`, `data` (the `data` prop) and `post` (to send messages to the app)
export const columnChartCode = `
const chart = root.container.children.push(am5xy.XYChart.new(root, {}));

const xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
	categoryField: "country",
	renderer: am5xy.AxisRendererX.new(root, {})
}));

const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
	min: 0,
	renderer: am5xy.AxisRendererY.new(root, {})
}));

const series = chart.series.push(am5xy.ColumnSeries.new(root, {
	xAxis: xAxis,
	yAxis: yAxis,
	categoryXField: "country",
	valueYField: "visits"
}));

// A tap on a column tells the app which country it is: onMessage gets it
series.columns.template.events.on("click", (event) => {
	post("country", event.target.dataItem.dataContext.country);
});

xAxis.data.setAll(data);
series.data.setAll(data);

// New data goes to this function, which changes the chart in place. Without
// it, new data would make the chart again
return (newData) => {
	xAxis.data.setAll(newData);
	series.data.setAll(newData);
};
`;

// A pie chart as a JSON config, in the format the amCharts editor and the
// JSON plugin's ChartSerializer save. The chart types it uses are loaded for it
export const pieConfig = {
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

// A map as a JSON config. The geodata it names by its global,
// am5geodata_worldLow, is loaded for it too
export const mapConfig = {
	"type": "MapChart",
	"settings": {
		"homeGeoPoint": { "longitude": 14, "latitude": 51 },
		"homeZoomLevel": 3.5,
		"autoHome": true,
		"projectionName": "geoMercator"
	},
	"properties": {
		"series": ["#countries"]
	},
	"refs": [
		{
			"countries": {
				"type": "MapPolygonSeries",
				"settings": {
					"geoJSON": "am5geodata_worldLow",
					"exclude": ["AQ"]
				},
				"properties": {
					"mapPolygons": {
						"properties": {
							"template": {
								"settings": { "tooltipText": "{name}" }
							}
						}
					}
				}
			}
		}
	]
};
