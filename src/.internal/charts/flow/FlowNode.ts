import type { DataItem } from "../../core/render/Component";
import type { IFlowNodesDataItem, FlowNodes } from "./FlowNodes";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";

export interface IFlowNodeSettings extends IContainerSettings {
}

export interface IFlowNodePrivate extends IContainerPrivate {
}

/**
 * Base class for flow chart nodes.
 */
export class FlowNode extends Container {

	/**
	 * Related series.
	 */
	public series: FlowNodes | undefined;

	declare public _settings: IFlowNodeSettings;
	declare public _privateSettings: IFlowNodePrivate;

	public static className: string = "FlowNode";
	public static classNames: Array<string> = Container.classNames.concat([FlowNode.className]);

	declare protected _dataItem: DataItem<IFlowNodesDataItem> | undefined;
}
