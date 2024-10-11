import type { RadarChart } from "./RadarChart";
import type { Grid } from "../xy/axes/Grid";
import type { IPoint } from "../../core/util/IPoint";
import type { Graphics } from "../../core/render/Graphics";
import type { AxisTick } from "../xy/axes/AxisTick";
import type { AxisBullet } from "../xy/axes/AxisBullet";
import type { Tooltip } from "../../core/render/Tooltip";

import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "../xy/axes/AxisRenderer";
import { Percent, p100 } from "../../core/util/Percent";
import { AxisLabelRadial } from "../xy/axes/AxisLabelRadial";
import { arc } from "d3-shape";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";
import * as $math from "../../core/util/Math";


export interface IAxisRendererRadialSettings extends IAxisRendererSettings {

	/**
	 * Outer radius of the axis.
	 *
	 * If set in percent, it will be relative to chart's own `radius`.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/radar-axes/#Axis_radii_and_angles} for more info
	 */
	radius?: number | Percent;

	/**
	 * Inner radius of the axis.
	 *
	 * If set in percent, it will be relative to chart's own `innerRadius`.
	 *
	 * If value is negative, inner radius will be calculated from the outer edge.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/radar-axes/#Axis_radii_and_angles} for more info
	 */
	innerRadius?: number | Percent;

	/**
	 * Series start angle.
	 *
	 * If not set, will use chart's `startAngle.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/radar-axes/#Axis_radii_and_angles} for more info
	 */
	startAngle?: number;

	/**
	 * Series end angle.
	 *
	 * If not set, will use chart's `endAngle.`
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/radar-chart/radar-axes/#Axis_radii_and_angles} for more info
	 */
	endAngle?: number;


	/**
	 * @todo am: needs description
	 */
	axisAngle?: number;

}

export interface IAxisRendererRadialPrivate extends IAxisRendererPrivate {

	/**
	 * Actual radius of the label in pixels.
	 */
	radius?: number;

	/**
	 * Actual inner radius of the label in pixels.
	 */
	innerRadius?: number;

	/**
	 * Actual start angle of the label in degrees.
	 */
	startAngle?: number;

	/**
	 * Actual end angle of the label in degrees.
	 */
	endAngle?: number;

}

/**
 * Renderer for radial axes.
 */
export class AxisRendererRadial extends AxisRenderer {

	/**
	 * Chart this renderer is for.
	 */
	declare public chart: RadarChart | undefined;

