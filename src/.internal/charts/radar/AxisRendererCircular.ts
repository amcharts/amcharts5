import type { Axis } from "../xy/axes/Axis";
import type { RadarChart } from "./RadarChart";
import type { Grid } from "../xy/axes/Grid";
import type { IPoint } from "../../core/util/IPoint";
import type { Graphics } from "../../core/render/Graphics";
import type { AxisTick } from "../xy/axes/AxisTick";
import type { AxisBullet } from "../xy/axes/AxisBullet";
import type { Tooltip } from "../../core/render/Tooltip";

import { Slice } from "../../core/render/Slice";
import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "../xy/axes/AxisRenderer";
import { AxisLabelRadial } from "../xy/axes/AxisLabelRadial";
import { Percent, p100 } from "../../core/util/Percent";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";
import { arc } from "d3-shape";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";


export interface IAxisRendererCircularSettings extends IAxisRendererSettings {

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

export interface IAxisRendererCircularPrivate extends IAxisRendererPrivate {

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
 * Renderer for circular axes.
 */
export class AxisRendererCircular extends AxisRenderer {

	/**
	 * Chart this renderer is for.
	 */
	declare public chart: RadarChart | undefined;

	/**
	 * A list of labels in the axis.
	 *
	 * `labels.template` can be used to configure labels.
	 *
	 * @default new ListTemplate<AxisLabelRadial>
	 */
	public readonly labels: ListTemplate<AxisLabelRadial> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => AxisLabelRadial._new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), this.get("themeTags", []))
		}, [this.labels.template])
	));


	/**
	 * A list of fills in the axis.
	 *
	 * `axisFills.template` can be used to configure axis fills.
	 *
	 * @default new ListTemplate<Slice>
	 */
	public readonly axisFills: ListTemplate<Slice> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Slice._new(this._root, {
			themeTags: $utils.mergeTags(this.axisFills.template.get("themeTags", ["fill"]), this.get("themeTags", []))
		}, [this.axisFills.template])
	));


	public static className: string = "AxisRendererCircular";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererCircular.className]);

	declare public _settings: IAxisRendererCircularSettings;
	declare public _privateSettings: IAxisRendererCircularPrivate;

	protected _fillGenerator = arc();

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["renderer", "circular"]);
		super._afterNew();
		this.setPrivateRaw("letter", "X");
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
		const axis = this.axis;
		axis.labelsContainer.set("isMeasured", false);
	}

	/**
	 * @ignore
	 */
	public updateLayout() {
		const chart = this.chart;
		if (chart) {
			const radius = chart.getPrivate("radius", 0);

			let r = $utils.relativeToValue(this.get("radius", p100), radius);

			if (r < 0) {
				r = radius + r;
			}

			this.setPrivate("radius", r);

			let ir = $utils.relativeToValue(this.get("innerRadius", chart.getPrivate("innerRadius", 0)), radius) * chart.getPrivate("irModifyer", 1);

			if (ir < 0) {
				ir = r + ir;
			}

			this.setPrivate("innerRadius", ir);

			let startAngle = this.get("startAngle", chart.get("startAngle", -90));
			let endAngle = this.get("endAngle", chart.get("endAngle", 270));

			this.setPrivate("startAngle", startAngle);
			this.setPrivate("endAngle", endAngle);

			this.set("draw", (display) => {
				const p0 = this.positionToPoint(0);
				display.moveTo(p0.x, p0.y);

				if (startAngle > endAngle) {
					[startAngle, endAngle] = [endAngle, startAngle];
				}

				display.arc(0, 0, r, startAngle * $math.RADIANS, endAngle * $math.RADIANS);
			});

			this.axis.markDirtySize();
		}
	}

	/**
	 * @ignore
	 */
	public updateGrid(grid?: Grid, position?: number, endPosition?: number) {
		if (grid) {

			if (position == null) {
				position = 0;
			}

			let location = grid.get("location", 0.5);
			if (endPosition != null && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			let radius = this.getPrivate("radius", 0);
			let innerRadius = this.getPrivate("innerRadius", 0);
			let angle = this.positionToAngle(position);

			this.toggleVisibility(grid, position, 0, 1);

			if (radius != null) {
				grid.set("draw", (display) => {
					display.moveTo(innerRadius * $math.cos(angle), innerRadius * $math.sin(angle));
					display.lineTo(radius * $math.cos(angle), radius * $math.sin(angle));
				})
			}
		}
	}

	/**
	 * Converts relative position to angle.
	 *
	 * @param   position  Position
	 * @return            Angle
	 */
	public positionToAngle(position: number): number {
		const axis: Axis<AxisRenderer> = this.axis;
		const startAngle = this.getPrivate("startAngle", 0);
		const endAngle = this.getPrivate("endAngle", 360);

		const start = axis.get("start", 0);
		const end = axis.get("end", 1);

		let arc = (endAngle - startAngle) / (end - start);

		let angle: number;

		if (this.get("inversed")) {
			angle = startAngle + (end - position) * arc;
		}
		else {
			angle = startAngle + (position - start) * arc;
		}

		return angle;
	}

	// do not delete
	protected _handleOpposite() { }

	/**
	 * Converts relative position to an X/Y coordinate.
	 *
	 * @param   position  Position
	 * @return            Point
	 */
	public positionToPoint(position: number): IPoint {
		const radius = this.getPrivate("radius", 0);
		const angle = this.positionToAngle(position);
		return { x: radius * $math.cos(angle), y: radius * $math.sin(angle) };
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabelRadial, position?: number, endPosition?: number, count?: number) {
		if (label) {
			if (position == null) {
				position = 0;
			}

			let location = 0.5;
			if (count != null && count > 1) {
				location = label.get("multiLocation", location);
			}
			else {
				location = label.get("location", location);
			}

			if (endPosition != null && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			const radius = this.getPrivate("radius", 0);
			const innerRadius = this.getPrivate("innerRadius", 0);
			const angle = this.positionToAngle(position);

			label.setPrivate("radius", radius);
			label.setPrivate("innerRadius", innerRadius);
			label.set("labelAngle", angle);

			this.toggleVisibility(label, position, label.get("minPosition", 0), label.get("maxPosition", 1));
		}
	}

	/**
	 * @ignore
	 */
	public fillDrawMethod(fill: Graphics, startAngle?: number, endAngle?: number) {
		fill.set("draw", (display) => {
			if (startAngle == null) {
				startAngle = this.getPrivate("startAngle", 0);
			}
			if (endAngle == null) {
				endAngle = this.getPrivate("endAngle", 0);
			}
			const y0 = this.getPrivate("innerRadius", 0);
			const y1 = this.getPrivate("radius", 0);
			this._fillGenerator.context(display as any);
			this._fillGenerator({ innerRadius: y0, outerRadius: y1, startAngle: (startAngle + 90) * $math.RADIANS, endAngle: (endAngle + 90) * $math.RADIANS });
		})
	}

	/**
	 * @ignore
	 */
	public updateTick(tick?: AxisTick, position?: number, endPosition?: number, count?: number) {
		if (tick) {
			if (position == null) {
				position = 0;
			}

			let location = 0.5;
			if (count != null && count > 1) {
				location = tick.get("multiLocation", location);
			}
			else {
				location = tick.get("location", location);
			}

			if (endPosition != null && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			let length = tick.get("length", 0);
			const inside = tick.get("inside");

			if (inside) {
				length *= -1
			}

			let radius = this.getPrivate("radius", 0);
			let angle = this.positionToAngle(position);

			this.toggleVisibility(tick, position, tick.get("minPosition", 0), tick.get("maxPosition", 1));

			if (radius != null) {
				tick.set("draw", (display) => {
					display.moveTo(radius * $math.cos(angle), radius * $math.sin(angle));
					radius += length;
					display.lineTo(radius * $math.cos(angle), radius * $math.sin(angle));
				})
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateBullet(bullet?: AxisBullet, position?: number, endPosition?: number) {
		if (bullet) {
			const sprite = bullet.get("sprite");

			if (sprite) {
				if (position == null) {
					position = 0;
				}

				let location = bullet.get("location", 0.5);
				if (endPosition != null && endPosition != position) {
					position = position + (endPosition - position) * location;
				}

				let radius = this.getPrivate("radius", 0);
				let angle = this.positionToAngle(position);

				this.toggleVisibility(sprite, position, 0, 1);

				sprite.setAll({ rotation: angle, x: radius * $math.cos(angle), y: radius * $math.sin(angle) });
			}
		}
	}

	/**
	 * @ignore
	 */
	public updateFill(fill?: Slice, position?: number, endPosition?: number) {
		if (fill) {
			if (position == null) {
				position = 0;
			}
			if (endPosition == null) {
				endPosition = 1;
			}

			let startAngle = this.fitAngle(this.positionToAngle(position));
			let endAngle = this.fitAngle(this.positionToAngle(endPosition));
			fill.setAll({ startAngle: startAngle, arc: endAngle - startAngle });

			fill._setSoft("innerRadius", this.getPrivate("innerRadius"));
			fill._setSoft("radius", this.getPrivate("radius"));
		}
	}

	/**
	 * @ignore
	 */
	public fitAngle(angle: number): number {
		const startAngle = this.getPrivate("startAngle", 0);
		const endAngle = this.getPrivate("endAngle", 0);

		const minAngle = Math.min(startAngle, endAngle);
		const maxAngle = Math.max(startAngle, endAngle);

		if (angle < minAngle) {
			angle = minAngle;
		}

		if (angle > maxAngle) {
			angle = maxAngle;
		}

		return angle;
	}

	/**
	 * Returns axis length in pixels.
	 *
	 * @return Length
	 */
	public axisLength(): number {
		return Math.abs(this.getPrivate("radius", 0) * Math.PI * 2 * (this.getPrivate("endAngle", 360) - this.getPrivate("startAngle", 0)) / 360);
	}

	/**
	 * @ignore
	 */
	public positionTooltip(tooltip: Tooltip, position: number) {
		let radius = this.getPrivate("radius", 0);
		const angle = this.positionToAngle(position);
		//return tooltip.set("pointTo", this.axis._display.toGlobal({ x: radius * $math.cos(angle), y: radius * $math.sin(angle) }));
		this._positionTooltip(tooltip, { x: radius * $math.cos(angle), y: radius * $math.sin(angle) });
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) {

	}
}
