import type { Root } from "../../../core/Root";
import { AxisRenderer, IAxisRendererSettings, IAxisRendererPrivate } from "./AxisRenderer";
import { p100 } from "../../../core/util/Percent";
import type { IPoint } from "../../../core/util/IPoint";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";
import type { Graphics } from "../../../core/render/Graphics";
import type { AxisLabel } from "./AxisLabel";
import type { AxisBullet } from "./AxisBullet";
import type { Grid } from "./Grid";
import type { AxisTick } from "./AxisTick";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { Template } from "../../../core/util/Template";

export interface IAxisRendererYSettings extends IAxisRendererSettings {

	/**
	 * If set to `true` the axis will be drawn on the opposite side of the plot
	 * area.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/axes/#Axis_position} for more info
	 * @default false
	 */
	opposite?: boolean;

	/**
	 * If set to `true`, all axis elements (ticks, labels) will be drawn inside
	 * plot area.
	 *
	 * @default false
	 */
	inside?: boolean;

}

export interface IAxisRendererYPrivate extends IAxisRendererPrivate {
}

/**
 * Used to render vertical axis.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/xy-chart/#Axis_renderer} for more info
 * @important
 */
export class AxisRendererY extends AxisRenderer {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: AxisRendererY["_settings"], template?: Template<AxisRendererY>): AxisRendererY {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["renderer", "y"]);
		if (settings.opposite) {
			settings.themeTags.push("opposite");
		}
		const x = new AxisRendererY(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "AxisRendererY";
	public static classNames: Array<string> = AxisRenderer.classNames.concat([AxisRendererY.className]);

	declare public _settings: IAxisRendererYSettings;
	declare public _privateSettings: IAxisRendererYPrivate;

	declare public readonly labelTemplate: Template<AxisLabel>;

	public _afterNew() {
		super._afterNew();
		this._setPrivate("letter", "Y");

		const labelTemplate = this.labels.template;
		labelTemplate.set("centerX", 0);
		//labelTemplate.set("x", p100);

		const gridTemplate = this.grid.template;
		gridTemplate.set("width", p100);
		gridTemplate.set("height", 0);
		gridTemplate.set("draw", (display, graphics) => {
			display.moveTo(0, 0);
			display.lineTo(graphics.width(), 0);
		});

		this.setAll({ width: 0, height: p100 });
		this.set("draw", (display, graphics) => {
			display.moveTo(0, 0);
			display.lineTo(0, graphics.height());
		});
	}

	public _changed() {
		super._changed();

		const axis = this.axis;

		if (this.isDirty("inside")) {
			axis.markDirtySize();
		}

		if (this.isDirty("opposite")) {

			const chart = this.chart;
			const axisChildren = axis.children;

			if (chart) {
				if (this.get("opposite")) {
					const children = chart.rightAxesContainer.children;
					children.removeValue(axis);
					children.insertIndex(0, axis);
					axisChildren.removeValue(this);
					axisChildren.insertIndex(0, this);
					this.addTag("opposite");
				}
				else {
					chart.leftAxesContainer.children.moveValue(axis);
					axisChildren.removeValue(this);
					axisChildren.push(this);
					this.removeTag("opposite");
				}
				axis.markDirtySize();
			}
		}
	}

	/**
	 * @ignore
	 */
	public processAxis() {
		super.processAxis();
		const axis = this.axis;
		if (axis.get("height") == null) {
			axis.set("height", p100);
		}
		axis.set("layout", this._root.horizontalLayout);
		axis.labelsContainer.set("height", p100);
		axis.labelsContainer._user_id = "axx";
		axis.axisHeader.set("layout", this._root.horizontalLayout);
	}

	public _updatePositions() {
		const axis = this.axis;
		axis.gridContainer.set("y", axis.y() - $utils.relativeToValue(axis.get("centerY", 0), axis.height()));

		const chart = axis.chart;
		if (chart) {
			const plotContainer = chart.plotContainer;
			const axisHeader = axis.axisHeader;
			let height = axis.get("marginTop", 0);

			if (axisHeader.children.length > 0) {
				height = axis.axisHeader.height();
				axis.set("marginTop", height);
			}
			else {
				axisHeader.set("height", height);
			}
			axisHeader.setAll({ y: axis.y() - height, width: plotContainer.width() });
		}
	}

	/**
	 * @ignore
	 */
	public axisLength(): number {
		return this.axis.height();
	}

	/**
	 * Converts axis relative position to actual coordinate in pixels.
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
				label.set("centerX", 0);
				label.set("x", 0);

				if (inside) {
					label.set("position", "absolute");
				}
				else {
					label.set("position", "relative");
				}
			}
			else {
				if (inside) {
					label.set("x", 0);
					label.set("position", "absolute");
					label.set("centerX", 0);
				}
				else {
					label.set("x", undefined);
					label.set("position", "relative");
					label.set("centerX", p100);
				}
			}

			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			label.set("y", this.positionToCoordinate(position));
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

			let y = this.positionToCoordinate(position);

			grid.set("y", y);

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

			tick.set("y", this.positionToCoordinate(position));

			let length = tick.get("length", 0);
			const inside = tick.get("inside", this.get("inside", false));

			if (this.get("opposite")) {
				tick.set("x", 0);
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
			if (!$type.isNumber(position)) {
				position = 0;
			}

			let location = bullet.get("location", 0.5);
			if ($type.isNumber(endPosition) && endPosition != position) {
				position = position + (endPosition - position) * location;
			}

			bullet.set("y", this.positionToCoordinate(position));

			this.toggleVisibility(bullet, position, 0, 1);
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
			display.drawRect(0, y0, this.axis!.gridContainer.width(), y1 - y0);
		})
	}

	/**
	 * Converts relative position (0-1) on axis to a pixel coordinate.
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

		tooltip.set("bounds", { left: x, right: x + w, top: y, bottom: y + h });
		tooltip.set("pointerOrientation", pointerOrientation);
	}

	/**
	 * @ignore
	 */
	public toAxisPosition(position: number): number {
		const start = this.axis.get("start")!;
		const end = this.axis.get("end")!;

		position = position * (end - start);
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
	public fixPosition(position: number) {
		if (!this.get("inversed")) {
			return 1 - position;
		}
		return position;
	}

}
