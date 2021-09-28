import type { DataItem } from "../../core/render/Component";
import type { LinkedHierarchy, ILinkedHierarchyDataItem } from "./LinkedHierarchy";

import { HierarchyNode, IHierarchyNodePrivate, IHierarchyNodeSettings } from "./HierarchyNode";

import * as $array from "../../core/util/Array";

export interface ILinkedHierarchyNodeSettings extends IHierarchyNodeSettings {
}

export interface ILinkedHierarchyNodePrivate extends IHierarchyNodePrivate {
}

/**
 * A node class for [[LinkedHierarchy]].
 */
export class LinkedHierarchyNode extends HierarchyNode {

	/**
	 * A series node belongs to.
	 */
	declare public series: LinkedHierarchy | undefined;

	declare public _settings: ILinkedHierarchyNodeSettings;
	declare public _privateSettings: ILinkedHierarchyNodePrivate;

	public static className: string = "LinkedHierarchyNode";
	public static classNames: Array<string> = HierarchyNode.classNames.concat([LinkedHierarchyNode.className]);

	declare protected _dataItem: DataItem<ILinkedHierarchyDataItem> | undefined;

	protected _afterNew() {
		super._afterNew();

		this.states.create("disabled", {});
		this.states.create("hover", {});
		this.states.create("hoverDisabled", {});
	}


	public _updateLinks(duration?: number) {
		const dataItem = this.dataItem;
		if (dataItem) {
			let links = (dataItem as DataItem<ILinkedHierarchyDataItem>).get("links");

			$array.each(links, (link) => {
				let source = link.get("source")
				let target = link.get("target")

				if (source && target) {
					if (source.get("node").isHidden() || target.get("node").isHidden()) {
						link.hide(duration);
					}
					else {
						link.show(duration);
					}
				}
			})
		}
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("disabled")) {
			this._updateLinks();
		}
	}

	protected _onHide(duration?: number) {
		super._onHide(duration);
		this._updateLinks(duration);
	}

	protected _onShow(duration?: number) {
		super._onShow(duration);
		this._updateLinks(duration);
	}
}
