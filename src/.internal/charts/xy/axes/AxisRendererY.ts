import type { IPoint } from "../../../core/util/IPoint";
import type { Graphics } from "../../../core/render/Graphics";
import type { AxisLabel } from "./AxisLabel";
import type { AxisBullet } from "./AxisBullet";
import type { Grid } from "./Grid";
import type { AxisTick } from "./AxisTick";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { Template } from "../../../core/util/Template";

import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "./AxisRenderer";
import { p100 } from "../../../core/util/Percent";
import { Rectangle } from "../../../core/render/Rectangle";

import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";

export interface IAxisRendererYSettings extends IAxisRendererSettings {

	/**
	 * Puts the axis on the right of the plot area instead of the left.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_position} for more info
	 * @default false
	 */
	opposite?: boolean;

	/**
	 * Draws the axis's labels and ticks inside the plot area.
	 *
	 * @default false
	 */
	inside?: boolean;
}

export interface IAxisRendererYPrivate extends IAxisRendererPrivate {
}

/**
 * Renderer for a vertical (Y) axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/#Axis_renderer} for more info
 * @important
 */
export class AxisRendererY extends AxisRenderer {

	public static className: string = "AxisRendererY";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererY.className]);

	declare public _settings: IAxisRendererYSettings;
	declare public _privateSettings: IAxisRendererYPrivate;

	declare public readonly labelTemplate: Template<AxisLabel>;

	protected _downY?: number;

	public thumb: Rectangle = Rectangle.new(this._root, { height: p100, isMeasured: false, themeTags: ["axis", "y", "thumb", "zoomgrip"] })._markC("height", "isMeasured", "themeTags");

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["renderer", "y"]);
		if (this._settings.opposite) {
			this._settings.themeTags.push("opposite");
		}

		super._afterNew();
		this.setPrivateRaw("letter", "Y");

		const gridTemplate = this.grid.template;
		gridTemplate._setC("width", p100);
		gridTemplate._setC("height", 0);
		gridTemplate._setC("draw", (display, graphics) => {
			display.moveTo(0, 0);
			display.lineTo(graphics.width(), 0);
		});

		this.set("draw", (display, renderer) => {
			display.moveTo(0, 0);
			display.lineTo(0, renderer.height());
		});
	}

	protected _getPan(point1: IPoint, point2: IPoint): number {
		return (point1.y - point2.y) / this.height();
	}

	public _changed() {
		super._changed();

		const axis = this.axis;
		const ghostLabel = axis.ghostLabel;
		if (ghostLabel) {
			ghostLabel.setPrivate("visible", !this.get("inside"));
			ghostLabel._setC("y", -1000);
		}

		const thumb = this.thumb;
		const opposite = "opposite";
		const inside = "inside";
		const chart = this.chart;

		if (this.isDirty(opposite) || this.isDirty(inside)) {

			const axisChildren = axis.children;

			if (this.get(inside)) {
				axis.addTag(inside);
			}
			else {
				axis.removeTag(inside);
			}

			if (chart) {
				if (this.get(opposite)) {
					const children = chart.rightAxesContainer.children;
					if (children.indexOf(axis) == -1) {
						children.moveValue(axis, 0);
					}
					axis.addTag(opposite);
					axisChildren.moveValue(this, 0);
				}
				else {
					const children = chart.leftAxesContainer.children;
					if (children.indexOf(axis) == -1) {
						children.moveValue(axis);
					}
					axis.removeTag(opposite);

					axisChildren.moveValue(this);
				}

				chart._keepScrollbarsInPlace();

				axis.ghostLabel?._applyThemes();
				this.labels.each((label) => {
					label._applyThemes();
				})
				this.root._markDirtyRedraw();
			}
			axis.markDirtySize();
		}

		const w = axis.labelsContainer.width();

		if (chart) {
			if (this.get(opposite)) {
				thumb._setC("centerX", 0);
			}
			else {
				thumb._setC("centerX", w);
			}
		}

		thumb.setPrivate("width", w);
	}

	/**
	 * @ignore
	 */
	public processAxis() {
		super.processAxis();
		const axis = this.axis;
		if (axis.get("height") == null) {
			axis._setC("height", p100);
		}
		const horizontalLayout = this._root.horizontalLayout;
		axis._setC("layout", horizontalLayout);
		axis.labelsContainer.set("height", p100);
		axis.axisHeader._setC("layout", horizontalLayout);
	}

	public _updatePositions() {
		const axis = this.axis;
		const y = axis.y() - $utils.relativeToValue(axis.get("centerY", 0), axis.height());
		axis.gridContainer._setC("y", y);
		axis.topGridContainer._setC("y", y);
		axis.bulletsContainer._setC("x", this.x());

		const chart = axis.chart;
		if (chart) {
			const plotContainer = chart.plotContainer;
			const axisHeader = axis.axisHeader;
			let height = axis.get("marginTop", 0);

			if (axisHeader.children.length > 0) {
				// The height set while the header was empty would keep it at zero, so
				// the axis never makes room for what was put there later
				if (axisHeader.isComputedSetting("height")) {
					axisHeader.remove("height");
				}
				height = axis.axisHeader.height();
				axis._setC("marginTop", height + 1);
			}
			else {
				axisHeader._setC("height", height);
			}
			axisHeader._setCAll({ y: axis.y() - height, x: -1, width: plotContainer.width() + 2 });
		}
	}

	/**
	 * @ignore
	 */
	public axisLength(): number {
		return this.axis.innerHeight();
	}

	/**
	 * Converts a position on the axis (`0` to `1`) to a point in pixels,
	 * relative to the axis.
	 *
	 * @param   position  Position
	 * @return            Point
	 */
	public positionToPoint(position: number): IPoint {
		return { x: 0, y: this.positionToCoordinate(position) };
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabel, position?: number, endPosition?: number, count?: number) {
		if (label) {
			if (!$type.isNumber(position)) {
				position = 0;
			}

			let location = 0.5;
			if ($type.isNumber(count) && count > 1) {
				location = label.get("multiLocation", location)
			}
			else {
				location = label.get("location", location)
			}

			const opposite = this.get("opposite");
			const inside = label.get("inside", this.get("inside", false));

			if (opposite) {
				label._setC("x", 0);

				if (inside) {
					label._setC("position", "absolute");
				}
				else {
					label._setC("position", "relative");
				}
			}
			else {
				if (inside) {
					label._setC("x", 0);
					label._setC("position", "absolute");
				}
				else {
					label._setC("x", undefined);
					label._setC("position", "relative");
				}
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			label._setC("y", this.positionToCoordinate(position));
			this.toggleVisibility(label, position, label.get("minPosition", 0), label.get("maxPosition", 1));
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

			grid._setC("y", this.positionToCoordinate(position));
			this.toggleVisibility(grid, position, 0, 1);
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

			tick._setC("y", this.positionToCoordinate(position));

			let length = tick.get("length", 0);
			const inside = tick.get("inside", this.get("inside", false));

			if (this.get("opposite")) {
				tick._setC("x", 0);
				if (inside) {
					length *= -1
				}
			}
			else {
				if (!inside) {
					length *= -1
				}
			}
			tick.set("draw", (display) => {
				display.moveTo(0, 0);
				display.lineTo(length, 0);
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


				let bulletPosition = this.axis.roundAxisPosition(position, location);
				let previousBullet = this.axis._bullets[bulletPosition];
				let d = 1;
				if (this.get("opposite")) {
					d = -1;
				}

				if (bullet.get("stacked")) {
					if (previousBullet) {
						let previousSprite = previousBullet.get("sprite");
						if (previousSprite) {
							sprite._setC("x", previousSprite.x() + previousSprite.width() * d);
						}
					}
					else {
						sprite._setC("x", 0);
					}
				}
				else if (sprite.get("x") == null) {
					// An absolute sprite with no `x` ignores `dx`
					sprite._setC("x", 0);
				}

				this.axis._bullets[bulletPosition] = bullet;


				sprite._setC("y", this.positionToCoordinate(position));

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

			let y0 = this.positionToCoordinate(position);
			let y1 = this.positionToCoordinate(endPosition);

			this.fillDrawMethod(fill, y0, y1);
		}
	}

	protected fillDrawMethod(fill: Graphics, y0: number, y1: number) {
		fill.set("draw", (display) => {
			// using for holes, so can not be rectangle
			const w = this.axis!.gridContainer.width();
			const h = this.height();

			if (y1 < y0) {
				[y1, y0] = [y0, y1];
			}

			if (y0 > h || y1 < 0) {
				return;
			}

			//y0 = Math.max(0, y0);
			//y1 = Math.min(h, y1);

			display.moveTo(0, y0);
			display.lineTo(w, y0);
			display.lineTo(w, y1);
			display.lineTo(0, y1);
			display.lineTo(0, y0);
		})
	}

	/**
	 * Converts a position on the axis (`0` to `1`, `0` being the bottom unless
	 * `inversed`) to a pixel coordinate from the axis's top edge, taking zoom
	 * into account.
	 *
	 * @param position  Position (0-1)
	 * @return Coordinate (px)
	 */
	public positionToCoordinate(position: number): number {
		if (!this._inversed) {
			return (this._end - position) * this._axisLength;
		}
		else {
			return (position - this._start) * this._axisLength;
		}
	}

	/**
	 * @ignore
	 */
	public positionTooltip(tooltip: Tooltip, position: number) {
		this._positionTooltip(tooltip, { x: 0, y: this.positionToCoordinate(position) });
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(tooltip: Tooltip) {
		const inside = this.get("inside");
		const num = 100000;

		let global = this._display.toGlobal({ x: 0, y: 0 });
		let y = global.y;
		let x = 0;
		let h = this.axisLength();
		let w = num;

		let pointerOrientation: "left" | "right" = "right";

		if (this.get("opposite")) {
			if (inside) {
				pointerOrientation = "right";
				x = global.x - num;
				w = num;
			}
			else {
				pointerOrientation = "left";
				x = global.x;
				w = num;
			}
		}
		else {
			if (inside) {
				pointerOrientation = "left";
				x = global.x;
				w = num;
			}
			else {
				pointerOrientation = "right";
				x = global.x - num;
				w = num;
			}
		}

		const bounds = { left: x, right: x + w, top: y, bottom: y + h };
		const oldBounds = tooltip.get("bounds");

		if (!$utils.sameBounds(bounds, oldBounds)) {
			tooltip.set("bounds", bounds);
			tooltip._setC("pointerOrientation", pointerOrientation);
		}
	}

	/**
	 * @ignore
	 */
	public _updateLC() {
		const axis = this.axis;
		const parent = axis.parent;
		if (parent) {
			const h = parent.innerHeight();
			this._lc = this.axisLength() / h;
			this._ls = axis.y() / h;
		}
	}

	/**
	 * @ignore
	 */
	public toAxisPosition(position: number): number {
		const start = this._start || 0;
		const end = this._end || 1;

		position -= this._ls;

		position = position * (end - start) / this._lc;

		if (this.get("inversed")) {
			position = start + position;
		}
		else {
			position = end - position;
		}

		return position;
	}

	/**
	 * @ignore
	 */
	public toGlobalPosition(position: number): number {
		const start = this._start || 0;
		const end = this._end || 1;

		if (this.get("inversed")) {
			position = position - start;
		}
		else {
			position = end - position;
		}

		position = position / (end - start) * this._lc

		position += this._ls;

		return position;
	}


	/**
	 * @ignore
	 */
	public fixPosition(position: number) {
		if (!this.get("inversed")) {
			return 1 - position;
		}
		return position;
	}

}
