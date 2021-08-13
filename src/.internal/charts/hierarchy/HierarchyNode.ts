import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";
import type { IDisposer } from "../../core/util/Disposer";
import type { Hierarchy, IHierarchyDataItem } from "./Hierarchy";
import type { Template } from "../../core/util/Template";

import { Container, IContainerPrivate, IContainerSettings } from "../../core/render/Container";

export interface IHierarchyNodeSettings extends IContainerSettings {
}

export interface IHierarchyNodePrivate extends IContainerPrivate {
}

/**
 * Base class for hierarchy nodes.
 */
export class HierarchyNode extends Container {

	/**
	 * Related series.
	 */
	public series: Hierarchy | undefined;

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: HierarchyNode["_settings"], template?: Template<HierarchyNode>): HierarchyNode {
		const x = new HierarchyNode(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: IHierarchyNodeSettings;
	declare public _privateSettings: IHierarchyNodePrivate;

	public static className: string = "HierarchyNode";
	public static classNames: Array<string> = Container.classNames.concat([HierarchyNode.className]);

	declare protected _dataItem: DataItem<IHierarchyDataItem> | undefined;

	protected _clickDisposer: IDisposer | undefined;

	protected _afterNew() {
		super._afterNew();

		this.states.create("disabled", {});
		this.states.create("hover", {});
		this.states.create("hoverDisabled", {});

		this.on("disabled", () => {
			const dataItem = this.dataItem as DataItem<IHierarchyDataItem>;
			if (!dataItem.get("children")) {
				this.set("disabled", true);
				return;
			}

			const disabled = this.get("disabled");
			const series = this.series;

			if (dataItem && series) {
				if (dataItem.get("disabled") != disabled) {
					if (disabled) {
						series.disableDataItem(dataItem);
					}
					else {
						series.enableDataItem(dataItem, series.get("downDepth", 1), 0);
					}
				}
			}
		})
	}

	public _changed() {
		super._changed();

		if (this.isDirty("toggleKey")) {
			const toggleKey = this.get("toggleKey");

			if (toggleKey == "disabled") {
				this._clickDisposer = this.events.on("click", () => {
					if (!this._isDragging) {
						let series = this.series;
						if (series) {
							series.selectDataItem(this.dataItem as DataItem<IHierarchyDataItem>);
						}
					}
				})
			}
			else {
				if (this._clickDisposer) {
					this._clickDisposer.dispose();
				}
			}
		}
	}
}
