import type { Sprite } from "../../../core/render/Sprite";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../../core/render/Graphics";
import type { Axis, IAxisDataItem } from "./Axis";
import { Template } from "../../../core/util/Template";
import { ListTemplate } from "../../../core/util/List";
import { AxisTick } from "./AxisTick";
import { Grid } from "./Grid";
import { AxisLabel } from "./AxisLabel";
import type { IPoint } from "../../../core/util/IPoint";
import type { Tooltip } from "../../../core/render/Tooltip";
import type { AxisBullet } from "./AxisBullet";
import type { XYChart } from "../XYChart";
import type { DataItem } from "../../../core/render/Component";
import * as $utils from "../../../core/util/Utils";

export interface IAxisRendererSettings extends IGraphicsSettings {

	/**
	 * The minimum distance between grid lines in pixels.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Grid_density} for more info
	 */
	minGridDistance?: number;

	/**
	 * Set to `true` to invert direction of the axis.
	 *
	 * @default false
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Inversed_axes} for more info
	 */
	inversed?: boolean;

	/**
	 * Indicates relative position where "usable" space of the cell starts.
	 *
	 * `0` - beginning, `1` - end, or anything in-between.
	 * 
	 * @default 0
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Cell_start_end_locations} for more info
	 */
	cellStartLocation?: number;

	/**
	 * Indicates relative position where "usable" space of the cell ends.
	 *
	 * `0` - beginning, `1` - end, or anything in-between.
	 * 
	 * @default 1
	 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/axes/#Cell_start_end_locations} for more info
	 */
	cellEndLocation?: number;

}

export interface IAxisRendererPrivate extends IGraphicsPrivate {
	letter?: "X" | "Y";
}

/**
 * Base class for an axis renderer.
 *
 * Should not be used on its own.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/xy-chart/#Axis_renderer} for more info
 */
export abstract class AxisRenderer extends Graphics {
	public static className: string = "AxisRenderer";
	public static classNames: Array<string> = Graphics.classNames.concat([AxisRenderer.className]);

	// save for quick access
	public _axisLength: number = 100;
	public _start: number = 0;
	public _end: number = 1;
	public _inversed: boolean = false;

	protected _minSize: number = 0;

	/**
	 * Chart the renderer is used in.
	 */
	public chart: XYChart | undefined;

	/**
	 * @ignore
	 */
	public makeTick(dataItem: DataItem<IAxisDataItem>): AxisTick {
		const tick = this.axis.labelsContainer.children.push(this.ticks.make());
		tick._setDataItem(dataItem);
		dataItem.set("tick", tick);
		this.ticks.push(tick);
		return tick;
	}

	/**
	 * A list of ticks in the axis.
	 *
	 * `ticks.template` can be used to configure ticks.
	 *
	 * @default new ListTemplate<AxisTick>
	 */
	public readonly ticks: ListTemplate<AxisTick> = new ListTemplate(
		Template.new({}),
		() => AxisTick.new(this._root, {
			themeTags: $utils.mergeTags(this.ticks.template.get("themeTags", []), this.get("themeTags", []))
		}, this.ticks.template)
	);

	/**
	 * @ignore
	 */
	public makeGrid(dataItem: DataItem<IAxisDataItem>): Grid {
		const grid = this.axis.gridContainer.children.push(this.grid.make());
		grid._setDataItem(dataItem);
		dataItem.set("grid", grid);
		this.grid.push(grid);
		return grid;
	}

	/**
	 * A list of grid elements in the axis.
	 *
	 * `grid.template` can be used to configure grid.
	 *
	 * @default new ListTemplate<Grid>
	 */
	public readonly grid: ListTemplate<Grid> = new ListTemplate(
		Template.new({}),
		() => Grid.new(this._root, {
			themeTags: $utils.mergeTags(this.grid.template.get("themeTags", []), this.get("themeTags", []))
		}, this.grid.template)
	);

	/**
	 * @ignore
	 */
	public makeAxisFill(dataItem: DataItem<IAxisDataItem>): Grid {
		const axisFill = this.axis.gridContainer.children.push(this.axisFills.make());
		axisFill._setDataItem(dataItem);
		dataItem.set("axisFill", axisFill);
		this.axisFills.push(axisFill);
		return axisFill;
	}

