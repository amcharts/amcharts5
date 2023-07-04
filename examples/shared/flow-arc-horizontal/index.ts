import * as am5 from "@amcharts/amcharts5";
import * as am5flow from "@amcharts/amcharts5/flow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";



// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
var root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Create series
// https://www.amcharts.com/docs/v5/charts/flow-charts/arc-diagram/
var series = root.container.children.push(am5flow.ArcDiagram.new(root, {
  sourceIdField: "from",
  targetIdField: "to",
  valueField: "value",
  orientation: "horizontal"
}));


// Configure labels
// https://www.amcharts.com/docs/v5/charts/flow-charts/arc-diagram/#Labels
series.nodes.labels.template.setAll({
  fontSize: "0.85em",
  paddingLeft: 20,
  paddingRight: 20
});

// Selectively position/rotate labels if they fit within node circle
series.nodes.labels.template.adapters.add("x", (x, target) => {
  var dataItem = target.dataItem;
  if (dataItem) {
    if (dataItem.get("circle").get("radius") > 30) {
      target.set("centerX", am5.p50);
      target.set("rotation", 0);
    }
    else {
      target.set("centerX", 0);
      target.set("rotation", 90);
    }
  }
  return x;
});


// Set data
// https://www.amcharts.com/docs/v5/charts/flow-charts/#Setting_data
series.data.setAll([
  { "from": "Monica", "to": "Rachel", "value": 4 },
  { "from": "Monica", "to": "Chandler", "value": 63 },
  { "from": "Monica", "to": "Ross", "value": 16 },
  { "from": "Monica", "to": "Joey", "value": 9 },
  { "from": "Monica", "to": "Phoebe", "value": 3 },
  { "from": "Monica", "to": "Paul the wine guy", "value": 1 },
  { "from": "Monica", "to": "Mr Geller", "value": 6 },
  { "from": "Monica", "to": "Mrs Geller", "value": 5 },
  { "from": "Monica", "to": "Pete", "value": 10 },
  { "from": "Monica", "to": "Chip", "value": 1 },
  { "from": "Monica", "to": "Timothy (Burke)", "value": 1 },
  { "from": "Monica", "to": "Emily", "value": 1 },
  { "from": "Monica", "to": "Dr. Roger", "value": 3 },
  { "from": "Rachel", "to": "Chandler", "value": 7 },
  { "from": "Rachel", "to": "Ross", "value": 80 },
  { "from": "Rachel", "to": "Joey", "value": 30 },
  { "from": "Rachel", "to": "Phoebe", "value": 6 },
  { "from": "Rachel", "to": "Tag", "value": 4 },
  { "from": "Rachel", "to": "Melissa", "value": 1 },
  { "from": "Rachel", "to": "Gavin", "value": 2 },
  { "from": "Chandler", "to": "Joey", "value": 1 },
  { "from": "Chandler", "to": "Phoebe", "value": 7 },
  { "from": "Chandler", "to": "Janice", "value": 11 },
  { "from": "Chandler", "to": "Joanna", "value": 5 },
  { "from": "Chandler", "to": "Kathy", "value": 7 },
  { "from": "Chandler", "to": "Mr Bing", "value": 1 },
  { "from": "Ross", "to": "Joey", "value": 3 },
  { "from": "Ross", "to": "Phoebe", "value": 18 },
  { "from": "Ross", "to": "Carol", "value": 10 },
  { "from": "Ross", "to": "Mrs Geller", "value": 8 },
  { "from": "Ross", "to": "Ben", "value": 6 },
  { "from": "Ross", "to": "Emily", "value": 12 },
  { "from": "Ross", "to": "Jill", "value": 1 },
  { "from": "Ross", "to": "Elizabeth", "value": 8 },
  { "from": "Ross", "to": "Aunt Millie", "value": 2 },
  { "from": "Ross", "to": "Mona", "value": 11 },
  { "from": "Ross", "to": "Emma", "value": 7 },
  { "from": "Ross", "to": "Charlie", "value": 10 },
  { "from": "Joey", "to": "Phoebe", "value": 6 },
  { "from": "Joey", "to": "Janine", "value": 9 },
  { "from": "Joey", "to": "Erin", "value": 1 },
  { "from": "Joey", "to": "Cecilia", "value": 3 },
  { "from": "Joey", "to": "Charlie", "value": 3 },
  { "from": "Phoebe", "to": "David", "value": 14 },
  { "from": "Phoebe", "to": "Roger", "value": 1 },
  { "from": "Phoebe", "to": "Duncan", "value": 1 },
  { "from": "Phoebe", "to": "Rob Dohnen", "value": 2 },
  { "from": "Phoebe", "to": "Sergei", "value": 1 },
  { "from": "Phoebe", "to": "Vince", "value": 2 },
  { "from": "Phoebe", "to": "Mike", "value": 18 },
  { "from": "Carol", "to": "Ben", "value": 1 },
  { "from": "Carol", "to": "Susan", "value": 1 },
  { "from": "Mr Geller", "to": "Mrs Geller", "value": 3 },
  { "from": "Frank", "to": "Alice", "value": 5 }
]);



// Make stuff animate on load
series.appear(1000, 100);