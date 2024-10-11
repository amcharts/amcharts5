import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create the map chart
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX",
  panY: "rotateY",
  projection: am5map.geoOrthographic()
}));


// Create series for background fill
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
const backgroundSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {})
);
backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0.1,
  strokeOpacity: 0
});
backgroundSeries.data.push({
  geometry:
    am5map.getGeoRectangle(90, 180, -90, -180)
});


// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow as any
}));
polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0.15,
  strokeWidth: 0.5,
  stroke: root.interfaceColors.get("background")
});


// Create polygon series for projected circles
const circleSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
circleSeries.mapPolygons.template.setAll({
  templateField: "polygonTemplate",
  tooltipText: "{name}: {value}"
});

// Define data
const colors = am5.ColorSet.new(root, {});

const data = [
  { "id": "AF", "name": "Afghanistan", "value": 32358260, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "AL", "name": "Albania", "value": 3215988, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "DZ", "name": "Algeria", "value": 35980193, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "AO", "name": "Angola", "value": 19618432, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "AR", "name": "Argentina", "value": 40764561, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "AM", "name": "Armenia", "value": 3100236, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "AU", "name": "Australia", "value": 22605732, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "AT", "name": "Austria", "value": 8413429, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "AZ", "name": "Azerbaijan", "value": 9306023, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "BH", "name": "Bahrain", "value": 1323535, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "BD", "name": "Bangladesh", "value": 150493658, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "BY", "name": "Belarus", "value": 9559441, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "BE", "name": "Belgium", "value": 10754056, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "BJ", "name": "Benin", "value": 9099922, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "BT", "name": "Bhutan", "value": 738267, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "BO", "name": "Bolivia", "value": 10088108, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "BA", "name": "Bosnia and Herzegovina", "value": 3752228, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "BW", "name": "Botswana", "value": 2030738, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "BR", "name": "Brazil", "value": 196655014, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "BN", "name": "Brunei", "value": 405938, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "BG", "name": "Bulgaria", "value": 7446135, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "BF", "name": "Burkina Faso", "value": 16967845, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "BI", "name": "Burundi", "value": 8575172, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "KH", "name": "Cambodia", "value": 14305183, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "CM", "name": "Cameroon", "value": 20030362, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CA", "name": "Canada", "value": 34349561, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "CV", "name": "Cape Verde", "value": 500585, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CF", "name": "Central African Rep.", "value": 4486837, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "TD", "name": "Chad", "value": 11525496, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CL", "name": "Chile", "value": 17269525, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "CN", "name": "China", "value": 1347565324, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "CO", "name": "Colombia", "value": 46927125, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "KM", "name": "Comoros", "value": 753943, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CD", "name": "Congo, Dem. Rep.", "value": 67757577, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CG", "name": "Congo, Rep.", "value": 4139748, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "CR", "name": "Costa Rica", "value": 4726575, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "CI", "name": "Cote d'Ivoire", "value": 20152894, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "HR", "name": "Croatia", "value": 4395560, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "CU", "name": "Cuba", "value": 11253665, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "CY", "name": "Cyprus", "value": 1116564, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "CZ", "name": "Czech Rep.", "value": 10534293, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "DK", "name": "Denmark", "value": 5572594, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "DJ", "name": "Djibouti", "value": 905564, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "DO", "name": "Dominican Rep.", "value": 10056181, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "EC", "name": "Ecuador", "value": 14666055, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "EG", "name": "Egypt", "value": 82536770, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "SV", "name": "El Salvador", "value": 6227491, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "GQ", "name": "Equatorial Guinea", "value": 720213, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "ER", "name": "Eritrea", "value": 5415280, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "EE", "name": "Estonia", "value": 1340537, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "ET", "name": "Ethiopia", "value": 84734262, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "FJ", "name": "Fiji", "value": 868406, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "FI", "name": "Finland", "value": 5384770, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "FR", "name": "France", "value": 63125894, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "GA", "name": "Gabon", "value": 1534262, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "GM", "name": "Gambia", "value": 1776103, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "GE", "name": "Georgia", "value": 4329026, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "DE", "name": "Germany", "value": 82162512, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "GH", "name": "Ghana", "value": 24965816, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "GR", "name": "Greece", "value": 11390031, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "GT", "name": "Guatemala", "value": 14757316, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "GN", "name": "Guinea", "value": 10221808, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "GW", "name": "Guinea-Bissau", "value": 1547061, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "GY", "name": "Guyana", "value": 756040, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "HT", "name": "Haiti", "value": 10123787, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "HN", "name": "Honduras", "value": 7754687, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "HK", "name": "Hong Kong, China", "value": 7122187, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "HU", "name": "Hungary", "value": 9966116, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "IS", "name": "Iceland", "value": 324366, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "IN", "name": "India", "value": 1241491960, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "ID", "name": "Indonesia", "value": 242325638, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "IR", "name": "Iran", "value": 74798599, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "IQ", "name": "Iraq", "value": 32664942, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "IE", "name": "Ireland", "value": 4525802, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "IL", "name": "Israel", "value": 7562194, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "IT", "name": "Italy", "value": 60788694, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "JM", "name": "Jamaica", "value": 2751273, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "JP", "name": "Japan", "value": 126497241, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "JO", "name": "Jordan", "value": 6330169, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "KZ", "name": "Kazakhstan", "value": 16206750, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "KE", "name": "Kenya", "value": 41609728, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "KP", "name": "Korea, Dem. Rep.", "value": 24451285, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "KR", "name": "Korea, Rep.", "value": 48391343, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "KW", "name": "Kuwait", "value": 2818042, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "KG", "name": "Kyrgyzstan", "value": 5392580, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "LA", "name": "Laos", "value": 6288037, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "LV", "name": "Latvia", "value": 2243142, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "LB", "name": "Lebanon", "value": 4259405, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "LS", "name": "Lesotho", "value": 2193843, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "LR", "name": "Liberia", "value": 4128572, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "LY", "name": "Libya", "value": 6422772, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "LT", "name": "Lithuania", "value": 3307481, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "LU", "name": "Luxembourg", "value": 515941, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "MK", "name": "Macedonia, FYR", "value": 2063893, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "MG", "name": "Madagascar", "value": 21315135, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MW", "name": "Malawi", "value": 15380888, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MY", "name": "Malaysia", "value": 28859154, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "ML", "name": "Mali", "value": 15839538, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MR", "name": "Mauritania", "value": 3541540, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MU", "name": "Mauritius", "value": 1306593, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MX", "name": "Mexico", "value": 114793341, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "MD", "name": "Moldova", "value": 3544864, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "MN", "name": "Mongolia", "value": 2800114, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "ME", "name": "Montenegro", "value": 632261, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "MA", "name": "Morocco", "value": 32272974, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MZ", "name": "Mozambique", "value": 23929708, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "MM", "name": "Myanmar", "value": 48336763, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "NA", "name": "Namibia", "value": 2324004, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "NP", "name": "Nepal", "value": 30485798, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "NL", "name": "Netherlands", "value": 16664746, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "NZ", "name": "New Zealand", "value": 4414509, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "NI", "name": "Nicaragua", "value": 5869859, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "NE", "name": "Niger", "value": 16068994, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "NG", "name": "Nigeria", "value": 162470737, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "NO", "name": "Norway", "value": 4924848, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "OM", "name": "Oman", "value": 2846145, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "PK", "name": "Pakistan", "value": 176745364, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "PA", "name": "Panama", "value": 3571185, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "PG", "name": "Papua New Guinea", "value": 7013829, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "PY", "name": "Paraguay", "value": 6568290, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "PE", "name": "Peru", "value": 29399817, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "PH", "name": "Philippines", "value": 94852030, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "PL", "name": "Poland", "value": 38298949, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "PT", "name": "Portugal", "value": 10689663, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "PR", "name": "Puerto Rico", "value": 3745526, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "QA", "name": "Qatar", "value": 1870041, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "RO", "name": "Romania", "value": 21436495, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "RU", "name": "Russia", "value": 142835555, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "RW", "name": "Rwanda", "value": 10942950, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "SA", "name": "Saudi Arabia", "value": 28082541, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "SN", "name": "Senegal", "value": 12767556, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "RS", "name": "Serbia", "value": 9853969, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "SL", "name": "Sierra Leone", "value": 5997486, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "SG", "name": "Singapore", "value": 5187933, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "SK", "name": "Slovak Republic", "value": 5471502, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "SI", "name": "Slovenia", "value": 2035012, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "SB", "name": "Solomon Islands", "value": 552267, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "SO", "name": "Somalia", "value": 9556873, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "ZA", "name": "South Africa", "value": 50459978, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "ES", "name": "Spain", "value": 46454895, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "LK", "name": "Sri Lanka", "value": 21045394, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "SD", "name": "Sudan", "value": 34735288, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "SR", "name": "Suriname", "value": 529419, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "SZ", "name": "Swaziland", "value": 1203330, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "SE", "name": "Sweden", "value": 9440747, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "CH", "name": "Switzerland", "value": 7701690, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "SY", "name": "Syria", "value": 20766037, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "TW", "name": "Taiwan", "value": 23072000, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "TJ", "name": "Tajikistan", "value": 6976958, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "TZ", "name": "Tanzania", "value": 46218486, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "TH", "name": "Thailand", "value": 69518555, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "TG", "name": "Togo", "value": 6154813, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "TT", "name": "Trinidad and Tobago", "value": 1346350, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "TN", "name": "Tunisia", "value": 10594057, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "TR", "name": "Türkiye", "value": 73639596, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "TM", "name": "Turkmenistan", "value": 5105301, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "UG", "name": "Uganda", "value": 34509205, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "UA", "name": "Ukraine", "value": 45190180, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "AE", "name": "United Arab Emirates", "value": 7890924, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "GB", "name": "United Kingdom", "value": 62417431, polygonTemplate: { fill: colors.getIndex(8) } },
  { "id": "US", "name": "United States", "value": 313085380, polygonTemplate: { fill: colors.getIndex(4) } },
  { "id": "UY", "name": "Uruguay", "value": 3380008, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "UZ", "name": "Uzbekistan", "value": 27760267, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "VE", "name": "Venezuela", "value": 29436891, polygonTemplate: { fill: colors.getIndex(3) } },
  { "id": "PS", "name": "West Bank and Gaza", "value": 4152369, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "VN", "name": "Vietnam", "value": 88791996, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "YE", "name": "Yemen, Rep.", "value": 24799880, polygonTemplate: { fill: colors.getIndex(0) } },
  { "id": "ZM", "name": "Zambia", "value": 13474959, polygonTemplate: { fill: colors.getIndex(2) } },
  { "id": "ZW", "name": "Zimbabwe", "value": 12754378, polygonTemplate: { fill: colors.getIndex(2) } }
];

let valueLow = Infinity;
let valueHigh = -Infinity;

for (let i = 0; i < data.length; i++) {
  let value = data[i].value;
  if (value < valueLow) {
    valueLow = value;
  }
  if (value > valueHigh) {
    valueHigh = value;
  }
}

// radius in degrees
const minRadius = 0.5;
const maxRadius = 5;

// Create circles when data for countries is fully loaded.
polygonSeries.events.on("datavalidated", () => {
  circleSeries.data.clear();

  for (let i = 0; i < data.length; i++) {
    const dataContext = data[i];
    const countryDataItem = polygonSeries.getDataItemById(dataContext.id);
    const countryPolygon = countryDataItem.get("mapPolygon");

    const value = dataContext.value;

    const radius = minRadius + maxRadius * (value - valueLow) / (valueHigh - valueLow);

    if (countryPolygon) {
      const geometry = am5map.getGeoCircle(countryPolygon.visualCentroid(), radius);
      circleSeries.data.push({
        name: dataContext.name,
        value: dataContext.value,
        polygonTemplate: dataContext.polygonTemplate,
        geometry: geometry
      });
    }
  }
})


// Make stuff animate on load
chart.appear(1000, 100);
