import type { CurveChart } from "./CurveChart";
import type { Grid } from "../xy/axes/Grid";
import type { IPoint } from "../../core/util/IPoint";
import type { AxisTick } from "../xy/axes/AxisTick";
import type { AxisBullet } from "../xy/axes/AxisBullet";
import type { Tooltip } from "../../core/render/Tooltip";
import type { AxisRendererCurveY } from "./AxisRendererCurveY";

import { Slice } from "../../core/render/Slice";
import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "../xy/axes/AxisRenderer";
import { AxisLabel } from "../xy/axes/AxisLabel";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

import * as $utils from "../../core/util/Utils";
import * as $math from "../../core/util/Math";
import * as $array from "../../core/util/Array";

export interface IAxisRendererCurveXSettings extends IAxisRendererSettings {
	/**
	 * Array of control points to draw axis along.
	 */
	points?: Array<IPoint>;

	/**
	 * Y renderer of a Y axis. Must be defined!
	 */
	yRenderer: AxisRendererCurveY;

	/**
	 * If labels rotation should be adjusted to the axis rotation
	 */
	rotateLabels?: boolean;
}

export interface IAxisRendererCurveXPrivate extends IAxisRendererPrivate {
	scale?: number;
	centerX?: number;
	centerY?: number;
	axisLength?: number;
	autoScale?: boolean;
}

/**
 * Renderer for [[CurveChart]] "horizontal" axes.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/timeline/} for more info
 * @since 5.12.0
 * @important
 */
export class AxisRendererCurveX extends AxisRenderer {

	/**
	 * Chart this renderer is for.
	 */
	declare public chart: CurveChart | undefined;

	/**
	 * A list of labels in the axis.
	 *
	 * `labels.template` can be used to configure labels.
	 *
	 * @default new ListTemplate<AxisLabelRadial>
	 */
	public readonly labels: ListTemplate<AxisLabel> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => AxisLabel._new(this._root, {
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


	public static className: string = "AxisRendererCurveX";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererCurveX.className]);

	declare public _settings: IAxisRendererCurveXSettings;
	declare public _privateSettings: IAxisRendererCurveXPrivate;

	public pointPostion: Array<number> = [];

	public pointDistance: Array<number> = [];

