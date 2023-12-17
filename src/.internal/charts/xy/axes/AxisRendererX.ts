import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "./AxisRenderer";
import { p100 } from "../../../core/util/Percent";
import type { IPoint } from "../../../core/util/IPoint";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";
import type { AxisLabel } from "./AxisLabel";
import type { Grid } from "./Grid";
import type { AxisTick } from "./AxisTick";
import type { Graphics } from "../../../core/render/Graphics";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { Template } from "../../../core/util/Template";
import type { AxisBullet } from "./AxisBullet";
import { Rectangle } from "../../../core/render/Rectangle";


export interface IAxisRendererXSettings extends IAxisRendererSettings {

	/**
	 * If set to `true` the axis will be drawn on the opposite side of the plot
	 * area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Axis_position} for more info
	 * @default false
	 */
	opposite?: boolean;

	/**
	 * If set to `true`, all axis elements (ticks, labels) will be drawn inside
	 * plot area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Labels_ticks_inside_plot_area} for more info
	 * @default false
	 */
	inside?: boolean;
}

export interface IAxisRendererXPrivate extends IAxisRendererPrivate {
}

/**
 * Used to render horizontal axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/#Axis_renderer} for more info
 * @important
 */
export class AxisRendererX extends AxisRenderer {

	public static className: string = "AxisRendererX";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererX.className]);

	declare public _settings: IAxisRendererXSettings;
	declare public _privateSettings: IAxisRendererXPrivate;

	declare public readonly labelTemplate: Template<AxisLabel>;

	public thumb: Rectangle = Rectangle.new(this._root, { width: p100, isMeasured: false, themeTags: ["axis", "x", "thumb"] });

	public _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["renderer", "x"]);

		super._afterNew();
		this.setPrivateRaw("letter", "X");

		const gridTemplate = this.grid.template;
		gridTemplate.set("height", p100);
		gridTemplate.set("width", 0);
		gridTemplate.set("draw", (display, graphics) => {
			display.moveTo(0, 0);
			display.lineTo(0, graphics.height());
		});

		this.set("draw", (display, graphics) => {
			display.moveTo(0, 0);
			display.lineTo(graphics.width(), 0);
		});
	}

	public _changed() {
		super._changed();

		const axis = this.axis;
		axis.ghostLabel.setPrivate("visible", !this.get("inside"));
		axis.ghostLabel.set("x", -1000);

		const opposite = "opposite"
		const inside = "inside";

		if (this.isDirty(opposite) || this.isDirty(inside)) {
			const chart = this.chart;
			const axisChildren = axis.children;

			if (this.get(inside)) {
				axis.addTag(inside);
			}
			else {
				axis.removeTag(inside);
			}

			if (chart) {
				if (this.get(opposite)) {
					const children = chart.topAxesContainer.children;
					if (children.indexOf(axis) == -1) {
						children.insertIndex(0, axis);
					}
					axis.addTag(opposite);
					axisChildren.moveValue(this);

				}
				else {
					const children = chart.bottomAxesContainer.children;
					if (children.indexOf(axis) == -1) {
						children.moveValue(axis);
					}
					axis.removeTag(opposite);

					axisChildren.moveValue(this, 0);

				}

				axis.ghostLabel._applyThemes();
				this.labels.each((label) => {
					label._applyThemes();
				})
				this.root._markDirtyRedraw();
			}
			axis.markDirtySize();
		}

		this.thumb.setPrivate("height", axis.labelsContainer.height());
	}


	protected _getPan(point1: IPoint, point2: IPoint): number {
		return (point2.x - point1.x) / this.width();
	}

	/**
	 * @ignore
	 */
	public toAxisPosition(position: number): number {
		const start = this._start || 0;
		const end = this._end || 1;

		position -= this._ls;

		position = position * (end - start) / this._lc;
		if (!this.get("inversed")) {
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

		if (!this.get("inversed")) {
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
	public _updateLC() {
		const axis = this.axis;
		const parent = axis.parent;
		if (parent) {
			const w = parent.innerWidth();
			this._lc = this.axisLength() / w;
			this._ls = (axis.x() - parent.get("paddingLeft", 0)) / w;
		}
	}

	/**
	 * @ignore
	 */
	public _updatePositions() {
		const axis = this.axis;
		const x = axis.x() - $utils.relativeToValue(axis.get("centerX", 0), axis.width()) - axis.parent!.get("paddingLeft", 0);
		axis.gridContainer.set("x", x);
		axis.topGridContainer.set("x", x);
		axis.bulletsContainer.set("y", this.y());

		const chart = axis.chart;
		if (chart) {
			const plotContainer = chart.plotContainer;
			const axisHeader = axis.axisHeader;
			let width = axis.get("marginLeft", 0);

			let x = axis.x() - width;

			const parent = axis.parent;
			if (parent) {
				x -= parent.get("paddingLeft", 0);
			}

			if (axisHeader.children.length > 0) {
				width = axis.axisHeader.width();
				axis.set("marginLeft", width + 1);
			}
			else {
				axisHeader.set("width", width);
			}
			axisHeader.setAll({ x: x, y: -1, height: plotContainer.height() + 2 });
		}
	}

	/**
	 * @ignore
	 */
	public processAxis() {
		super.processAxis();
		const axis = this.axis;
		if (axis.get("width") == null) {
			axis.set("width", p100);
		};
		const verticalLayout = this._root.verticalLayout;
		axis.set("layout", verticalLayout);
		axis.labelsContainer.set("width", p100);
		axis.axisHeader.setAll({ layout: verticalLayout });
	}

	/**
	 * @ignore
	 */
	public axisLength(): number {
		return this.axis.width();
	}

	/**
	 * Converts axis relative position to actual coordinate in pixels.
	 *
	 * @param   position  Position
	 * @return            Point
	 */
	public positionToPoint(position: number): IPoint {
		return { x: this.positionToCoordinate(position), y: 0 };
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
				location = tick.get("multiLocation", location)
			}
			else {
				location = tick.get("location", location)
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			tick.set("x", this.positionToCoordinate(position));

			let length = tick.get("length", 0);
			const inside = tick.get("inside", this.get("inside", false));

			if (this.get("opposite")) {
				tick.set("y", p100);
				if (!inside) {
					length *= -1
				}
			}
			else {
				tick.set("y", 0);
				if (inside) {
					length *= -1
				}
			}
			tick.set("draw", (display) => {
				display.moveTo(0, 0);
				display.lineTo(0, length);
			})

			this.toggleVisibility(tick, position, tick.get("minPosition", 0), tick.get("maxPosition", 1));
		}
	}

	/**
	 * @ignore
	 */
	public updateLabel(label?: AxisLabel, position?: number, endPosition?: number, count?: number) {
		if (label) {
			let location = 0.5;
			if ($type.isNumber(count) && count > 1) {
				location = label.get("multiLocation", location)
			}
			else {
				location = label.get("location", location)
			}

			if (!$type.isNumber(position)) {
				position = 0;
			}

			const inside = label.get("inside", this.get("inside", false));

			const opposite = this.get("opposite");
			if (opposite) {
				if (!inside) {
					label.set("position", "relative");
					label.set("y", p100);
				}
				else {
					label.set("position", "absolute");
					label.set("y", 0)
				}
			}
			else {
				if (!inside) {
					label.set("y", undefined);
					label.set("position", "relative");
				}
				else {
					label.set("y", 0)
					label.set("position", "absolute");
				}
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			label.set("x", this.positionToCoordinate(position));
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

			grid.set("x", this.positionToCoordinate(position));

			this.toggleVisibility(grid, position, 0, 1);
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
				let d = -1;
				if (this.get("opposite")) {
					d = 1;
				}

				if (bullet.get("stacked")) {
					if (previousBullet) {
						let previousSprite = previousBullet.get("sprite");
						if (previousSprite) {
							sprite.set("y", previousSprite.y() + previousSprite.height() * d);
						}
					}
					else {
						sprite.set("y", 0);
					}
				}

				this.axis._bullets[bulletPosition] = bullet;
				sprite.set("x", this.positionToCoordinate(position));
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

			let x0 = this.positionToCoordinate(position);
			let x1 = this.positionToCoordinate(endPosition);

			this.fillDrawMethod(fill, x0, x1);
		}
	}

	protected fillDrawMethod(fill: Graphics, x0: number, x1: number) {
		fill.set("draw", (display) => {
			//display.drawRect(x0, 0, x1 - x0, this.axis!.gridContainer.height());
			// using for holes, so can not be rectangle
			const h = this.axis!.gridContainer.height();
			const w = this.width();

			if (x1 < x0) {
				[x1, x0] = [x0, x1];
			}
			if (x0 > w || x1 < 0) {
				return;
			}

			/*
			const limit = 10000;

			x0 = Math.max(-limit, x0);
			x1 = Math.min(limit, x1);
			*/

			display.moveTo(x0, 0);
			display.lineTo(x1, 0);
			display.lineTo(x1, h);
			display.lineTo(x0, h);
			display.lineTo(x0, 0);
		})
	}

	/**
	 * @ignore
	 */
	public positionTooltip(tooltip: Tooltip, position: number) {
		this._positionTooltip(tooltip, { x: this.positionToCoordinate(position), y: 0 })
	}

	/**
	 * @ignore
	 */
	public updateTooltipBounds(tooltip: Tooltip) {
		const inside = this.get("inside");
		const num = 100000;

		let global = this._display.toGlobal({ x: 0, y: 0 });
		let x = global.x;
		let y = 0;
		let w = this.axisLength();
		let h = num;

		let pointerOrientation: "up" | "down" = "up";

		if (this.get("opposite")) {
			if (inside) {
				pointerOrientation = "up";
				y = global.y;
				h = num;
			}
			else {
				pointerOrientation = "down";
				y = global.y - num;
				h = num;
			}
		}
		else {
			if (inside) {
				pointerOrientation = "down";
				y = global.y - num;
				h = num;
			}
			else {
				pointerOrientation = "up";
				y = global.y;
				h = num;
			}
		}

		const bounds = { left: x, right: x + w, top: y, bottom: y + h };
		const oldBounds = tooltip.get("bounds");

		if (!$utils.sameBounds(bounds, oldBounds)) {
			tooltip.set("bounds", bounds);
			tooltip.set("pointerOrientation", pointerOrientation);
		}
	}
}