	public static className: string = "AxisRendererRadial";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererRadial.className]);

	declare public _settings: IAxisRendererRadialSettings;
	declare public _privateSettings: IAxisRendererRadialPrivate;

	protected _fillGenerator = arc();

	/**
	 * A [[TemplateList]] with all the labels attached to the axis.
	 *
	 * `labels.template` can be used to configure appearance of the labels.
	 *
	 * @default new ListTemplate<AxisLabelRadial>
	 */
	public readonly labels: ListTemplate<AxisLabelRadial> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => AxisLabelRadial._new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), this.get("themeTags", []))
		}, [this.labels.template])
	));

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["renderer", "radial"]);
		super._afterNew();
		this.setPrivate("letter", "Y");
		this.setRaw("position", "absolute");
	}

	public _changed() {
		super._changed();

		if (this.isDirty("radius") || this.isDirty("innerRadius") || this.isDirty("startAngle") || this.isDirty("endAngle")) {
			this.updateLayout();
		}
	}

	/**
	 * @ignore
	 */
	public processAxis() {
		super.processAxis();
	}

	/**
	 * @ignore
	 */
	public updateLayout() {
		const chart = this.chart;
		if (chart) {
			const radius = chart.getPrivate("radius", 0);

			let r = $utils.relativeToValue(this.get("radius", p100), radius);
			let ir = $utils.relativeToValue(this.get("innerRadius", chart.getPrivate("innerRadius", 0)), radius) * chart.getPrivate("irModifyer", 1);

			if (ir < 0) {
				ir = r + ir;
			}

			this.setPrivate("radius", r);
			this.setPrivate("innerRadius", ir);
			let startAngle = this.get("startAngle", chart.get("startAngle", -90));
			let endAngle = this.get("endAngle", chart.get("endAngle", 270));

			this.setPrivate("startAngle", startAngle);
			this.setPrivate("endAngle", endAngle);

			const axisAngle = this.get("axisAngle", 0);

			this.set("draw", (display) => {
				display.moveTo(ir * $math.cos(axisAngle), ir * $math.sin(axisAngle));
				display.lineTo(r * $math.cos(axisAngle), r * $math.sin(axisAngle));
			});

			this.axis.markDirtySize();
		}
	}

	/**
	 * @ignore
	 */
	public updateGrid(grid?: Grid, position?: number, endPosition?: number) {
		if (grid) {

			if (!$type.isNumber(position)) {
				position = 0;
			}

			let location = grid.get("location", 0.5);
			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			let radius = this.positionToCoordinate(position) + this.getPrivate("innerRadius", 0);

			this.toggleVisibility(grid, position, 0, 1);

			if ($type.isNumber(radius)) {
				grid.set("draw", (display) => {
					let startAngle = this.getPrivate("startAngle", 0) * $math.RADIANS;
					let endAngle = this.getPrivate("endAngle", 0) * $math.RADIANS;
					display.arc(0, 0, Math.max(0, radius), Math.min(startAngle, endAngle), Math.max(startAngle, endAngle));
				})
			}
		}
	}

	// do not delete
	protected _handleOpposite() { }

	/**
	 * Converts relative position to X/Y point.
	 *
	 * @param   position  Position
	 * @return            Point
	 */
	public positionToPoint(position: number): IPoint {
		const innerRadius = this.getPrivate("innerRadius", 0);
		const radius = this.positionToCoordinate(position) + innerRadius;
		const axisAngle = this.get("axisAngle", 0);
		return { x: radius * $math.cos(axisAngle), y: radius * $math.sin(axisAngle) };
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabelRadial, position?: number, endPosition?: number, count?: number) {
		if (label) {
			if (!$type.isNumber(position)) {
				position = 0;
			}

			let location = 0.5;
			if ($type.isNumber(count) && count > 1) {
				location = label.get("multiLocation", location);
			}
			else {
				location = label.get("location", location);
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			const point = this.positionToPoint(position);

			let radius = Math.hypot(point.x, point.y);

			label.setPrivate("radius", radius);
			label.setPrivate("innerRadius", radius);
			label.set("labelAngle", this.get("axisAngle"));

			this.toggleVisibility(label, position, label.get("minPosition", 0), label.get("maxPosition", 1));
		}
	}

	protected fillDrawMethod(fill: Graphics, y0: number, y1: number) {
		fill.set("draw", (display) => {
			y0 = Math.max(0, y0);
			y1 = Math.max(0, y1);
			this._fillGenerator.context(display as any);
			let startAngle = (this.getPrivate("startAngle", 0) + 90) * $math.RADIANS;
			let endAngle = (this.getPrivate("endAngle", 0) + 90) * $math.RADIANS;

			if (endAngle < startAngle) {
				[startAngle, endAngle] = [endAngle, startAngle];
			}

			this._fillGenerator({ innerRadius: y0, outerRadius: y1, startAngle: startAngle, endAngle: endAngle });
		})
	}

	/**
	 * @ignore
	 */
	public updateTick(tick?: AxisTick, position?: number, endPosition?: number, count?: number) {
		if (tick) {

			if (!$type.isNumber(position)) {
				position = 0;
			}

			let location = 0.5;
			if ($type.isNumber(count) && count > 1) {
				location = tick.get("multiLocation", location);
			}
			else {
				location = tick.get("location", location);
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			const point = this.positionToPoint(position);

			tick.set("x", point.x);
			tick.set("y", point.y);

			let length = tick.get("length", 0);
			const inside = tick.get("inside");

			if (inside) {
				length *= -1
			}

			const axisAngle = this.get("axisAngle", 0) + 90;

			tick.set("draw", (display) => {
				display.moveTo(0, 0);
				display.lineTo(length * $math.cos(axisAngle), length * $math.sin(axisAngle));
			})

			this.toggleVisibility(tick, position, tick.get("minPosition", 0), tick.get("maxPosition", 1));
		}
	}

	/**
	 * @ignore
	 */
	public updateBullet(bullet?: AxisBullet, position?: number, endPosition?: number) {
		if (bullet) {

			const sprite = bullet.get("sprite");

			if (sprite) {

				if (!$type.isNumber(position)) {
					position = 0;
				}

				let location = bullet.get("location", 0.5);
				if ($type.isNumber(endPosition) && endPosition != position) {
					position = position + (endPosition - position) * location;
				}

				const point = this.positionToPoint(position);

				sprite.setAll({ x: point.x, y: point.y });

				this.toggleVisibility(sprite, position, 0, 1);
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateFill(fill?: Graphics, position?: number, endPosition?: number) {
		if (fill) {
			if (!$type.isNumber(position)) {
				position = 0;
			}
			if (!$type.isNumber(endPosition)) {
				endPosition = 1;
			}

			const innerRadius = this.getPrivate("innerRadius", 0);

			let y0 = this.positionToCoordinate(position) + innerRadius;
			let y1 = this.positionToCoordinate(endPosition) + innerRadius;

			this.fillDrawMethod(fill, y0, y1);
		}
	}

	/**
	 * Returns axis length in pixels.
	 *
	 * @return Length
	 */
	public axisLength(): number {
		return this.getPrivate("radius", 0) - this.getPrivate("innerRadius", 0);
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) {

	}

	/**
	 * Converts relative position to pixels.
	 *
	 * @param   position  Position
	 * @return            Pixels
	 */
	public positionToCoordinate(position: number): number {
		if (this._inversed) {
			position = Math.min(this._end, position);
			return (this._end - position) * this._axisLength;
		}
		else {
			position = Math.max(this._start, position);
			return (position - this._start) * this._axisLength;
		}
	}

	/**
	 * @ignore
	 */
	public positionTooltip(tooltip: Tooltip, position: number) {
		let radius = this.getPrivate("innerRadius", 0) + this.positionToCoordinate(position);
		const angle = this.get("axisAngle", 0);
		//return tooltip.set("pointTo", this.axis._display.toGlobal({ x: radius * $math.cos(angle), y: radius * $math.sin(angle) }));
		this._positionTooltip(tooltip, { x: radius * $math.cos(angle), y: radius * $math.sin(angle) });
	}
}
