import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
let root = am5.Root.new("chartdiv");


// Create custom theme...
const myTheme = am5.Theme.new(root);

// ... no stroke and fill on zero level
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth0"]).setAll({
  strokeOpacity: 0,
  fillOpacity: 0
});

// ... thick stroke and full opacity on first level
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth1"]).setAll({
  strokeWidth: 5,
  fillOpacity: 1,
  stroke: am5.color(0x000000)
});

// ... no fill and thin stroke on second level
myTheme.rule("Polygon", ["hierarchy", "node", "shape", "depth2"]).setAll({
  fillOpacity: 0,
  strokeWidth: 1,
  stroke: am5.color(0x000000)
});

//  ... by default last lever is not clickable, but we change it here, so, add pointer on the last level
myTheme.rule("HierarchyNode", ["last"]).setAll({
  cursorOverStyle: "pointer"
});

// ... set global settings for all labels
myTheme.rule("Label", ["node"]).setAll({
  fontSize: 11,
  minScale: 0.7
});

// ... hide label of zero level
myTheme.rule("Label", ["node", "depth0"]).setAll({
  forceHidden: true
});

// ... hide label of first level
myTheme.rule("Label", ["node", "depth1"]).setAll({
  forceHidden: true
});


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root),
  myTheme
]);


// Prepare data
var data = {
  "children": [
    {
      "name": "Africa",
      "children": [
        {
          "id": "DZ",
          "name": "Algeria",
          "population": 40400000
        },
        {
          "id": "AO",
          "name": "Angola",
          "population": 25868000
        },
        {
          "id": "BJ",
          "name": "Benin",
          "population": 10653654
        },
        {
          "id": "BW",
          "name": "Botswana",
          "population": 2141206
        },
        {
          "id": "BF",
          "name": "Burkina Faso",
          "population": 19034397
        },
        {
          "id": "BI",
          "name": "Burundi",
          "population": 10114505
        },
        {
          "id": "CV",
          "name": "Cabo Verde",
          "population": 531239
        },
        {
          "id": "CM",
          "name": "Cameroon",
          "population": 22709892
        },
        {
          "id": "CF",
          "name": "Central African Republic",
          "population": 4998000
        },
        {
          "id": "TD",
          "name": "Chad",
          "population": 14497000
        },
        {
          "id": "KM",
          "name": "Comoros",
          "population": 806153
        },
        {
          "id": "CG",
          "name": "Congo (Brazzaville)",
          "population": 4741000
        },
        {
          "id": "CD",
          "name": "Congo (Kinshasa)",
          "population": 85026000
        },
        {
          "id": "DJ",
          "name": "Djibouti",
          "population": 900000
        },
        {
          "id": "EG",
          "name": "Egypt",
          "population": 91251890
        },
        {
          "id": "GQ",
          "name": "Equatorial Guinea",
          "population": 1222442
        },
        {
          "id": "ER",
          "name": "Eritrea",
          "population": 4474690
        },
        {
          "id": "SZ",
          "name": "Eswatini",
          "population": 1136191
        },
        {
          "id": "ET",
          "name": "Ethiopia",
          "population": 102403196
        },
        {
          "id": "GA",
          "name": "Gabon",
          "population": 1802278
        },
        {
          "id": "GM",
          "name": "Gambia",
          "population": 1882450
        },
        {
          "id": "GH",
          "name": "Ghana",
          "population": 27670174
        },
        {
          "id": "GN",
          "name": "Guinea",
          "population": 12947000
        },
        {
          "id": "GW",
          "name": "Guinea-Bissau",
          "population": 1547777
        },
        {
          "id": "KE",
          "name": "Kenya",
          "population": 47251000
        },
        {
          "id": "LS",
          "name": "Lesotho",
          "population": 2263010
        },
        {
          "id": "LR",
          "name": "Liberia",
          "population": 4615000
        },
        {
          "id": "LY",
          "name": "Libya",
          "population": 6385000
        },
        {
          "id": "MG",
          "name": "Madagascar",
          "population": 22434363
        },
        {
          "id": "MW",
          "name": "Malawi",
          "population": 18622104
        },
        {
          "id": "ML",
          "name": "Mali",
          "population": 17994837
        },
        {
          "id": "MR",
          "name": "Mauritania",
          "population": 4420184
        },
        {
          "id": "MU",
          "name": "Mauritius",
          "population": 1262879
        },
        {
          "id": "MA",
          "name": "Morocco",
          "population": 34224455
        },
        {
          "id": "MZ",
          "name": "Mozambique",
          "population": 28829476
        },
        {
          "id": "NA",
          "name": "Namibia",
          "population": 2324004
        },
        {
          "id": "NE",
          "name": "Niger",
          "population": 21477348
        },
        {
          "id": "NG",
          "name": "Nigeria",
          "population": 186988000
        },
        {
          "id": "RW",
          "name": "Rwanda",
          "population": 11553188
        },
        {
          "id": "ST",
          "name": "São Tomé and Príncipe",
          "population": 187356
        },
        {
          "id": "SN",
          "name": "Senegal",
          "population": 14799859
        },
        {
          "id": "SC",
          "name": "Seychelles",
          "population": 91400
        },
        {
          "id": "SL",
          "name": "Sierra Leone",
          "population": 7075641
        },
        {
          "id": "SO",
          "name": "Somalia",
          "population": 11079000
        },
        {
          "id": "ZA",
          "name": "South Africa",
          "population": 55653654
        },
        {
          "id": "SS",
          "name": "South Sudan",
          "population": 12131000
        },
        {
          "id": "SD",
          "name": "Sudan",
          "population": 39598700
        },
        {
          "id": "TZ",
          "name": "Tanzania",
          "population": 55155000
        },
        {
          "id": "TG",
          "name": "Togo",
          "population": 7606374
        },
        {
          "id": "TN",
          "name": "Tunisia",
          "population": 11154400
        },
        {
          "id": "UG",
          "name": "Uganda",
          "population": 39570125
        },
        {
          "id": "EH",
          "name": "Western Sahara",
          "population": 510713
        },
        {
          "id": "ZM",
          "name": "Zambia",
          "population": 15933883
        },
        {
          "id": "ZW",
          "name": "Zimbabwe",
          "population": 14240168
        }
      ]
    },
    {
      "name": "Asia",
      "children": [
        {
          "id": "AF",
          "name": "Afghanistan",
          "population": 27657145
        },
        {
          "id": "AM",
          "name": "Armenia",
          "population": 2994400
        },
        {
          "id": "AZ",
          "name": "Azerbaijan",
          "population": 9730500
        },
        {
          "id": "BH",
          "name": "Bahrain",
          "population": 1404900
        },
        {
          "id": "BD",
          "name": "Bangladesh",
          "population": 161006790
        },
        {
          "id": "BT",
          "name": "Bhutan",
          "population": 775620
        },
        {
          "id": "BN",
          "name": "Brunei",
          "population": 408786
        },
        {
          "id": "KH",
          "name": "Cambodia",
          "population": 15626444
        },
        {
          "id": "CN",
          "name": "China",
          "population": 1373540000
        },
        {
          "id": "GE",
          "name": "Georgia",
          "population": 3720400
        },
        {
          "id": "IN",
          "name": "India",
          "population": 1324171354
        },
        {
          "id": "ID",
          "name": "Indonesia",
          "population": 261115456
        },
        {
          "id": "IR",
          "name": "Iran",
          "population": 79369900
        },
        {
          "id": "IQ",
          "name": "Iraq",
          "population": 37883543
        },
        {
          "id": "IL",
          "name": "Israel",
          "population": 8547100
        },
        {
          "id": "JP",
          "name": "Japan",
          "population": 126672000
        },
        {
          "id": "JO",
          "name": "Jordan",
          "population": 9531712
        },
        {
          "id": "KZ",
          "name": "Kazakhstan",
          "population": 17753200
        },
        {
          "id": "KW",
          "name": "Kuwait",
          "population": 4137309
        },
        {
          "id": "KG",
          "name": "Kyrgyzstan",
          "population": 6045117
        },
        {
          "id": "LA",
          "name": "Laos",
          "population": 6492400
        },
        {
          "id": "LB",
          "name": "Lebanon",
          "population": 6006668
        },
        {
          "id": "MY",
          "name": "Malaysia",
          "population": 31187265
        },
        {
          "id": "MV",
          "name": "Maldives",
          "population": 427756
        },
        {
          "id": "MN",
          "name": "Mongolia",
          "population": 3086918
        },
        {
          "id": "MM",
          "name": "Myanmar",
          "population": 51419420
        },
        {
          "id": "NP",
          "name": "Nepal",
          "population": 28431500
        },
        {
          "id": "KP",
          "name": "North Korea",
          "population": 25000000
        },
        {
          "id": "OM",
          "name": "Oman",
          "population": 4420133
        },
        {
          "id": "PK",
          "name": "Pakistan",
          "population": 193203476
        },
        {
          "id": "PH",
          "name": "Philippines",
          "population": 103320222
        },
        {
          "id": "QA",
          "name": "Qatar",
          "population": 2587564
        },
        {
          "id": "RU",
          "name": "Russia",
          "population": 146599183
        },
        {
          "id": "SA",
          "name": "Saudi Arabia",
          "population": 32248200
        },
        {
          "id": "SG",
          "name": "Singapore",
          "population": 5607000
        },
        {
          "id": "KR",
          "name": "South Korea",
          "population": 50982212
        },
        {
          "id": "LK",
          "name": "Sri Lanka",
          "population": 20950000
        },
        {
          "id": "SY",
          "name": "Syria",
          "population": 18564000
        },
        {
          "id": "TW",
          "name": "Taiwan",
          "population": 23503349
        },
        {
          "id": "TJ",
          "name": "Tajikistan",
          "population": 8593600
        },
        {
          "id": "TH",
          "name": "Thailand",
          "population": 65327652
        },
        {
          "id": "TR",
          "name": "Turkey",
          "population": 78741053
        },
        {
          "id": "TM",
          "name": "Turkmenistan",
          "population": 4751120
        },
        {
          "id": "AE",
          "name": "United Arab Emirates",
          "population": 9856000
        },
        {
          "id": "UZ",
          "name": "Uzbekistan",
          "population": 31910641
        },
        {
          "id": "VN",
          "name": "Vietnam",
          "population": 92700000
        },
        {
          "id": "YE",
          "name": "Yemen",
          "population": 27478000
        }
      ]
    },
    {
      "name": "Europe",
      "children": [
        {
          "id": "AL",
          "name": "Albania",
          "population": 2876591
        },
        {
          "id": "AD",
          "name": "Andorra",
          "population": 78014
        },
        {
          "id": "AT",
          "name": "Austria",
          "population": 8735453
        },
        {
          "id": "BY",
          "name": "Belarus",
          "population": 9500000
        },
        {
          "id": "BE",
          "name": "Belgium",
          "population": 11319511
        },
        {
          "id": "BA",
          "name": "Bosnia and Herzegovina",
          "population": 3531159
        },
        {
          "id": "BG",
          "name": "Bulgaria",
          "population": 7153784
        },
        {
          "id": "HR",
          "name": "Croatia",
          "population": 4190669
        },
        {
          "id": "CY",
          "name": "Cyprus",
          "population": 847000
        },
        {
          "id": "CZ",
          "name": "Czech Republic",
          "population": 10558524
        },
        {
          "id": "DK",
          "name": "Denmark",
          "population": 5717014
        },
        {
          "id": "EE",
          "name": "Estonia",
          "population": 1315819
        },
        {
          "id": "FO",
          "name": "Faroe Islands",
          "population": 49188
        },
        {
          "id": "FI",
          "name": "Finland",
          "population": 5491817
        },
        {
          "id": "FR",
          "name": "France",
          "population": 66710000
        },
        {
          "id": "DE",
          "name": "Germany",
          "population": 82667685
        },
        {
          "id": "GI",
          "name": "Gibraltar",
          "population": 33140
        },
        {
          "id": "GR",
          "name": "Greece",
          "population": 10858018
        },
        {
          "id": "GG",
          "name": "Guernsey",
          "population": 62999
        },
        {
          "id": "HU",
          "name": "Hungary",
          "population": 9823000
        },
        {
          "id": "IS",
          "name": "Iceland",
          "population": 334300
        },
        {
          "id": "IE",
          "name": "Ireland",
          "population": 6378000
        },
        {
          "id": "IM",
          "name": "Isle of Man",
          "population": 84497
        },
        {
          "id": "IT",
          "name": "Italy",
          "population": 60665551
        },
        {
          "id": "JE",
          "name": "Jersey",
          "population": 100800
        },
        {
          "id": "LV",
          "name": "Latvia",
          "population": 1961600
        },
        {
          "id": "LI",
          "name": "Liechtenstein",
          "population": 37623
        },
        {
          "id": "LT",
          "name": "Lithuania",
          "population": 2932367
        },
        {
          "id": "LU",
          "name": "Luxembourg",
          "population": 576200
        },
        {
          "id": "MK",
          "name": "Macedonia",
          "population": 2058539
        },
        {
          "id": "MT",
          "name": "Malta",
          "population": 429344
        },
        {
          "id": "MD",
          "name": "Moldova",
          "population": 3553100
        },
        {
          "id": "MC",
          "name": "Monaco",
          "population": 38400
        },
        {
          "id": "ME",
          "name": "Montenegro",
          "population": 621810
        },
        {
          "id": "NL",
          "name": "Netherlands",
          "population": 17019800
        },
        {
          "id": "NO",
          "name": "Norway",
          "population": 5223256
        },
        {
          "id": "PL",
          "name": "Poland",
          "population": 38437239
        },
        {
          "id": "PT",
          "name": "Portugal",
          "population": 10374822
        },
        {
          "id": "RO",
          "name": "Romania",
          "population": 19861408
        },
        {
          "id": "RU",
          "name": "Russia",
          "population": 146599183
        },
        {
          "id": "SM",
          "name": "San Marino",
          "population": 33005
        },
        {
          "id": "RS",
          "name": "Serbia",
          "population": 7076372
        },
        {
          "id": "SK",
          "name": "Slovakia",
          "population": 5426252
        },
        {
          "id": "SI",
          "name": "Slovenia",
          "population": 2064188
        },
        {
          "id": "ES",
          "name": "Spain",
          "population": 46438422
        },
        {
          "id": "SJ",
          "name": "Svalbard and Jan Mayen",
          "population": 3200
        },
        {
          "id": "SE",
          "name": "Sweden",
          "population": 9851017
        },
        {
          "id": "CH",
          "name": "Switzerland",
          "population": 8372098
        },
        {
          "id": "UA",
          "name": "Ukraine",
          "population": 42692393
        },
        {
          "id": "GB",
          "name": "United Kingdom",
          "population": 65110000
        },
        {
          "id": "VA",
          "name": "Vatican City",
          "population": 451
        }
      ]
    },
    {
      "name": "North America",
      "children": [
        {
          "id": "AI",
          "name": "Anguilla",
          "population": 13452
        },
        {
          "id": "AG",
          "name": "Antigua and Barbuda",
          "population": 86295
        },
        {
          "id": "BS",
          "name": "Bahamas",
          "population": 378040
        },
        {
          "id": "BB",
          "name": "Barbados",
          "population": 285000
        },
        {
          "id": "BZ",
          "name": "Belize",
          "population": 360346
        },
        {
          "id": "BM",
          "name": "Bermuda",
          "population": 61954
        },
        {
          "id": "CA",
          "name": "Canada",
          "population": 36155487
        },
        {
          "id": "KY",
          "name": "Cayman Islands",
          "population": 58238
        },
        {
          "id": "CR",
          "name": "Costa Rica",
          "population": 4999441
        },
        {
          "id": "CU",
          "name": "Cuba",
          "population": 11239004
        },
        {
          "id": "DM",
          "name": "Dominica",
          "population": 71293
        },
        {
          "id": "DO",
          "name": "Dominican Republic",
          "population": 10075045
        },
        {
          "id": "SV",
          "name": "El Salvador",
          "population": 6520675
        },
        {
          "id": "GL",
          "name": "Greenland",
          "population": 55877
        },
        {
          "id": "GD",
          "name": "Grenada",
          "population": 103328
        },
        {
          "id": "GT",
          "name": "Guatemala",
          "population": 16176133
        },
        {
          "id": "HT",
          "name": "Haiti",
          "population": 11078033
        },
        {
          "id": "HN",
          "name": "Honduras",
          "population": 8576532
        },
        {
          "id": "JM",
          "name": "Jamaica",
          "population": 2723246
        },
        {
          "id": "MX",
          "name": "Mexico",
          "population": 122273473
        },
        {
          "id": "MS",
          "name": "Montserrat",
          "population": 4922
        },
        {
          "id": "NI",
          "name": "Nicaragua",
          "population": 6262703
        },
        {
          "id": "PA",
          "name": "Panama",
          "population": 3814672
        },
        {
          "id": "PR",
          "name": "Puerto Rico",
          "population": 3474182
        },
        {
          "id": "KN",
          "name": "Saint Kitts and Nevis",
          "population": 46204
        },
        {
          "id": "LC",
          "name": "Saint Lucia",
          "population": 186000
        },
        {
          "id": "PM",
          "name": "Saint Pierre and Miquelon",
          "population": 6069
        },
        {
          "id": "VC",
          "name": "Saint Vincent and the Grenadines",
          "population": 109991
        },
        {
          "id": "TT",
          "name": "Trinidad and Tobago",
          "population": 1228691
        },
        {
          "id": "TC",
          "name": "Turks and Caicos Islands",
          "population": 31458
        },
        {
          "id": "US",
          "name": "United States",
          "population": 326766748
        },
        {
          "id": "VI",
          "name": "U.S. Virgin Islands",
          "population": 106235
        }
      ]
    },
    {
      "name": "South America",
      "children": [
        {
          "id": "AR",
          "name": "Argentina",
          "population": 43847430
        },
        {
          "id": "BO",
          "name": "Bolivia",
          "population": 11051600
        },
        {
          "id": "BR",
          "name": "Brazil",
          "population": 209288278
        },
        {
          "id": "CL",
          "name": "Chile",
          "population": 18191900
        },
        {
          "id": "CO",
          "name": "Colombia",
          "population": 49065615
        },
        {
          "id": "EC",
          "name": "Ecuador",
          "population": 16624858
        },
        {
          "id": "FK",
          "name": "Falkland Islands",
          "population": 2563
        },
        {
          "id": "GF",
          "name": "French Guiana",
          "population": 269352
        },
        {
          "id": "GY",
          "name": "Guyana",
          "population": 777859
        },
        {
          "id": "PY",
          "name": "Paraguay",
          "population": 6811297
        },
        {
          "id": "PE",
          "name": "Peru",
          "population": 32165485
        },
        {
          "id": "SR",
          "name": "Suriname",
          "population": 542975
        },
        {
          "id": "UY",
          "name": "Uruguay",
          "population": 3456750
        },
        {
          "id": "VE",
          "name": "Venezuela",
          "population": 31977065
        }
      ]
    },
    {
      "name": "Oceania",
      "children": [
        {
          "id": "AS",
          "name": "American Samoa",
          "population": 55641
        },
        {
          "id": "AU",
          "name": "Australia",
          "population": 24450561
        },
        {
          "id": "CK",
          "name": "Cook Islands",
          "population": 17380
        },
        {
          "id": "FJ",
          "name": "Fiji",
          "population": 905502
        },
        {
          "id": "PF",
          "name": "French Polynesia",
          "population": 271800
        },
        {
          "id": "GU",
          "name": "Guam",
          "population": 168564
        },
        {
          "id": "KI",
          "name": "Kiribati",
          "population": 113400
        },
        {
          "id": "MH",
          "name": "Marshall Islands",
          "population": 53127
        },
        {
          "id": "FM",
          "name": "Micronesia",
          "population": 105544
        },
        {
          "id": "NR",
          "name": "Nauru",
          "population": 10084
        },
        {
          "id": "NC",
          "name": "New Caledonia",
          "population": 268767
        },
        {
          "id": "NZ",
          "name": "New Zealand",
          "population": 4693200
        },
        {
          "id": "NU",
          "name": "Niue",
          "population": 1618
        },
        {
          "id": "NF",
          "name": "Norfolk Island",
          "population": 2302
        },
        {
          "id": "MP",
          "name": "Northern Mariana Islands",
          "population": 56940
        },
        {
          "id": "PW",
          "name": "Palau",
          "population": 21729
        },
        {
          "id": "PG",
          "name": "Papua New Guinea",
          "population": 8251162
        },
        {
          "id": "PN",
          "name": "Pitcairn Islands",
          "population": 56
        },
        {
          "id": "WS",
          "name": "Samoa",
          "population": 196440
        },
        {
          "id": "SB",
          "name": "Solomon Islands",
          "population": 611343
        },
        {
          "id": "TK",
          "name": "Tokelau",
          "population": 1411
        },
        {
          "id": "TO",
          "name": "Tonga",
          "population": 108020
        },
        {
          "id": "TV",
          "name": "Tuvalu",
          "population": 11323
        },
        {
          "id": "VU",
          "name": "Vanuatu",
          "population": 276244
        },
        {
          "id": "WF",
          "name": "Wallis and Futuna",
          "population": 11750
        }
      ]
    }
  ]
}

