import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const root = am5.Root.new("chartdiv");

root.setThemes([
  am5themes_Animated.new(root)
]);

const maxLevels = 2;
const maxNodes = 6;
const maxValue = 100;

const data = {
  name: "Root",
  children: []
}
generateLevel(data, "", 0);

const container = root.container.children.push(
  am5.Container.new(root, {
    width: am5.percent(100),
    height: am5.percent(100),
    layout: root.verticalLayout
  })
);

const series = container.children.push(
  am5hierarchy.Treemap.new(root, {
    singleBranchOnly: false,
    downDepth: 1,
    upDepth: 1,
    initialDepth: 1,
    valueField: "value",
    categoryField: "name",
    childDataField: "children"
  })
);

series.data.setAll([data]);
series.set("selectedDataItem", series.dataItems[0]);

container.children.moveValue(
  am5hierarchy.BreadcrumbBar.new(root, {
    series: series
  }), 0
);

function generateLevel(data: any, name: string, level: number) {
  for (let i = 0; i < Math.ceil(maxNodes * Math.random()) + 1; i++) {
    let nodeName = name + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i];
    let child;
    if (level < maxLevels) {
      child = {
        name: nodeName + level
      }

      if (level > 0 && Math.random() < 0.5) {
        child.value = Math.round(Math.random() * maxValue);
      }
      else {
        child.children = [];
        generateLevel(child, nodeName + i, level + 1)
      }
    }
    else {
      child = {
        name: name + i,
        value: Math.round(Math.random() * maxValue)
      }
    }
    data.children.push(child);
  }

  level++;
  return data;
}