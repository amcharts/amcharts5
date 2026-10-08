import type { DataItem } from "../../core/render/Component";
import type { IPoint } from "../../core/util/IPoint";
import type { IHierarchyDataObject, IHierarchyDataItem } from "./Hierarchy";

import { LinkedHierarchy, ILinkedHierarchyPrivate, ILinkedHierarchySettings, ILinkedHierarchyDataItem, ILinkedHierarchyEvents } from "./LinkedHierarchy";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as d3hierarchy from "d3-hierarchy";

export interface ITreeDataObject {
	name?: string,
	value?: number,
	children?: ITreeDataObject[],
	dataItem?: DataItem<ITreeDataItem>
};

export interface ITreeDataItem extends ILinkedHierarchyDataItem {

	/**
	 * Data items of the child nodes.
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
	 * Direction the tree grows in: `"vertical"` from top to bottom,
	 * `"horizontal"` from left to right.
	 *
	 * @default "vertical"
	 */
	orientation?: "horizontal" | "vertical";

	/**
	 * Flips the tree, so it grows from bottom to top, or from right to left
	 * when horizontal.
	 *
	 * @default false
	 * @since 5.2.4
	 */
	inversed?: boolean;

	/**
	 * Uses a cluster layout (dendrogram), which lines up all leaf nodes at
	 * the same depth.
	 *
	 * @default false
	 * @since 5.16.2
	 */
	clustered?: boolean;

	/**
	 * Function that returns the spacing between two neighboring nodes, given
	 * their data items. Without it, siblings get `1` and other neighbors `2`.
	 *
	 * @since 5.16.2
	 */
	nodeSeparation?: (a: DataItem<ITreeDataItem>, b: DataItem<ITreeDataItem>) => number;

	/**
	 * Lays out only the visible nodes, so they spread out to fill the chart
	 * while other nodes are hidden or collapsed.
	 *
	 * @default false
	 * @since 5.18.0
	 */
	fitNodes?: boolean;

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
 * A tree diagram: node circles joined by links, each level a row (or a
 * column, when horizontal).
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
		if (this.isDirty("fitNodes")) {
			this._valuesDirty = true;
		}

		super._prepareChildren();

		if (this.isDirty("clustered")) {
			this._hierarchyLayout = this.get("clustered") ? d3hierarchy.cluster() : d3hierarchy.tree();
			this._updateVisuals();
		}

		if (this.isDirty("orientation") || this.isDirty("inversed") || this.isDirty("nodeSeparation")) {
			this._updateVisuals();
		}
	}

	protected _makeHierarchyData(data: IHierarchyDataObject, dataItem: DataItem<IHierarchyDataItem>) {
		if (!this.get("fitNodes")) {
			super._makeHierarchyData(data, dataItem);
			return;
		}

		data.dataItem = dataItem;
		const children = (dataItem as DataItem<ITreeDataItem>).get("children");
		if (children) {
			const childrenDataArray: Array<IHierarchyDataObject> = [];
			data.children = childrenDataArray;
			$array.each(children, (childDataItem) => {
				if (childDataItem.isHidden()) {
					return;
				}
				const node = childDataItem.get("node");
				if (node && node.isHidden()) {
					return;
				}
				const childData = {};
				childrenDataArray.push(childData);
				this._makeHierarchyData(childData, childDataItem);
			});
		}

		const value = dataItem.get("valueWorking");
		if ($type.isNumber(value)) {
			data.value = value;
		}
	}

	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const result = super.hideDataItem(dataItem, duration);
		if (this.get("fitNodes")) {
			this.markDirtyValues();
		}
		return result;
	}

	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const result = super.showDataItem(dataItem, duration);
		if (this.get("fitNodes")) {
			this.markDirtyValues();
		}
		return result;
	}

	public disableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number) {
		super.disableDataItem(dataItem, duration);
		if (this.get("fitNodes")) {
			this.markDirtyValues();
		}
	}

	public enableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, maxDepth?: number, depth?: number, duration?: number) {
		super.enableDataItem(dataItem, maxDepth, depth, duration);
		if (this.get("fitNodes")) {
			this.markDirtyValues();
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

			const nodeSeparation = this.get("nodeSeparation");
			if (nodeSeparation) {
				layout.separation((a: any, b: any) => {
					return nodeSeparation(a.data.dataItem, b.data.dataItem);
				});
			}
			else {
				layout.separation((a: any, b: any) => a.parent == b.parent ? 1 : 2);
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
