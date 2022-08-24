// Import chart code
import { makeChart } from "./chart";

beforeEach(() => {
  // Create <div> which is needed by the chart
  document.body.innerHTML = `<div id="chartdiv"></div>`;
});

test("chart exists", () => {
  const { root, chart } = makeChart();

  // Test chart
  expect(root).toBeDefined();
  expect(chart).toBeDefined();
  expect(chart.get("wheelX")).toBe("panX");
});
