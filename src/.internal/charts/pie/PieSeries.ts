import type { DataItem } from "../../core/render/Component";
import type { PieChart } from "./PieChart";

import { PercentSeries, IPercentSeriesSettings, IPercentSeriesDataItem, IPercentSeriesPrivate } from "../percent/PercentSeries";
import { Template } from "../../core/util/Template";
import type { IPoint } from "../../core/util/IPoint";
import { Slice } from "../../core/render/Slice";
import { Tick } from "../../core/render/Tick";
import { RadialLabel } from "../../core/render/RadialLabel";
import { ListTemplate } from "../../core/util/List";
import { p100, Percent } from "../../core/util/Percent";
import type { Bullet } from "../../core/render/Bullet";

import * as $array from "../../core/util/Array";
import * as $math from "../../core/util/Math";
import * as $utils from "../../core/util/Utils";

export interface IPieSeriesDataItem extends IPercentSeriesDataItem {
	slice: Slice;
	label: RadialLabel;
}

export interface IPieSeriesSettings extends IPercentSeriesSettings {

	/**
	 * Radius of the series in pixels or percent.
	 */
	radius?: Percent | number;

	/**
	 * Radius of the series in pixels or percent.
	 *
	 * Setting to negative number will mean pixels from outer radius.
	 */
	innerRadius?: Percent | number;

	/**
	 * Start angle of the series in degrees.
	 *
	 * @default -90
	 */
	startAngle?: number;

	/**
	 * End angle of the series in degrees.
	 *
	 * @default 270
	 */
	endAngle?: number;

}

export interface IPieSeriesPrivate extends IPercentSeriesPrivate {

	/**
	 * Actual radius of the series in pixels.
	 */
	radius?: number;

}

/**
 * Creates a series for a [[PieChart]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/} for more info
 * @important
 */
export class PieSeries extends PercentSeries {

	declare public chart: PieChart | undefined;

	public static className: string = "PieSeries";
	public static classNames: Array<string> = PercentSeries.classNames.concat([PieSeries.className]);

	declare public _settings: IPieSeriesSettings;
	declare public _privateSettings: IPieSeriesPrivate;
	declare public _dataItemSettings: IPieSeriesDataItem;

	declare public _sliceType: Slice;
	declare public _labelType: RadialLabel;

	protected _makeSlices(): ListTemplate<this["_sliceType"]> {
		return new ListTemplate(
			Template.new({}),
			() => Slice._new(this._root, {
				themeTags: $utils.mergeTags(this.slices.template.get("themeTags", []), ["pie", "series"])
			}, [this.slices.template]),
		);
	}

