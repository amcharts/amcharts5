import type { IPoint } from "../../../core/util/IPoint";
import type { Line } from "../../../core/render/Line";
import type { XYSeries } from "../../xy/series/XYSeries";
import type { StockPanel } from "../StockPanel";
import type { Graphics } from "../../../core/render/Graphics";

import { RectangleSeries, IRectangleSeriesSettings, IRectangleSeriesPrivate, IRectangleSeriesDataItem } from "./RectangleSeries";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { Label } from "../../../core/render/Label";
import { DataItem } from "../../../core/render/Component";
import { RoundedRectangle } from "../../../core/render/RoundedRectangle";

import * as $type from "../../../core/util/Type";

export interface IMeasureDataItem extends IRectangleSeriesDataItem {
}

export interface IMeasureSettings extends IRectangleSeriesSettings {
	labelText?: string;
	labelVolumeText?: string;
}

export interface IMeasurePrivate extends IRectangleSeriesPrivate {
}

export class Measure extends RectangleSeries {
	public static className: string = "Measure";
	public static classNames: Array<string> = RectangleSeries.classNames.concat([Measure.className]);

	declare public _settings: IMeasureSettings;
	declare public _privateSettings: IMeasurePrivate;
	declare public _dataItemSettings: IMeasureDataItem;

	protected _lines: Array<Line> = [];
	protected _labels: Array<Label> = [];

	protected _tag = "measure";

	public _afterNew() {
		super._afterNew();
		this.set("snapToData", true);
		this.strokes.template.set("templateField", undefined);
		this.fills.template.set("templateField", undefined);
	}

	/**
	 * A list of labels.
	 *
	 * `labels.template` can be used to configure axis labels.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {}, [this.labels.template])
	));

	/**
	 * @ignore
	 */
	public makeLabel(): Label {
		const label = this.labels.make();
		this.bulletsContainer.children.push(label);
		label.setAll({
			populateText: true,
			background: RoundedRectangle.new(this._root, { themeTags: ["background"] })
		});
		label._setDataItem(new DataItem(this, {}, {}));
		this.labels.push(label);
		return label;
	}

	protected _createElements(index: number) {
		super._createElements(index);
		if (!this._labels[index]) {
			const label = this.makeLabel();
			this._labels[index] = label;
		}
	}

	protected _disposeIndex(index: number) {
		super._disposeIndex(index);
		const label = this._labels[index];
		if (label) {
			label.dispose();
			delete (this._labels[index]);
		}

		const line = this._lines[index];
		if (line) {
			line.dispose();
			delete (this._lines[index]);
		}
	}

	protected _updateOthers(index: number, fillGraphics: Graphics, p1: IPoint, p2: IPoint) {
		const xAxis = this.get("xAxis");
		const panel = xAxis.chart as StockPanel;
		const line = this._lines[index];

		let positiveColor = this._root.interfaceColors.get("positive");
		let negativeColor = this._root.interfaceColors.get("negative");

		const stockChart = panel.getPrivate("stockChart");

		let volumeSeries: XYSeries | undefined;

		if (stockChart) {
			positiveColor = stockChart.get("stockPositiveColor", positiveColor);
			negativeColor = stockChart.get("stockNegativeColor", negativeColor);
			volumeSeries = stockChart.get("volumeSeries");
		}

		let ix = 1;
		if (p1.x > p2.x) {
			ix = -1;
		}

		const label = this._labels[index];
		const labelBg = label.get("background")!;

		const diP1 = this._di[index]["p1"];
		const diP2 = this._di[index]["p2"];
		let color = positiveColor;
		let iy = 1;
		if (p1.y > p2.y) {
			iy = -1;
			color = negativeColor;
		}

		fillGraphics.set("fill", color);
		fillGraphics.set("fillOpacity", 0.2);
		line.set("stroke", color);
		labelBg.set("fill", color);

		this.outerCircles.each((outerCircle) => {
			outerCircle.set("stroke", color);
		})

		const mx = p1.x + (p2.x - p1.x) / 2;
		const my = p1.y + (p2.y - p1.y) / 2;

		line.set("segments", [[[{ x: mx, y: p1.y }, { x: mx, y: p2.y }]], [[{ x: mx - 5, y: p2.y - 5 * iy }, { x: mx, y: p2.y }, { x: mx + 5, y: p2.y - 5 * iy }]], [[{ x: p1.x, y: my }, { x: p2.x, y: my }]], [[{ x: p2.x - 5 * ix, y: my - 5 }, { x: p2.x, y: my }, { x: p2.x - 5 * ix, y: my + 5 }]]]);

		const value1 = diP1.get("valueY", 0);
		const value2 = diP2.get("valueY", 0);

		const numberFormatter = this.getNumberFormatter();
		const value = numberFormatter.format((value2 - value1));
		const percent = numberFormatter.format((value2 - value1) / value1 * 100) + "%";
		const baseInterval = xAxis.getPrivate("baseInterval");

		const time1 = diP1.get("valueX", 0);
		const time2 = diP2.get("valueX", 0);

		const series = this.get("series");

		let count = 0;
		if (series) {
			const di1 = xAxis.getSeriesItem(series, xAxis.valueToPosition(time1));
			const di2 = xAxis.getSeriesItem(series, xAxis.valueToPosition(time2));
			if (di1 && di2) {
				count = series.dataItems.indexOf(di2) - series.dataItems.indexOf(di1) + 1;

				if (this.get("snapToData")) {
					count--;
				}
			}
		}

		let intervalCount = Math.ceil((time2 - time1) / xAxis.baseDuration() * baseInterval.count);
		if (intervalCount < count) {
			intervalCount = count;
		}


		let volume = 0;
		if (volumeSeries) {
			const div1 = xAxis.getSeriesItem(volumeSeries, xAxis.valueToPosition(time1));
			const div2 = xAxis.getSeriesItem(volumeSeries, xAxis.valueToPosition(time2));

			if (div1 && div2) {
				const dataItems = volumeSeries.dataItems;
				let i1 = dataItems.indexOf(div1);
				let i2 = dataItems.indexOf(div2);

				if (i1 > i2) {
					[i1, i2] = [i2, i1];
				}

				for (let i = i1; i <= i2; i++) {
					const dataItem = dataItems[i];
					if (dataItem) {
						const value = dataItem.get("valueY");
						if ($type.isNumber(value)) {
							volume += value;
						}
					}
				}
			}
		}

		let text = this.get("labelText", "");
		if (volume > 0) {
			text += this.get("labelVolumeText");
		}

		const unitNames = {
			millisecond: "ms",
			second: "s",
			minute: "m",
			hour: "h",
			day: "d",
			week: "wk",
			month: "mo",
			year: "y"
		}

		label.dataItem!.dataContext = {
			value: value,
			percent: percent,
			count: count,
			intervalCount: intervalCount,
			intervalUnit: this._root.language.translateAny(unitNames[baseInterval.timeUnit]),
			volume: volume
		};

		label.setAll({
			text: text,
			x: mx,
			y: my
		});

		label.text.markDirtyText();
	}

}
