import type { CurveChart } from "./CurveChart";
import type { Grid } from "../xy/axes/Grid";
import type { IPoint } from "../../core/util/IPoint";
import type { Graphics } from "../../core/render/Graphics";
import type { AxisTick } from "../xy/axes/AxisTick";
import type { AxisBullet } from "../xy/axes/AxisBullet";
import type { Tooltip } from "../../core/render/Tooltip";
import type { AxisRendererCurveX } from "./AxisRendererCurveX";

import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "../xy/axes/AxisRenderer";
import { AxisLabelRadial } from "../xy/axes/AxisLabelRadial";
import { arc } from "d3-shape";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

import * as $utils from "../../core/util/Utils";
import * as $type from "../../core/util/Type";
import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";

export interface IAxisRendererCurveYSettings extends IAxisRendererSettings {

	/**
	 * Length of the axis in pixels. On a [[CurveChart]], it is scaled along
	 * with the X renderer's `points`.
	 *
	 * [[SerpentineChart]] and [[SpiralChart]] ignore it and work the length
	 * out from their own `yAxisRadius`.
	 *
	 * @default 60
	 */
	axisLength?: number;

	/**
	 * Renderer of the X axis. It is set automatically when this renderer is
	 * the X renderer's `yRenderer`.
	 */
	xRenderer?: AxisRendererCurveX;

	/**
	* Where on this axis the X axis line runs: `0` at its start, `1` at its
	* end. At `0.5`, the axis reaches out equally to both sides of the line.
	*
	* @default 0.5
	*/
	axisLocation?: number;

	/**
	 * Rotates the labels to the direction of the X axis line at its start,
	 * where this axis's labels are.
	 *
	 * @default false
	 */
	rotateLabels?: boolean;

}

export interface IAxisRendererCurveYPrivate extends IAxisRendererPrivate {
}

/**
 * Renderer for the Y axis of a [[CurveChart]], which runs across the X axis
 * line all along it.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class AxisRendererCurveY extends AxisRenderer {

	/**
	 * Chart this renderer is for.
	 */
	declare public chart: CurveChart | undefined;

	public static className: string = "AxisRendererCurveY";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererCurveY.className]);

	declare public _settings: IAxisRendererCurveYSettings;
	declare public _privateSettings: IAxisRendererCurveYPrivate;

	protected _fillGenerator = arc();

	/**
	 * The axis labels, placed at the start of the X axis line. Configure them
	 * through `labels.template`.
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
		this._setCRaw("position", "absolute");
	}

	public _changed() {
		super._changed();

		if (this.isDirty("axisLength")) {
			this.updateLayout();
		}

		if (this.isDirty("rotateLabels")) {
			// re-run the label loop so `updateLabel` applies (or clears) rotation
			this.axis.markDirtySize();
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
			const p0 = this.positionToPoint(0, 0);
			const p1 = this.positionToPoint(1, 0);

			// draw axis
			this.set("draw", (display) => {
				display.moveTo(p0.x, p0.y);
				display.lineTo(p1.x, p1.y);
			})

			this.axis.markDirtySize();
			chart._updateMasks();
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

			this.toggleVisibility(grid, position, 0, 1);

			let xRenderer = this.get("xRenderer")!;
			if (xRenderer) {
				const points = xRenderer.get("points");
				if (points) {
					grid.set("draw", (display) => {
						let previousPoint: IPoint | undefined;
						$array.each(points, (_point, index) => {
							let pointPostion = xRenderer.pointPostion[index];
							let p = this.positionToPoint(position!, pointPostion, true);

							if (index == 0) {
								display.moveTo(p.x, p.y);
							}
							else {
								// if distance between previous and current is very small, we skip it
								if (previousPoint && Math.hypot(previousPoint.x - p.x, previousPoint.y - p.y) < .5) {

								}
								else {
									display.lineTo(p.x, p.y);
									previousPoint = p;
								}
							}
						})
					})
				}
			}
		}
	}




	// do not delete
	protected _handleOpposite() { }

	/**
	 * Converts a position on this axis and one on the X axis to an X/Y point.
	 *
	 * @param   position   Position on this axis, `0` to `1`
	 * @param   positionX  Position on the X axis, `0` to `1`
	 * @param   doNotFix   `positionX` is already relative to the X axis's visible (zoomed) range
	 * @return             Point
	 */
	public positionToPoint(position: number, positionX?: number, doNotFix?: boolean): IPoint {
		if (positionX == undefined) {
			positionX = 0;
		}

		const xRenderer = this.get("xRenderer");
		if (xRenderer) {
			return xRenderer.positionToPoint(positionX, position, doNotFix)
		}
		return { x: 0, y: 0 };
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

			const point = this.positionToPoint(position, 0);
			const xRenderer = this.get("xRenderer");
			if (xRenderer) {
				let angle = 0;
				if (xRenderer) {
					angle = xRenderer.positionToAngle(0) - 90;
				}
				label.setAll({
					x: point.x,
					y: point.y
				});

				if (this.get("rotateLabels", true)) {
					label.set("rotation", angle);
				}
				else {
					// reset, so turning `rotateLabels` off again unrotates the labels
					label.set("rotation", 0);
				}
			}

			this.toggleVisibility(label, position, label.get("minPosition", 0), label.get("maxPosition", 1));
		}
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

			const point = this.positionToPoint(position, 0);
			const xRenderer = this.get("xRenderer");
			if (xRenderer) {
				let angle = 0;
				if (xRenderer) {
					angle = xRenderer.positionToAngle(0) - 90;
				}

				let length = tick.get("length", 0);
				const inside = tick.get("inside");

				if (inside) {
					length *= -1
				}

				tick.set("draw", (display) => {
					display.moveTo(point.x, point.y);
					display.lineTo(point.x + length * $math.cos(angle), point.y + length * $math.sin(angle));
				})

				this.toggleVisibility(tick, position, tick.get("minPosition", 0), tick.get("maxPosition", 1));
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


	public getPoints(positionX: number, positionY: number, endPositionX: number, endPositionY: number) {
		return this.get("xRenderer")?.getPoints(positionX, positionY, endPositionX, endPositionY);
	}

	/**
	 * @ignore
	 */
	public updateFill(fill?: Graphics, position?: number, endPosition?: number) {
		if (fill) {
			if (position == null) {
				position = 0;
			}
			if (endPosition == null) {
				endPosition = 1;
			}

			const points = this.getPoints(0, position, 1, endPosition);
			if (points) {
				fill.set("draw", (display) => {
					display.moveTo(points[0].x, points[0].y);
					$array.each(points, (point) => {
						display.lineTo(point.x, point.y);
					})
					display.closePath();
				})
			}
		}
	}

	/**
	 * Returns the `axisLength` setting.
	 *
	 * @return Length
	 */
	public axisLength(): number {
		return this.get("axisLength", 60);
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) {

	}

	/**
	 * Converts a position on the axis to a distance in pixels from the start
	 * of its visible range.
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
		const xRenderer = this.get("xRenderer");
		if (xRenderer) {
			const point = this.positionToPoint(position, xRenderer.axis.get("start", 0));
			this._positionTooltip(tooltip, point);
		}
	}
}