	protected _makeLabels(): ListTemplate<this["_labelType"]> {
		return new ListTemplate(
			Template.new({}),
			() => RadialLabel._new(this._root, {
				themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["pie", "series"])
			}, [this.labels.template]),
		);
	}

	protected _makeTicks(): ListTemplate<this["_tickType"]> {
		return new ListTemplate(
			Template.new({}),
			() => Tick._new(this._root, {
				themeTags: $utils.mergeTags(this.ticks.template.get("themeTags", []), ["pie", "series"])
			}, [this.ticks.template]),
		);
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const slice = this.makeSlice(dataItem);

		slice.on("scale", () => {
			this._updateTick(dataItem);
		})
		slice.on("shiftRadius", () => {
			this._updateTick(dataItem);
		})
		slice.events.on("positionchanged", () => {
			this._updateTick(dataItem);
		})

		const label = this.makeLabel(dataItem);

		label.events.on("positionchanged", () => {
			this._updateTick(dataItem);
		})

		this.makeTick(dataItem);

		slice.events.on("positionchanged", () => {
			label.markDirty();
		})
	}

	protected _getNextUp() {
		const chart = this.chart;
		if (chart) {
			return chart._maxRadius;
		}
		return this.labelsContainer.maxHeight() / 2;
	}

	protected _getNextDown() {
		const chart = this.chart;
		if (chart) {
			return -chart._maxRadius;
		}
		return -this.labelsContainer.maxHeight() / 2;

	}

	public _prepareChildren() {
		super._prepareChildren();
		const chart = this.chart;
		if (chart) {

			if (this.isDirty("alignLabels")) {
				let labelsTemplate = this.labels.template;

				if (this.get("alignLabels")) {
					labelsTemplate.set("textType", "aligned");
				}
				else {
					let textType = labelsTemplate.get("textType");
					if (textType == null || textType == "aligned") {
						labelsTemplate.set("textType", "adjusted");
					}
				}
			}


			if (this._valuesDirty || this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("endAngle") || this.isDirty("alignLabels")) {
				this.markDirtyBounds();
				const startAngle = this.get("startAngle", chart.get("startAngle", -90));
				const endAngle = this.get("endAngle", chart.get("endAngle", 270));
				const arc = endAngle - startAngle;
				let currentAngle = startAngle;

				const radius = chart.radius(this);
				this.setPrivateRaw("radius", radius);
				let innerRadius = chart.innerRadius(this) * chart.getPrivate("irModifyer", 1);

				if (innerRadius < 0) {
					innerRadius = radius + innerRadius;
				}

				//if (radius > 0) {
				$array.each(this._dataItems, (dataItem) => {

					this.updateLegendValue(dataItem);

					let currentArc = arc * dataItem.get("valuePercentTotal") / 100;
					const slice = dataItem.get("slice");
					if (slice) {
						slice.set("radius", radius);
						slice.set("innerRadius", innerRadius);
						slice.set("startAngle", currentAngle);

						slice.set("arc", currentArc);

						const color = dataItem.get("fill");
						slice._setDefault("fill", color);
						slice._setDefault("stroke", color);

						const fillPattern = dataItem.get("fillPattern");
						slice._setDefault("fillPattern", fillPattern);						
					}

					let middleAngle = $math.normalizeAngle(currentAngle + currentArc / 2);

					const label = dataItem.get("label");
					if (label) {
						label.setPrivate("radius", radius);
						label.setPrivate("innerRadius", innerRadius);
						label.set("labelAngle", middleAngle);

						if (label.get("textType") == "aligned") {
							let labelRadius = radius + label.get("radius", 0);
							let y = radius * $math.sin(middleAngle);

							if (middleAngle > 90 && middleAngle <= 270) {
								if (!label.isHidden() && !label.isHiding()) {
									this._lLabels.push({ label: label, y: y });
								}
								labelRadius *= -1;
								labelRadius -= this.labelsContainer.get("paddingLeft", 0);
								label.set("centerX", p100);
								label.setPrivateRaw("left", true);
							}
							else {
								if (!label.isHidden() && !label.isHiding()) {
									this._rLabels.push({ label: label, y: y });
								}
								labelRadius += this.labelsContainer.get("paddingRight", 0);
								label.set("centerX", 0);
								label.setPrivateRaw("left", false);
							}
							label.set("x", labelRadius);
							label.set("y", radius * $math.sin(middleAngle));
						}
					}
					currentAngle += currentArc;
					this._updateTick(dataItem);
				})
				//}
			}
		}
	}

	protected _updateTick(dataItem: DataItem<this["_dataItemSettings"]>) {
		const tick = dataItem.get("tick");
		const label = dataItem.get("label");
		const slice = dataItem.get("slice");
		const location = tick.get("location", 1);
		if (tick && label && slice) {
			const radius = (slice.get("shiftRadius", 0) + slice.get("radius", 0)) * slice.get("scale", 1) * location;
			const labelAngle = label.get("labelAngle", 0);
			const cos = $math.cos(labelAngle);
			const sin = $math.sin(labelAngle);

			const labelsContainer = this.labelsContainer;
			const pl = labelsContainer.get("paddingLeft", 0);
			const pr = labelsContainer.get("paddingRight", 0);

			let x = 0;
			let y = 0;

			x = label.x();
			y = label.y();
			let points:Array<IPoint> = [];

			if(x != 0 || y != 0){
				if (label.get("textType") == "circular") {
					const labelRadius = label.radius() - label.get("paddingBottom", 0);
					const labelAngle = label.get("labelAngle", 0);
					x = labelRadius * $math.cos(labelAngle);
					y = labelRadius * $math.sin(labelAngle);
				}

				let dx = -pr;
				if (label.getPrivate("left")) {
					dx = pl;
				}
				points = [{ x: slice.x() + radius * cos, y: slice.y() + radius * sin }, { x: x + dx, y: y }, { x: x, y: y }];				
			}

			tick.set("points", points);
		}
	}

	public _positionBullet(bullet: Bullet) {

		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;
			const slice = dataItem.get("slice");

			if (slice) {
				const innerRadius = slice.get("innerRadius", 0);
				const radius = slice.get("radius", 0);
				const startAngle = slice.get("startAngle", 0);
				const arc = slice.get("arc", 0);
				const locationX = bullet.get("locationX", 0.5);
				const locationY = bullet.get("locationY", 0.5);

				const angle = startAngle + arc * locationX;
				const r = innerRadius + (radius - innerRadius) * locationY;

				sprite.setAll({ x: $math.cos(angle) * r, y: $math.sin(angle) * r });
			}
		}
	}
}
