import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Micro from "@amcharts/amcharts5/themes/Micro";


// Creates a chart in a table cell: a line, or columns if "columns" is set
function createChart(cell: HTMLElement, points: Array<object>, field: string, columns: boolean, color: am5.Color) {

  // Create root element: every chart has its own
  // https://docs.amcharts.com/v5/getting-started/#root-element
  const root = am5.Root.new(cell.appendChild(document.createElement("div")));

  // Set themes: Micro removes padding, axes and grid
  // https://docs.amcharts.com/v5/concepts/themes/
  root.setThemes([
    am5themes_Micro.new(root)
  ]);

  // Create chart
  // https://docs.amcharts.com/v5/charts/xy-chart/
  const chart = root.container.children.push(am5xy.XYChart.new(root, {}));

  // Create axes: a line uses the whole height, columns start at zero
  // https://docs.amcharts.com/v5/charts/xy-chart/axes/
  const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
    baseInterval: { timeUnit: "day", count: 1 }, // one data point per day
    renderer: am5xy.AxisRendererX.new(root, {})
  }));

  const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
    min: columns ? 0 : undefined,
    strictMinMax: !columns,
    renderer: am5xy.AxisRendererY.new(root, {})
  }));

  // Add series
  // https://docs.amcharts.com/v5/charts/xy-chart/series/
  // one set of settings, for either kind of series
  const settings = {
    xAxis: xAxis,
    yAxis: yAxis,
    valueXField: "date",
    valueYField: field,
    stroke: color, // the given color for the line or the column outlines...
    fill: color    // ...and for the column fills
  };

  if (columns) {
    const series = chart.series.push(am5xy.ColumnSeries.new(root, settings));
    series.data.setAll(points);
  }
  else {
    const series = chart.series.push(am5xy.LineSeries.new(root, settings));
    series.strokes.template.set("strokeWidth", 2); // a 2 px line, to stand out at this size
    series.data.setAll(points);
  }
}


// Set data: one row per branch, with a value and a volume for each of 20 days
const data = [
  {
    name: "Amsterdam",
    values: [66, 69, 66, 70, 70, 71, 73, 73, 76, 76, 78, 77, 81, 81, 78, 79, 76, 80, 81, 80],
    volumes: [685, 663, 594, 670, 662, 679, 724, 720, 698, 633, 686, 635, 575, 568, 506, 550, 567, 530, 506, 508]
  },
  {
    name: "Berlin",
    values: [88, 86, 85, 82, 82, 79, 76, 77, 74, 75, 73, 74, 73, 75, 73, 70, 73, 70, 68, 70],
    volumes: [475, 554, 503, 570, 569, 558, 478, 520, 527, 588, 573, 626, 623, 696, 758, 722, 756, 684, 736, 690]
  },
  {
    name: "Copenhagen",
    values: [74, 72, 70, 71, 69, 68, 67, 69, 71, 72, 68, 70, 73, 75, 79, 76, 79, 83, 79, 77],
    volumes: [654, 713, 742, 732, 736, 672, 667, 725, 682, 696, 735, 745, 674, 664, 730, 695, 745, 817, 878, 955]
  },
  {
    name: "Dublin",
    values: [64, 64, 61, 59, 56, 56, 54, 55, 56, 58, 58, 61, 61, 65, 66, 69, 71, 70, 72, 69],
    volumes: [772, 722, 644, 686, 665, 744, 753, 738, 667, 625, 574, 614, 553, 487, 431, 411, 405, 380, 348, 394]
  },
  {
    name: "Lisbon",
    values: [79, 77, 80, 79, 76, 80, 84, 88, 88, 86, 90, 89, 90, 92, 92, 95, 92, 94, 94, 97],
    volumes: [566, 639, 564, 567, 571, 559, 480, 439, 509, 451, 393, 318, 267, 335, 264, 257, 259, 225, 236, 312]
  },
  {
    name: "Madrid",
    values: [78, 78, 79, 75, 72, 74, 72, 74, 69, 71, 73, 76, 79, 78, 77, 78, 77, 74, 72, 74],
    volumes: [424, 474, 511, 536, 465, 474, 533, 543, 528, 594, 560, 480, 438, 498, 521, 577, 539, 520, 554, 539]
  },
  {
    name: "Oslo",
    values: [57, 54, 56, 55, 52, 51, 52, 55, 57, 58, 55, 54, 51, 50, 49, 49, 47, 43, 43, 40],
    volumes: [711, 772, 766, 740, 710, 667, 598, 674, 599, 658, 704, 680, 729, 651, 636, 690, 723, 733, 749, 707]
  },
  {
    name: "Prague",
    values: [71, 69, 71, 74, 78, 80, 80, 82, 80, 79, 76, 75, 72, 75, 75, 78, 80, 81, 79, 81],
    volumes: [744, 704, 760, 802, 744, 778, 730, 800, 798, 783, 755, 829, 796, 792, 808, 758, 794, 719, 788, 729]
  },
  {
    name: "Vienna",
    values: [74, 73, 77, 76, 73, 75, 79, 77, 74, 77, 76, 80, 79, 81, 81, 82, 80, 82, 80, 80],
    volumes: [361, 327, 289, 268, 287, 282, 265, 256, 314, 310, 255, 314, 312, 287, 297, 376, 332, 400, 427, 365]
  },
  {
    name: "Zurich",
    values: [71, 73, 70, 73, 76, 74, 74, 75, 72, 73, 76, 73, 72, 70, 69, 70, 67, 63, 62, 58],
    volumes: [640, 650, 670, 619, 603, 589, 593, 533, 513, 459, 450, 451, 484, 481, 452, 480, 529, 473, 402, 342]
  }
];


// Colors of a rising and a falling line, and of the columns
const positive = am5.color(0x50b300);
const negative = am5.color(0xb30000);
const neutral = am5.color(0x999999);

// A row of the data has one value per day, the first for this day
const firstDay = new Date(2025, 5, 2).getTime();


// Add a row to the table for each row of the data
const table = document.getElementById("rows") as HTMLTableSectionElement;

am5.array.each(data, (item) => {
  // the change from the first day to the last, in percent with one decimal
  const change = Math.round((item.values[item.values.length - 1] / item.values[0] - 1) * 1000) / 10;
  const color = change < 0 ? negative : positive; // red for a fall, green for a rise

  // One point per day, for both charts of the row
  const points = am5.array.map(item.values, (value, index) => {
    return {
      date: firstDay + index * am5.time.getDuration("day"),
      value: value,
      volume: item.volumes[index]
    };
  });

  // the row's cells: the branch name, its change in its color, then the two charts
  const row = table.insertRow();
  row.insertCell().textContent = item.name;

  const changeCell = row.insertCell();
  changeCell.textContent = (change > 0 ? "+" : "") + change + "%";
  changeCell.style.color = color.toCSSHex();

  createChart(row.insertCell(), points, "value", false, color);    // a line of the values
  createChart(row.insertCell(), points, "volume", true, neutral);  // grey columns of the volumes
});