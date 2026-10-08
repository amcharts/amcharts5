import type { DataItem } from "../../core/render/Component";
import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";
import type { IFlowNodesDataItem } from "./FlowNodes";
import type { IFlowDataItem, Flow } from "./Flow";
import type { IOrientationPoint, IPoint } from "../../core/util/IPoint";
import type { LinearGradient } from "../../core/render/gradients/LinearGradient";
import { Percent } from "../../core/util/Percent";

export interface IFlowLinkSettings extends IGraphicsSettings {

	/**
	 * Source node data item.
	 */
	source?: DataItem<IFlowNodesDataItem>;

	/**
	 * Target node data item.
	 */
	target?: DataItem<IFlowNodesDataItem>;

	/**
	 * How the link is filled: `"solid"` with its own `fill`, `"source"` or
	 * `"target"` with that node's color, `"gradient"` from the source color to
	 * the target color, or `"none"`.
	 */
	fillStyle?: "solid" | "source" | "target" | "gradient" | "none";

	/**
	 * How the link's outline is colored: `"solid"` with its own `stroke`,
	 * `"source"` or `"target"` with that node's color, `"gradient"` from the
	 * source color to the target color, or `"none"`.
	 */
	strokeStyle?: "solid" | "source" | "target" | "gradient" | "none";

}

export interface IFlowLinkPrivate extends IGraphicsPrivate {
}

/**
 * Base class for the links of flow series.
 */
export abstract class FlowLink extends Graphics {

	public series: Flow | undefined;

	declare public _settings: IFlowLinkSettings;
	declare public _privateSettings: IFlowLinkPrivate;

	public static className: string = "FlowLink";
	public static classNames: Array<string> = Graphics.classNames.concat([FlowLink.className]);

	declare protected _dataItem: DataItem<IFlowDataItem> | undefined;

	public _fillGradient: LinearGradient | undefined;
	public _strokeGradient: LinearGradient | undefined;

	public _changed() {
		super._changed();
		if (this.isDirty("fillStyle") || this.isDirty("strokeStyle")) {
			const series = this.series;
			const dataItem = this.dataItem as DataItem<IFlowDataItem>;
			if (series && dataItem) {
				series._updateLinkColor(dataItem);
			}
		}
	}

	public abstract getPoint(location: number): IOrientationPoint;

	public _getTooltipPoint(): IPoint {
		let tooltipY = this.get("tooltipY");
		let position = 0.5;
		if (tooltipY instanceof Percent) {
			position = tooltipY.value;
		}

		return this.getPoint(position);
	}
}