	protected _normalizedPoints: Array<IPoint> = [];

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["renderer", "circular"]);
		super._afterNew();
		this.setPrivateRaw("letter", "X");
		this.setRaw("position", "absolute");
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("points")) {
			this._updateLayout();
		}

		if (this.isDirty("yRenderer")) {
			const yRenderer = this.get("yRenderer");
			yRenderer.set("xRenderer", this);
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
	public _updateLayout() {
		const chart = this.chart;
		if (chart) {
			const points = this.get("points");

			if (points) {
				// find extreme points
				let minX = Infinity;
				let minY = Infinity;
				let maxX = -Infinity;
				let maxY = -Infinity;

				let axisLength = 0;

				let prevPoint = points[0];

				$array.each(points, (point, i) => {
					minX = Math.min(minX, point.x);
					minY = Math.min(minY, point.y);
					maxX = Math.max(maxX, point.x);
					maxY = Math.max(maxY, point.y);
					axisLength += Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
					this.pointDistance[i] = axisLength;
					prevPoint = point;
				});

				$array.each(points, (_p, i) => {
					this.pointPostion[i] = this.pointDistance[i] / axisLength;
				});

				let yAxisLenght = this.get("yRenderer").get("axisLength", 0);
				let aw = maxX - minX + 2 * yAxisLenght;
				let ah = maxY - minY + 2 * yAxisLenght;

				// calculate center
				let centerX = (minX + maxX) / 2;
				let centerY = (minY + maxY) / 2;

				// take width and height of a chart
				let width = chart.innerWidth();
				let height = chart.innerHeight();

				// calculate scale
				let scaleX = width / aw;
				let scaleY = height / ah;

				// calculate scale
				let scale = Math.min(scaleX, scaleY);

				if (!this.getPrivate("autoScale", true)) {
					scale = 1;
				}

				this.axis.setPrivateRaw("width", aw * scale);
				this.axis.setPrivateRaw("height", ah * scale);
				this.setPrivateRaw("centerX", centerX);
				this.setPrivateRaw("centerY", centerY);
				this.setPrivateRaw("scale", scale);
				this.setPrivateRaw("axisLength", axisLength);

				this.set("draw", (display) => {
					display.moveTo((points[0].x - centerX) * scale, (points[0].y - centerY) * scale);
					$array.each(points, (point) => {
						display.lineTo((point.x - centerX) * scale, (point.y - centerY) * scale);
					});
				});

				prevPoint = points[0];

				this._normalizedPoints = [];
				$array.each(points, (point) => {
					let distance = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
					for (let i = 1; i < distance; i++) {
						let x = ((prevPoint.x + (point.x - prevPoint.x) * i / distance) - centerX) * scale;
						let y = ((prevPoint.y + (point.y - prevPoint.y) * i / distance) - centerY) * scale;

						// check distance to previous normalized point
						const prevNormalized = this._normalizedPoints[this._normalizedPoints.length - 1];
						if (prevNormalized) {
							let distance = Math.hypot(x - prevNormalized.x, y - prevNormalized.y);
							if (distance < .5) {
								continue;
							}
						}

						this._normalizedPoints.push({ x: x, y: y });
					}
					prevPoint = point;
				})

				this.axis.markDirtySize();
			}
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

			this.toggleVisibility(grid, position, 0, 1);

			const p0 = this.positionToPoint(position, 0);
			const p1 = this.positionToPoint(position, 1);

			grid.set("draw", (display) => {
				display.moveTo(p0.x, p0.y);
				display.lineTo(p1.x, p1.y);
			})
		}
	}

	/**
	 * Converts relative position to angle.
	 *
	 * @param   position  Position
	 * @return            Angle
	 */
	public positionToAngle(position: number): number {

		position = this.toGlobalPosition(position);

		let points = this.get("points");
		let axisLength = this.getPrivate("axisLength", 0);
		let angle = 0;

		// find which segment the position is in
		if (points) {
			let totalLength = 0;
			let prevPoint = points[0];

			$array.eachContinue(points, (point) => {
				let segmentLength = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
				totalLength += segmentLength;
				if (totalLength > position * axisLength) {
					angle = $math.getAngle(prevPoint, point) + 90;
					return false
				}
				prevPoint = point;
				return true;
			})

		}

		return angle;
	}

	public getPoints(positionX: number, positionY: number, endPositionX: number, endPositionY: number) {
		let yRenderer = this.get("yRenderer");
		let points = [];

		if (positionX > endPositionX) {
			[positionX, endPositionX] = [endPositionX, positionX];
		}

		if (positionY > endPositionY) {
			[positionY, endPositionY] = [endPositionY, positionY];
		}

		if (yRenderer) {
			let indexStart = this.positionToIndex(positionX);
			let indexEnd = this.positionToIndex(endPositionX);

			points.push(this.positionToPoint(positionX, positionY));

			for (let i = indexStart; i <= indexEnd + 1; i++) {
				let position = this.indexToPosition(i);
				if (position > positionX && position < endPositionX) {
					points.push(this.positionToPoint(position, positionY));
				}
			}

			points.push(this.positionToPoint(endPositionX, positionY));

			if (endPositionY != positionY) {
				points.push(this.positionToPoint(endPositionX, endPositionY));
				for (let i = indexEnd + 1; i >= indexStart; i--) {
					let position = this.indexToPosition(i);
					if (position > positionX && position < endPositionX) {
						points.push(this.positionToPoint(position, endPositionY));
					}
				}
				points.push(this.positionToPoint(positionX, endPositionY));
				points.push(points[0]);
			}
		}

		return points;
	}

	// do not delete
	protected _handleOpposite() { }


	public positionToIndex(position: number): number {
		let points = this.get("points");
		let axisLength = this.getPrivate("axisLength", 0);
		let index = 0;

		position = this.toGlobalPosition(position);

		if (points && points.length > 1) {
			let totalLength = 0;
			let prevPoint = points[0];

			if (position <= 0) {
				index = 0;
			}
			else if (position >= 1) {
				const len = points.length
				index = len - 1;
			}
			else {
				let i = 0;
				$array.eachContinue(points, (point) => {
					let segmentLength = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
					totalLength += segmentLength;
					if (totalLength >= position * axisLength) {
						index = i;
						return false
					}
					prevPoint = point;
					i++;
					return true;
				})
			}
		}

		return index;
	}

	public indexToPosition(index: number): number {
		let points = this.get("points");
		let axisLength = this.getPrivate("axisLength", 0);
		let position = 0;

		if (points && points.length > 1) {
			let totalLength = 0;
			let prevPoint = points[0];

			let i = 0;
			$array.eachContinue(points, (point) => {
				position = totalLength / axisLength;
				if (i == index) {
					return false
				}
				let segmentLength = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
				totalLength += segmentLength;
				prevPoint = point;
				i++;
				return true;
			})
		}

		return this.toAxisPosition(position);
	}

	public pointToPosition(point: IPoint): IPoint {
		let minDistance = Infinity;
		let index = 0;
		let prevPoint = this._normalizedPoints[0];
		let angle = 0;
		$array.each(this._normalizedPoints, (normalizedPoint, i) => {
			let distance = Math.hypot(normalizedPoint.x - point.x, normalizedPoint.y - point.y);
			if (distance < minDistance) {
				minDistance = distance;
				index = i;
				angle = $math.getAngle(point, normalizedPoint) - $math.getAngle(prevPoint, normalizedPoint);
			}
			prevPoint = normalizedPoint;
		})

		const yRenderer = this.get("yRenderer");
		const scale = this.getPrivate("scale", 1);
		const rendererY = this.get("yRenderer");

		const y = -minDistance / (yRenderer.get("axisLength", 0) * scale) * $math.sin(angle) + rendererY.get("axisLocation", 0);
		return { x: index / this._normalizedPoints.length, y: y };
	}


	/**
	 * Converts relative position to an X/Y coordinate.
	 *
	 * @param   position  Position
	 * @return            Point
	 */
	public positionToPoint(position: number, positionY?: number, doNotFix?: boolean): IPoint {

		if (positionY == undefined) {
			positionY = 0;
		}

		const rendererY = this.get("yRenderer");
		if (!doNotFix) {
			position = this.toGlobalPosition(position);
		}
		positionY = rendererY.toGlobalPosition(positionY);
		positionY -= rendererY.get("axisLocation", 0);

		let points = this.get("points");
		let axisLength = this.getPrivate("axisLength", 0);
		let scale = this.getPrivate("scale", 1);
		let pointOfPosition: IPoint = { x: 0, y: 0 };
		let angle = 0;

		// find which segment the position is in
		if (points && points.length > 1) {
			let totalLength = 0;
			let prevPoint = points[0];

			if (position <= 0) {
				angle = $math.getAngle(points[0], points[1]) + 90;
				pointOfPosition = points[0];
			}
			else if (position >= 1) {
				const len = points.length;
				angle = $math.getAngle(points[len - 2], points[len - 1]) + 90;
				pointOfPosition = points[len - 1];
			}
			else {
				$array.eachContinue(points, (point) => {
					let segmentLength = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
					totalLength += segmentLength;
					if (totalLength >= position * axisLength) {
						let segementStartPosition = (totalLength - segmentLength) / axisLength;
						let segmentPosition = (position * axisLength - segementStartPosition * axisLength) / segmentLength;

						pointOfPosition = { x: prevPoint.x + (point.x - prevPoint.x) * segmentPosition, y: prevPoint.y + (point.y - prevPoint.y) * segmentPosition };
						angle = $math.getAngle(prevPoint, point) + 90;
						return false
					}
					prevPoint = point;
					return true;
				})
			}
		}

		let centerX = this.getPrivate("centerX", 0);
		let centerY = this.getPrivate("centerY", 0);

		let axisX = (pointOfPosition.x - centerX) * scale;
		let axisY = (pointOfPosition.y - centerY) * scale;

		if (positionY == null) {
			positionY = 0;
		}

		let lengthY = -rendererY.get("axisLength", 0);

		let dy = lengthY * positionY * scale;

		let x = axisX + $math.cos(angle) * dy;
		let y = axisY + $math.sin(angle) * dy;

		return { x: x, y: y };
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabel, position?: number, endPosition?: number, count?: number) {
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

			const angle = this.positionToAngle(position);

			const rendererY = this.get("yRenderer");
			const axisY = rendererY.axis;

			const point = this.positionToPoint(position, axisY.get("start", 0) + rendererY.get("axisLocation", 0));

			label.setAll({
				x: point.x,
				y: point.y
			});

			if (this.get("rotateLabels", true)) {
				label.set("rotation", angle - 90);
			}

			this.toggleVisibility(label, position, label.get("minPosition", 0), label.get("maxPosition", 1));
		}
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
				length *= -1;
			}

			let angle = this.positionToAngle(position);

			this.toggleVisibility(tick, position, tick.get("minPosition", 0), tick.get("maxPosition", 1));

			const rendererY = this.get("yRenderer");
			const axisY = rendererY.axis;

			const point = this.positionToPoint(position, axisY.get("start"));

			tick.set("draw", (display) => {
				display.moveTo(point.x, point.y);
				display.lineTo(point.x - length * $math.cos(angle), point.y - length * $math.sin(angle));
			})
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

				const rendererY = this.get("yRenderer");
				const axisY = rendererY.axis;

				const point = this.positionToPoint(position, axisY.get("start"));
				sprite.setAll({ x: point.x, y: point.y });

				this.toggleVisibility(sprite, position, 0, 1);
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

			const yRenderer = this.get("yRenderer");
			const yAxis = yRenderer.axis

			const points = this.getPoints(position, yAxis.get("start", 0), endPosition, yAxis.get("end", 1));

			fill.set("draw", (display) => {
				display.moveTo(points[0].x, points[0].y);
				$array.each(points, (point) => {
					display.lineTo(point.x, point.y);
				})
				display.closePath();
			})
		}
	}


	/**
	 * Returns axis length in pixels.
	 *
	 * @return Length
	 */
	public axisLength(): number {
		return this.getPrivate("axisLength", 0);
	}

	/**
	 * @ignore
	 */
	public positionTooltip(tooltip: Tooltip, position: number) {
		const yRenderer = this.get("yRenderer");
		const start = yRenderer.axis.get("start", 0);
		const end = yRenderer.axis.get("end", 1);
		const point = this.positionToPoint(position, yRenderer.get("axisLocation", 0.5) * (end - start) + start);
		this._positionTooltip(tooltip, point);
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) {

	}
}
