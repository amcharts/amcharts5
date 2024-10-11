import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

/**
 * ---------------------------------------
 * This demo was created using amCharts 5.
 *
 * For more information visit:
 * https://www.amcharts.com/
 *
 * Documentation is available at:
 * https://www.amcharts.com/docs/v5/
 * ---------------------------------------
 */

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([am5themes_Animated.new(root)]);

// Create the map chart
// https://www.amcharts.com/docs/v5/charts/map-chart/
const chart = root.container.children.push(
  am5map.MapChart.new(root, {
    panX: "rotateX",
    panY: "rotateY",
    projection: am5map.geoMercator()
  })
);

// Create series for background fill
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
backgroundSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0,
  strokeOpacity: 0
});
// Add background polygo
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
backgroundSeries.data.push({
  geometry: am5map.getGeoRectangle(90, 180, -90, -180)
});

// Create main polygon series for countries
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const polygonSeries = chart.series.push(
  am5map.MapPolygonSeries.new(root, {
    geoJSON: am5geodata_worldLow
  })
);

polygonSeries.mapPolygons.template.setAll({
  fill: root.interfaceColors.get("alternativeBackground"),
  fillOpacity: 0.15,
  strokeWidth: 0.5,
  stroke: root.interfaceColors.get("background")
});

// Create polygon series for circles
// https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/
const circleTemplate = am5.Template.new({
  tooltipText: "{name}: {value}"
});

const bubbleSeries = chart.series.push(
  am5map.MapPointSeries.new(root, {
    calculateAggregates: true,
    valueField: "value",
    polygonIdField: "id"
  })
);

bubbleSeries.bullets.push(function () {
  return am5.Bullet.new(root, {
    sprite: am5.Circle.new(
      root,
      {
        radius: 10,
        templateField: "circleTemplate"
      },
      circleTemplate
    )
  });
});

bubbleSeries.set("heatRules", [
  {
    target: circleTemplate,
    min: 3,
    max: 30,
    key: "radius",
    dataField: "value"
  }
]);

const colors = am5.ColorSet.new(root, {});

