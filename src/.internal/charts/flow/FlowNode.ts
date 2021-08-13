import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";
import type { IFlowNodesDataItem, FlowNodes } from "./FlowNodes";
import type { Template } from "../../core/util/Template";

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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: FlowNode["_settings"], template?: Template<FlowNode>): FlowNode {
		const x = new FlowNode(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IFlowNodeSettings;
	declare public _privateSettings: IFlowNodePrivate;

	public static className: string = "FlowNode";
	public static classNames: Array<string> = Container.classNames.concat([FlowNode.className]);

	declare protected _dataItem: DataItem<IFlowNodesDataItem> | undefined;
}
