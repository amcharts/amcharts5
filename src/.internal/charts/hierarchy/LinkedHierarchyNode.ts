import type { Root } from "../../core/Root";
import type { DataItem } from "../../core/render/Component";
import type { LinkedHierarchy, ILinkedHierarchyDataItem } from "./LinkedHierarchy";
import type { Template } from "../../core/util/Template";

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

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: LinkedHierarchyNode["_settings"], template?: Template<LinkedHierarchyNode>): LinkedHierarchyNode {
		const x = new LinkedHierarchyNode(root, settings, true, template);
		x._afterNew();
		return x;
	}

	declare public _settings: ILinkedHierarchyNodeSettings;
	declare public _privateSettings: ILinkedHierarchyNodePrivate;

	public static className: string = "LinkedHierarchyNode";
	public static classNames: Array<string> = HierarchyNode.classNames.concat([LinkedHierarchyNode.className]);

	/*
		public readonly circle: Circle = this.children.push(Circle.new(this._root, { themeClasses: ["LinkedHierarchyNodeCircle"] }))
		public readonly outerCircle: Circle = this.children.push(Circle.new(this._root, { themeClasses: ["LinkedHierarchyNodeOuterCircle"] }))
		public readonly label: Label = this.children.push(Label.new(this._root, { themeClasses: ["LinkedHierarchyNodeLabel"] }));
	*/
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