// Group small countries into Others
am5.array.each(data.children, (continent) => {
  var others = {
    name: "Others",
    id: "Others",
    population: 0
  };

  for (var i = continent.children.length - 1; i >= 0; i--) {
    var country = continent.children[i];
    if (country.population < 5000000) {
      others.population += country.population
      am5.array.remove(continent.children, country);
    }
  }
  continent.children.push(others);
});


// Create series
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Adding
var series = root.container.children.push(am5hierarchy.VoronoiTreemap.new(root, {
  paddingLeft: 5,
  paddingRight: 5,
  paddingTop: 5,
  paddingBottom: 5,
  singleBranchOnly: true,
  downDepth: 2,
  upDepth: 0,
  initialDepth: 2,
  valueField: "population",
  categoryField: "name",
  childDataField: "children",
  idField: "name",
  type: "polygon",
  cornerCount: 120
}));

// Show full name if polygon is big and only the id if its small
series.labels.template.adapters.add("x", (x, target) => {
  var dataItem = target.dataItem as am5.DataItem<am5hierarchy.IVoronoiTreemapDataItem>;
  if (dataItem) {
    var polygon = dataItem.get("polygon");
    if (polygon) {
      var minX = polygon.getPrivate("minX", 0);
      var maxX = polygon.getPrivate("maxX", 0);
      var dataContext = dataItem.dataContext as any;

      if (dataContext) {
        if (maxX - minX < 50) {
          target.set("text", dataContext.id);
        }
        else {
          target.set("text", dataContext.name);
        }
      }
    }
  }
  return x;
});

// WQhen last level node is clicked, zoom to parent
series.nodes.template.events.on("click", (e) => {
  var dataItem = e.target.dataItem as am5.DataItem<am5hierarchy.IVoronoiTreemapDataItem>;
  if (dataItem) {
    if (!dataItem.get("children")) {
      series.selectDataItem(dataItem.get("parent"));
    }
  }
});


// Set data
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Setting_data
series.data.setAll([data]);


// Select root node
// https://www.amcharts.com/docs/v5/charts/hierarchy/#Pre_selected_branch
series.set("selectedDataItem", series.dataItems[0]);


// Make stuff animate on load
series.appear(1000, 100);