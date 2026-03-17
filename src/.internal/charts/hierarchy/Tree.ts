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

	/**
	 * If set to `true`, will use cluster layout (dendrogram) where all leaf
	 * nodes are placed at the same depth.
	 *
	 * @default false
	 * @since 5.16.2
	 */
	clustered?: boolean;

	/**
	 * A function that returns the desired separation between neighboring
	 * nodes. Receives two data items and should return a numeric value.
	 *
	 * Default is `1` for siblings, `2` for non-siblings.
	 *
	 * Can be used to create variable node spacing based on value, label
	 * size, or other data properties.
	 *
	 * @since 5.16.2
	 */
	nodeSeparation?: (a: DataItem<ITreeDataItem>, b: DataItem<ITreeDataItem>) => number;

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

		if (this.isDirty("clustered")) {
			this._hierarchyLayout = this.get("clustered") ? d3hierarchy.cluster() : d3hierarchy.tree();
			this._updateVisuals();
		}

		if (this.isDirty("orientation") || this.isDirty("inversed") || this.isDirty("nodeSeparation")) {
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

			const nodeSeparation = this.get("nodeSeparation");
			if (nodeSeparation) {
				layout.separation((a: any, b: any) => {
					return nodeSeparation(a.data.dataItem, b.data.dataItem);
				});
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
