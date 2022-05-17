import type { DataItem } from "../../core/render/Component";
import type { IPoint } from "../../core/util/IPoint";

import { LinkedHierarchy, ILinkedHierarchyPrivate, ILinkedHierarchySettings, ILinkedHierarchyDataItem, ILinkedHierarchyEvents } from "./LinkedHierarchy";

import * as d3hierarchy from "d3-hierarchy";

export interface ITreeDataObject {
	name?: string,
	value?: number,
	children?: ITreeDataObject[],
	dataItem?: DataItem<ITreeDataItem>
};

export interface ITreeDataItem extends ILinkedHierarchyDataItem {

	/**
	 * An array of children data items.
	 */
	children: Array<DataItem<ITreeDataItem>>;

	/**
	 * Parent data item.
	 * @type {DataItem<ITreeDataItem>}
	 */
	parent: DataItem<ITreeDataItem>;

}

export interface ITreeSettings extends ILinkedHierarchySettings {

	/**
	 * Orientation of the diagram.
	 *
	 * @default "vertical"
	 */
	orientation?: "horizontal" | "vertical";

	/**
	 * If set to `true`, will flip the tree direction.
	 *
	 * @default false
	 * @since 5.2.4
	 */
	inversed?: boolean;

}

export interface ITreePrivate extends ILinkedHierarchyPrivate {

	/**
	 * Current horizontal scale.
	 */
	scaleX?: number;

	/**
	 * Current vertical scale.
	 */
	scaleY?: number;
}

export interface ITreeEvents extends ILinkedHierarchyEvents {
}

/**
 * Displays a tree diagram.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/tree/} for more info
 * @important
 */
export class Tree extends LinkedHierarchy {

	declare public _settings: ITreeSettings;
	declare public _privateSettings: ITreePrivate;
	declare public _dataItemSettings: ITreeDataItem;

	protected _tag: string = "tree";

	public static className: string = "Tree";
	public static classNames: Array<string> = LinkedHierarchy.classNames.concat([Tree.className]);

	public _hierarchyLayout = d3hierarchy.tree();
	declare public _rootNode: d3hierarchy.HierarchyCircularNode<ITreeDataObject> | undefined;
	public _packData: ITreeDataObject | undefined;

	public _prepareChildren() {
		super._prepareChildren();

		if (this.isDirty("orientation") || this.isDirty("inversed")) {
			this._updateVisuals();
		}
	}

	protected _updateVisuals() {
		if (this._rootNode) {
			const layout = this._hierarchyLayout;

			if (this.get("orientation") == "vertical") {
				layout.size([this.innerWidth(), this.innerHeight()]);
			}
			else {
				layout.size([this.innerHeight(), this.innerWidth()]);
			}

			layout(this._rootNode);
		}

		super._updateVisuals();
	}

	protected _getPoint(hierarchyNode: this["_dataItemSettings"]["d3HierarchyNode"]): IPoint {
		const inversed = this.get("inversed");
		if (this.get("orientation") == "vertical") {
			if (inversed) {
				return { x: hierarchyNode.x, y: this.innerHeight() - hierarchyNode.y };
			}
			else {
				return { x: hierarchyNode.x, y: hierarchyNode.y };
			}
		}
		else {
			if (inversed) {
				return { x: this.innerWidth() - hierarchyNode.y, y: hierarchyNode.x };
			}
			else {
				return { x: hierarchyNode.y, y: hierarchyNode.x };
			}
		}
	}

}