bubbleSeries.data.setAll([
  {
    id: "AF",
    name: "Afghanistan",
    value: 32358260,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "AL",
    name: "Albania",
    value: 3215988,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "DZ",
    name: "Algeria",
    value: 35980193,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "AO",
    name: "Angola",
    value: 19618432,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "AR",
    name: "Argentina",
    value: 40764561,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "AM",
    name: "Armenia",
    value: 3100236,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "AU",
    name: "Australia",
    value: 22605732,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "AT",
    name: "Austria",
    value: 8413429,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "AZ",
    name: "Azerbaijan",
    value: 9306023,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "BH",
    name: "Bahrain",
    value: 1323535,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "BD",
    name: "Bangladesh",
    value: 150493658,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "BY",
    name: "Belarus",
    value: 9559441,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "BE",
    name: "Belgium",
    value: 10754056,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "BJ",
    name: "Benin",
    value: 9099922,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "BT",
    name: "Bhutan",
    value: 738267,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "BO",
    name: "Bolivia",
    value: 10088108,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "BA",
    name: "Bosnia and Herzegovina",
    value: 3752228,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "BW",
    name: "Botswana",
    value: 2030738,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "BR",
    name: "Brazil",
    value: 196655014,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "BN",
    name: "Brunei",
    value: 405938,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "BG",
    name: "Bulgaria",
    value: 7446135,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "BF",
    name: "Burkina Faso",
    value: 16967845,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "BI",
    name: "Burundi",
    value: 8575172,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "KH",
    name: "Cambodia",
    value: 14305183,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "CM",
    name: "Cameroon",
    value: 20030362,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CA",
    name: "Canada",
    value: 34349561,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "CV",
    name: "Cape Verde",
    value: 500585,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CF",
    name: "Central African Rep.",
    value: 4486837,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "TD",
    name: "Chad",
    value: 11525496,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CL",
    name: "Chile",
    value: 17269525,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "CN",
    name: "China",
    value: 1347565324,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "CO",
    name: "Colombia",
    value: 46927125,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "KM",
    name: "Comoros",
    value: 753943,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CD",
    name: "Congo, Dem. Rep.",
    value: 67757577,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CG",
    name: "Congo, Rep.",
    value: 4139748,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "CR",
    name: "Costa Rica",
    value: 4726575,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "CI",
    name: "Cote d'Ivoire",
    value: 20152894,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "HR",
    name: "Croatia",
    value: 4395560,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "CU",
    name: "Cuba",
    value: 11253665,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "CY",
    name: "Cyprus",
    value: 1116564,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "CZ",
    name: "Czech Rep.",
    value: 10534293,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "DK",
    name: "Denmark",
    value: 5572594,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "DJ",
    name: "Djibouti",
    value: 905564,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "DO",
    name: "Dominican Rep.",
    value: 10056181,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "EC",
    name: "Ecuador",
    value: 14666055,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "EG",
    name: "Egypt",
    value: 82536770,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "SV",
    name: "El Salvador",
    value: 6227491,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "GQ",
    name: "Equatorial Guinea",
    value: 720213,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "ER",
    name: "Eritrea",
    value: 5415280,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "EE",
    name: "Estonia",
    value: 1340537,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "ET",
    name: "Ethiopia",
    value: 84734262,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "FJ",
    name: "Fiji",
    value: 868406,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "FI",
    name: "Finland",
    value: 5384770,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "FR",
    name: "France",
    value: 63125894,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "GA",
    name: "Gabon",
    value: 1534262,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "GM",
    name: "Gambia",
    value: 1776103,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "GE",
    name: "Georgia",
    value: 4329026,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "DE",
    name: "Germany",
    value: 82162512,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "GH",
    name: "Ghana",
    value: 24965816,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "GR",
    name: "Greece",
    value: 11390031,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "GT",
    name: "Guatemala",
    value: 14757316,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "GN",
    name: "Guinea",
    value: 10221808,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "GW",
    name: "Guinea-Bissau",
    value: 1547061,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "GY",
    name: "Guyana",
    value: 756040,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "HT",
    name: "Haiti",
    value: 10123787,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "HN",
    name: "Honduras",
    value: 7754687,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "HK",
    name: "Hong Kong, China",
    value: 7122187,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "HU",
    name: "Hungary",
    value: 9966116,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "IS",
    name: "Iceland",
    value: 324366,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "IN",
    name: "India",
    value: 1241491960,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "ID",
    name: "Indonesia",
    value: 242325638,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "IR",
    name: "Iran",
    value: 74798599,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "IQ",
    name: "Iraq",
    value: 32664942,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "IE",
    name: "Ireland",
    value: 4525802,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "IL",
    name: "Israel",
    value: 7562194,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "IT",
    name: "Italy",
    value: 60788694,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "JM",
    name: "Jamaica",
    value: 2751273,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "JP",
    name: "Japan",
    value: 126497241,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "JO",
    name: "Jordan",
    value: 6330169,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "KZ",
    name: "Kazakhstan",
    value: 16206750,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "KE",
    name: "Kenya",
    value: 41609728,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "KP",
    name: "Korea, Dem. Rep.",
    value: 24451285,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "KR",
    name: "Korea, Rep.",
    value: 48391343,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "KW",
    name: "Kuwait",
    value: 2818042,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "KG",
    name: "Kyrgyzstan",
    value: 5392580,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "LA",
    name: "Laos",
    value: 6288037,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "LV",
    name: "Latvia",
    value: 2243142,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "LB",
    name: "Lebanon",
    value: 4259405,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "LS",
    name: "Lesotho",
    value: 2193843,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "LR",
    name: "Liberia",
    value: 4128572,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "LY",
    name: "Libya",
    value: 6422772,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "LT",
    name: "Lithuania",
    value: 3307481,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "LU",
    name: "Luxembourg",
    value: 515941,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "MK",
    name: "Macedonia, FYR",
    value: 2063893,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "MG",
    name: "Madagascar",
    value: 21315135,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MW",
    name: "Malawi",
    value: 15380888,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MY",
    name: "Malaysia",
    value: 28859154,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "ML",
    name: "Mali",
    value: 15839538,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MR",
    name: "Mauritania",
    value: 3541540,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MU",
    name: "Mauritius",
    value: 1306593,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MX",
    name: "Mexico",
    value: 114793341,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "MD",
    name: "Moldova",
    value: 3544864,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "MN",
    name: "Mongolia",
    value: 2800114,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "ME",
    name: "Montenegro",
    value: 632261,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "MA",
    name: "Morocco",
    value: 32272974,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MZ",
    name: "Mozambique",
    value: 23929708,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "MM",
    name: "Myanmar",
    value: 48336763,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "NA",
    name: "Namibia",
    value: 2324004,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "NP",
    name: "Nepal",
    value: 30485798,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "NL",
    name: "Netherlands",
    value: 16664746,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "NZ",
    name: "New Zealand",
    value: 4414509,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "NI",
    name: "Nicaragua",
    value: 5869859,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "NE",
    name: "Niger",
    value: 16068994,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "NG",
    name: "Nigeria",
    value: 162470737,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "NO",
    name: "Norway",
    value: 4924848,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "OM",
    name: "Oman",
    value: 2846145,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "PK",
    name: "Pakistan",
    value: 176745364,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "PA",
    name: "Panama",
    value: 3571185,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "PG",
    name: "Papua New Guinea",
    value: 7013829,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "PY",
    name: "Paraguay",
    value: 6568290,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "PE",
    name: "Peru",
    value: 29399817,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "PH",
    name: "Philippines",
    value: 94852030,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "PL",
    name: "Poland",
    value: 38298949,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "PT",
    name: "Portugal",
    value: 10689663,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "PR",
    name: "Puerto Rico",
    value: 3745526,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "QA",
    name: "Qatar",
    value: 1870041,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "RO",
    name: "Romania",
    value: 21436495,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "RU",
    name: "Russia",
    value: 142835555,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "RW",
    name: "Rwanda",
    value: 10942950,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "SA",
    name: "Saudi Arabia",
    value: 28082541,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "SN",
    name: "Senegal",
    value: 12767556,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "RS",
    name: "Serbia",
    value: 9853969,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "SL",
    name: "Sierra Leone",
    value: 5997486,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "SG",
    name: "Singapore",
    value: 5187933,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "SK",
    name: "Slovak Republic",
    value: 5471502,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "SI",
    name: "Slovenia",
    value: 2035012,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "SB",
    name: "Solomon Islands",
    value: 552267,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "SO",
    name: "Somalia",
    value: 9556873,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "ZA",
    name: "South Africa",
    value: 50459978,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "ES",
    name: "Spain",
    value: 46454895,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "LK",
    name: "Sri Lanka",
    value: 21045394,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "SD",
    name: "Sudan",
    value: 34735288,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "SR",
    name: "Suriname",
    value: 529419,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "SZ",
    name: "Swaziland",
    value: 1203330,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "SE",
    name: "Sweden",
    value: 9440747,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "CH",
    name: "Switzerland",
    value: 7701690,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "SY",
    name: "Syria",
    value: 20766037,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "TW",
    name: "Taiwan",
    value: 23072000,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "TJ",
    name: "Tajikistan",
    value: 6976958,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "TZ",
    name: "Tanzania",
    value: 46218486,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "TH",
    name: "Thailand",
    value: 69518555,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "TG",
    name: "Togo",
    value: 6154813,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "TT",
    name: "Trinidad and Tobago",
    value: 1346350,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "TN",
    name: "Tunisia",
    value: 10594057,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "TR",
    name: "Türkiye",
    value: 73639596,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "TM",
    name: "Turkmenistan",
    value: 5105301,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "UG",
    name: "Uganda",
    value: 34509205,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "UA",
    name: "Ukraine",
    value: 45190180,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "AE",
    name: "United Arab Emirates",
    value: 7890924,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "GB",
    name: "United Kingdom",
    value: 62417431,
    circleTemplate: { fill: colors.getIndex(8) }
  },
  {
    id: "US",
    name: "United States",
    value: 313085380,
    circleTemplate: { fill: colors.getIndex(4) }
  },
  {
    id: "UY",
    name: "Uruguay",
    value: 3380008,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "UZ",
    name: "Uzbekistan",
    value: 27760267,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "VE",
    name: "Venezuela",
    value: 29436891,
    circleTemplate: { fill: colors.getIndex(3) }
  },
  {
    id: "PS",
    name: "West Bank and Gaza",
    value: 4152369,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "VN",
    name: "Vietnam",
    value: 88791996,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "YE",
    name: "Yemen, Rep.",
    value: 24799880,
    circleTemplate: { fill: colors.getIndex(0) }
  },
  {
    id: "ZM",
    name: "Zambia",
    value: 13474959,
    circleTemplate: { fill: colors.getIndex(2) }
  },
  {
    id: "ZW",
    name: "Zimbabwe",
    value: 12754378,
    circleTemplate: { fill: colors.getIndex(2) }
  }
]);

// Add globe/map switch
const cont = chart.children.push(
  am5.Container.new(root, {
    layout: root.horizontalLayout,
    x: 20,
    y: 40
  })
);

cont.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Map"
  })
);

const switchButton = cont.children.push(
  am5.Button.new(root, {
    themeTags: ["switch"],
    centerY: am5.p50,
    icon: am5.Circle.new(root, {
      themeTags: ["icon"]
    })
  })
);

switchButton.on("active", function () {
  if (!switchButton.get("active")) {
    chart.set("projection", am5map.geoMercator());
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0);
  } else {
    chart.set("projection", am5map.geoOrthographic());
    backgroundSeries.mapPolygons.template.set("fillOpacity", 0.1);
  }
});

cont.children.push(
  am5.Label.new(root, {
    centerY: am5.p50,
    text: "Globe"
  })
);

// Make stuff animate on load
chart.appear(1000, 100);