	/**
	 * A list of fills in the axis.
	 *
	 * `axisFills.template` can be used to configure axis fills.
	 *
	 * @default new ListTemplate<Graphics>
	 */
	public readonly axisFills: ListTemplate<Graphics> = new ListTemplate(
		Template.new({}),
		() => Graphics.new(this._root, {
			themeTags: $utils.mergeTags(this.axisFills.template.get("themeTags", ["fill"]), this.get("themeTags", []))
		}, this.axisFills.template)
	);

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<IAxisDataItem>): AxisLabel {
		const label = this.axis.labelsContainer.children.moveValue(this.labels.make(), 0);
		label._setDataItem(dataItem);
		dataItem.set("label", label);
		this.labels.push(label);
		return label;
	}

	/**
	 * A list of labels in the axis.
	 *
	 * `labels.template` can be used to configure axis labels.
	 *
	 * @default new ListTemplate<AxisLabel>
	 */
	public readonly labels: ListTemplate<AxisLabel> = new ListTemplate(
		Template.new({}),
		() => AxisLabel.new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), this.get("themeTags", []))
		}, this.labels.template)
	);


	declare public _settings: IAxisRendererSettings;
	declare public _privateSettings: IAxisRendererPrivate;

	/**
	 * An [[Axis]] renderer is for.
	 */
	public axis!: Axis<this>;

	public axisLength(): number {
		return 0;
	}

	/**
	 * @ignore
	 */
	public gridCount(): number {
		return this.axisLength() / this.get("minGridDistance", 50);
	}

	public _updatePositions() {

	}

	/**
	 * @ignore
	 */
	public abstract updateLabel(_label?: AxisLabel, _position?: number, _endPosition?: number, _count?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateGrid(_grid?: Grid, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateTick(_grid?: AxisTick, _position?: number, _endPosition?: number, _count?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateFill(_fill?: Graphics, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract updateBullet(_bullet?: AxisBullet, _position?: number, _endPosition?: number): void;

	/**
	 * @ignore
	 */
	public abstract positionToPoint(_position: number): IPoint;

	protected _afterNew() {
		super._afterNew();
		this.set("isMeasured", false);
	}

	/**
	 * Converts relative position (0-1) on axis to a pixel coordinate.
	 *
	 * @param position  Position (0-1)
	 * @return Coordinate (px)
	 */
	public positionToCoordinate(position: number): number {
		if (this._inversed) {
			return (this._end - position) * this._axisLength;
		}
		else {
			return (position - this._start) * this._axisLength;
		}
	}

	/**
	 * @ignore
	 */
	public abstract positionTooltip(_tooltip: Tooltip, _position: number): void;

	/**
	 * @ignore
	 */
	public updateTooltipBounds(_tooltip: Tooltip) { }

	public _updateSize() {
		this.markDirty()
		this._clear = true;
	}

	public toAxisPosition(position: number): number {
		const start = this.axis.get("start")!;
		const end = this.axis.get("end")!;

		position = position * (end - start);
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
	public fixPosition(position: number) {
		if (this.get("inversed")) {
			return 1 - position;
		}
		return position;
	}

	protected toggleVisibility(sprite: Sprite, position: number, minPosition: number, maxPosition: number): void {
		let axis = this.axis;

		const start = axis.get("start", 0);
		const end = axis.get("end", 1);

		let updatedStart = start + (end - start) * (minPosition - 0.0001);
		let updatedEnd = start + (end - start) * (maxPosition + 0.0001);

		if (position < updatedStart || position > updatedEnd) {
			sprite.setPrivate("visible", false);
		}
		else {
			sprite.setPrivate("visible", true);
		}
	}

	protected _positionTooltip(tooltip: Tooltip, point: IPoint) {
		const chart = this.chart;
		if (chart) {
			if (chart.inPlot(point)) {
				tooltip.set("pointTo", this._display.toGlobal(point));
			}
			else {
				tooltip.hide();
			}
		}
	}

	public processAxis() { }
}