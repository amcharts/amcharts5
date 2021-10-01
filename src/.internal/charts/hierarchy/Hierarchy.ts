import type { Color } from "../../core/util/Color";
import type { ColorSet } from "../../core/util/ColorSet";
import type { Bullet } from "../../core/render/Bullet";
import type { Root } from "../../core/Root";
import type { Easing } from "../../core/util/Ease";

import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "../../core/render/Series";
import { DataItem } from "../../core/render/Component";
import { HierarchyNode } from "./HierarchyNode";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";

import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";
import * as d3hierarchy from "d3-hierarchy";

/**
 * @ignore
 */
export interface IHierarchyDataObject {
	name?: string,
	value?: number,
	children?: IHierarchyDataObject[],
	dataItem?: DataItem<IHierarchyDataItem>
	customValue?: boolean;
};

export interface IHierarchyDataItem extends ISeriesDataItem {
	value: number;

	/**
	 * @ignore
	 */
	valueWorking: number;

	valuePercentTotal: number;
	sum: number;
	category: string;
	children: Array<DataItem<IHierarchyDataItem>>;
	childData: Array<any>
	parent: DataItem<IHierarchyDataItem>;
	depth: number;
	node: HierarchyNode;
	label: Label;
	fill: Color;
	disabled: boolean;

	/**
	 * @ignore
	 */
	d3HierarchyNode: d3hierarchy.HierarchyNode<IHierarchyDataObject>;
}

export interface IHierarchySettings extends ISeriesSettings {

	/**
	 * A field in data that holds numeric value for the node.
	 */
	valueField?: string;

	/**
	 * A field in data that holds string-based identificator for node.
	 */
	categoryField?: string;

	/**
	 * A field in data that holds an array of child node data.
	 */
	childDataField?: string;

	/**
	 * A field in data that holds boolean value indicating if node is
	 * disabled (collapsed).
	 */
	disabledField?: string;

	/**
	 * A field in data that holds color used for fills for various elements, such
	 * as nodes.
	 */
	fillField?: string;

	/**
	 * A [[ColorSet]] to use when asigning colors for nodes.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Node_colors} for more info
	 */
	colors?: ColorSet;

	/**
	 * Number of child levels to open when clicking on a node.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Drill_down} for more info
	 */
	downDepth?: number;

	/**
	 * Number of levels parent levels to show from currently selected node.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Drill_down} for more info
	 */
	upDepth?: number;

	/**
	 * Number of levels to show on chart's first load.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Tree_depth} for more info
	 */
	initialDepth?: number;

	/**
	 * If set, will show nodes starting from set level.
	 *
	 * It could be used to eliminate top level branches, that do not need to be
	 * shown.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Tree_depth} for more info
	 */
	topDepth?: number;

	/**
	 * If set to `true` will make all other branches collapse when some branch is
	 * expanded.
	 */
	singleBranchOnly?: boolean;

	/**
	 * A data item for currently selected node.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/#Pre_selected_branch} for more info
	 */
	selectedDataItem?: DataItem<IHierarchyDataItem>;

	/**
	 * Duration for all drill animations in milliseconds.
	 */
	animationDuration?: number;

	/**
	 * An easing function to use for drill animations.
	 */
	animationEasing?: Easing;

}

export interface IHierarchyPrivate extends ISeriesPrivate {

	/**
	 * Level count in series.
	 */
	maxDepth: number;

}

export interface IHierarchyEvents extends ISeriesEvents {
	dataitemselected: {
		dataItem?: DataItem<IHierarchyDataItem>
	};
}

/**
 * A base class for all hierarchy charts.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/hierarchy/} for more info
 */
export abstract class Hierarchy extends Series {
	public static className: string = "Hierarchy";
	public static classNames: Array<string> = Series.classNames.concat([Hierarchy.className]);

	declare public _settings: IHierarchySettings;
	declare public _privateSettings: IHierarchyPrivate;
	declare public _dataItemSettings: IHierarchyDataItem;
	declare public _events: IHierarchyEvents;

	/**
	 * A [[Container]] that nodes are placed in.
	 *
	 * @default Container.new()
	 */
	public readonly nodesContainer = this.children.push(Container.new(this._root, { isMeasured: false }));

	public _rootNode: d3hierarchy.HierarchyNode<IHierarchyDataObject> | undefined;

	public _treeData: IHierarchyDataObject | undefined;

	protected _index: number = 0;

	protected _tag: string = "hierarchy";

	/**
	 * A list of nodes in a [[Hierarchy]] chart.
	 *
	 * @default new ListTemplate<HierarchyNode>
	 */
	public readonly nodes: ListTemplate<HierarchyNode> = new ListTemplate(
		Template.new({}),
		() => HierarchyNode.new(this._root, {
			themeTags: $utils.mergeTags(this.nodes.template.get("themeTags", []), [this._tag, "hierarchy", "node"])
		}, this.nodes.template)
	);

	/**
	 * @ignore
	 */
	public makeNode(dataItem: DataItem<this["_dataItemSettings"]>): HierarchyNode {

		const childData = dataItem.get("childData");

		const node = this.nodes.make();

		node.series = this;
		node._setDataItem(dataItem);
		this.nodes.push(node);
		dataItem.setRaw("node", node);

		const label = this.labels.make();
		label._setDataItem(dataItem);
		dataItem.setRaw("label", label);
		this.labels.push(label);

		if (!childData || childData.length == 0) {
			node.addTag("last");
			label.addTag("last");
		}

		this.nodesContainer.children.push(node);
		node.children.push(label);

		return node;
	}

	/**
	 * A list of label elements in a [[Hierarchy]] chart.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = new ListTemplate(
		Template.new({}),
		() => Label.new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), [this._tag, "hierarchy", "node"])
		}, this.labels.template)
	);

	public _currentDownDepth: number | undefined;

	protected _afterNew() {
		this.fields.push("category", "childData", "disabled", "fill");

		this.children.push(this.bulletsContainer);

		super._afterNew();
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this._valuesDirty) {
			this._treeData = {};

			const first = this.dataItems[0];
			if (first) {
				this._makeHierarchyData(this._treeData, first);
				this._index = 0;
				this._rootNode = (d3hierarchy.hierarchy(this._treeData) as any);
				if (this._rootNode) {
					this._rootNode.sum((d) => {
						return d.value as any;
					});
					//this._rootNode.sort((a, b) => (b.value as any) - (a.value as any));
					this.setPrivateRaw("valueLow", Infinity);
					this.setPrivateRaw("valueHigh", -Infinity);
					this.setPrivateRaw("maxDepth", 0);
					this._updateValues(this._rootNode);
				}
			}
		}

		if (this._valuesDirty || this._sizeDirty) {
			this._updateVisuals();
		}

		if (this._sizeDirty) {
			this._selectDataItem(this.get("selectedDataItem"), this._currentDownDepth);
		}
	}

	public _changed() {
		super._changed();
		if (this.isDirty("selectedDataItem")) {
			this._selectDataItem(this.get("selectedDataItem"));
		}
	}

	protected _updateVisuals() {
		if (this._rootNode) {
			this._updateNodes(this._rootNode);
		}
	}

	protected _updateNodes(hierarchyNode: d3hierarchy.HierarchyNode<IHierarchyDataObject>) {
		const dataItem = hierarchyNode.data.dataItem;

		if (dataItem) {
			this._updateNode(dataItem);

			if (this.bullets.length > 0 && !dataItem.bullets) {
				this._makeBullets(dataItem);
			}

			const hierarchyChildren = hierarchyNode.children;
			if (hierarchyChildren) {
				$array.each(hierarchyChildren, (hierarchyChild) => {
					this._updateNodes(hierarchyChild)
				})
			}
		}
	}

	protected _updateNode(_dataItem: DataItem<this["_dataItemSettings"]>) {

	}

	public _getDataItemById(dataItems: Array<DataItem<this["_dataItemSettings"]>>, id: string): DataItem<this["_dataItemSettings"]> | undefined {

		let di: DataItem<this["_dataItemSettings"]> | undefined;

		$array.each(dataItems, (dataItem: any) => {

			if (dataItem.get("id") == id) {
				di = dataItem;
			}

			const children = dataItem.get("children");
			if (children) {
				let childDataItem = this._getDataItemById(children, id);
				if (childDataItem) {
					di = childDataItem
				}
			}
		})

		return di;
	}

	protected _handleBullets(dataItems: Array<DataItem<this["_dataItemSettings"]>>) {
		$array.each(dataItems, (dataItem) => {
			const bullets = dataItem.bullets;
			if (bullets) {
				$array.each(bullets, (bullet) => {
					bullet.dispose();
				})
				dataItem.bullets = undefined;
			}

			const children = dataItem.get("children");

			if (children) {
				this._handleBullets(children);
			}
		})

		this._updateVisuals();
	}

	protected _onDataClear() {
		const colors = this.get("colors");
		if (colors) {
			colors.reset();
		}
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const childData = dataItem.get("childData");
		const colors = this.get("colors");
		const topDepth = this.get("topDepth", 0);

		if (!dataItem.get("parent")) {
			dataItem.setRaw("depth", 0);
			if (colors && topDepth == 0 && dataItem.get("fill") == null) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		let depth = dataItem.get("depth");
		const initialDepth = this.get("initialDepth", 1);

		this.makeNode(dataItem);
		this._processDataItem(dataItem);

		if (childData) {
			const children: Array<DataItem<this["_dataItemSettings"]>> = [];
			dataItem.setRaw("children", children);

			$array.each(childData, (child) => {
				const childDataItem = new DataItem(this, child, this._makeDataItem(child));

				children.push(childDataItem);

				childDataItem.setRaw("parent", dataItem);
				childDataItem.setRaw("depth", depth + 1);

				if (this.dataItems.length == 1 && depth == 0) {
					if (colors && childDataItem.get("fill") == null) {
						childDataItem.setRaw("fill", colors.next());
					}
				}
				else {
					childDataItem.setRaw("fill", dataItem.get("fill"));
				}

				this.processDataItem(childDataItem);
			})
		}

		const children = dataItem.get("children");
		if (!children || children.length == 0) {
			const node = dataItem.get("node");
			node.setAll({ toggleKey: undefined, cursorOverStyle: "default" });
		}

		if (dataItem.get("disabled") == null) {
			if (depth >= topDepth + initialDepth) {
				this.disableDataItem(dataItem, 0);
			}
		}
	}

	protected _processDataItem(_dataItem: DataItem<this["_dataItemSettings"]>) {

	}

	protected _updateValues(d3HierarchyNode: d3hierarchy.HierarchyNode<IHierarchyDataObject>) {
		const dataItem = d3HierarchyNode.data.dataItem;

		if (d3HierarchyNode.depth > this.getPrivate("maxDepth")) {
			this.setPrivateRaw("maxDepth", d3HierarchyNode.depth);
		}

		if (dataItem) {
			dataItem.setRaw("d3HierarchyNode", d3HierarchyNode);

			(d3HierarchyNode as any).index = this._index;

			this._index++;

			dataItem.get("node").set("disabled", dataItem.get("disabled"));

			let dataValue = d3HierarchyNode.data.value;
			let value = d3HierarchyNode.value

			if (dataValue != null) {
				value = dataValue;
				(d3HierarchyNode as any)["value"] = value;
			}

			if ($type.isNumber(value)) {
				dataItem.setRaw("sum", value);

				if (this.getPrivate("valueLow") > value) {
					this.setPrivateRaw("valueLow", value);
				}

				if (this.getPrivate("valueHigh") < value) {
					this.setPrivateRaw("valueHigh", value);
				}
			}

			this.updateLegendValue(dataItem);
		}

		const hierarchyChildren = d3HierarchyNode.children;
		if (hierarchyChildren) {
			$array.each(hierarchyChildren, (d3HierarchyChild) => {
				this._updateValues(d3HierarchyChild);
			})
		}
	}

	protected _makeHierarchyData(data: IHierarchyDataObject, dataItem: DataItem<IHierarchyDataItem>) {
		data.dataItem = dataItem;

		const children = dataItem.get("children");
		if (children) {
			const childrenDataArray: Array<IHierarchyDataObject> = [];
			data.children = childrenDataArray;
			$array.each(children, (childDataItem) => {
				const childData = {};
				childrenDataArray.push(childData);
				this._makeHierarchyData(childData, childDataItem);
			})

			const value = dataItem.get("valueWorking");
			if ($type.isNumber(value)) {
				data.value = value;
			}
		}
		else {
			const value = dataItem.get("valueWorking");
			if ($type.isNumber(value)) {
				data.value = value;
			}
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const node = dataItem.get("node");
		if (node) {
			this.nodes.removeValue(node);
			node.dispose();
		}
		const label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
		}

		const children = dataItem.get("children");
		if (children) {
			$array.each(children, (child) => {
				this.disposeDataItem(child);
			})
		}
	}

	/**
	 * Hides hierarchy's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {

		const promises = [super.hideDataItem(dataItem, duration)];

		const hiddenState = this.states.create("hidden", {})

		if (!$type.isNumber(duration)) {
			const stateAnimationDuration = "stateAnimationDuration"
			duration = hiddenState.get(stateAnimationDuration, this.get(stateAnimationDuration, 0));
		}

		const stateAnimationEasing = "stateAnimationEasing";
		const easing = hiddenState.get(stateAnimationEasing, this.get(stateAnimationEasing));

		const children = dataItem.get("children");

		if ((!children || children.length == 0) && $type.isNumber(dataItem.get("value"))) {
			promises.push(dataItem.animate({ key: "valueWorking" as any, to: 0, duration: duration, easing: easing }).waitForStop());
		}

		const node = dataItem.get("node");
		node.hide();

		if (children) {
			$array.each(children, (childDataItem) => {
				promises.push(this.hideDataItem(childDataItem));
			})
		}

		await Promise.all(promises);
	}

	/**
	 * Shows hierarchy's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async showDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {

		const promises = [super.showDataItem(dataItem, duration)];

		if (!$type.isNumber(duration)) {
			duration = this.get("stateAnimationDuration", 0);
		}

		const easing = this.get("stateAnimationEasing");

		const children = dataItem.get("children");

		if ((!children || children.length == 0) && $type.isNumber(dataItem.get("value"))) {
			promises.push(dataItem.animate({ key: "valueWorking" as any, to: dataItem.get("value"), duration: duration, easing: easing }).waitForStop());
		}

		const node = dataItem.get("node");
		node.show();

		if (children) {
			$array.each(children, (childDataItem) => {
				promises.push(this.showDataItem(childDataItem));
			})
		}

		await Promise.all(promises);
	}

	/**
	 * Enables a disabled data item.
	 *
	 * @param  dataItem  Target data item
	 * @param  duration  Animation duration in milliseconds
	 */
	public enableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, maxDepth?: number, depth?: number, duration?: number) {

		if (depth == null) {
			depth = 0;
		}

		if (maxDepth == null) {
			maxDepth = 1;
		}

		dataItem.set("disabled", false);
		dataItem.get("node").set("disabled", false);

		if (!dataItem.isHidden()) {
			dataItem.get("node").show(duration);
		}

		if (depth == 0) {
			const upDepth = this.get("upDepth", Infinity);
			let parent = dataItem;
			let count = 0;

			while (parent !== undefined) {
				if (count > upDepth) {
					parent.get("node").hide();
				}
				parent = parent.get("parent");
				count++;
			}
		}

		let children = dataItem.get("children");
		if (children) {
			if (depth < maxDepth - 1) {
				$array.each(children, (child) => {
					this.enableDataItem(child, maxDepth, depth as number + 1, duration);
				})
			}
			else {
				$array.each(children, (child) => {
					if (!child.isHidden()) {
						child.get("node").show(duration);
						child.get("node").states.applyAnimate("disabled");
						child.set("disabled", true);

						this.disableDataItem(child);
					}
				})
			}
		}
	}

	/**
	 * Disables a data item.
	 *
	 * @param  dataItem  Target data item
	 * @param  duration  Animation duration in milliseconds
	 */
	public disableDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number) {
		dataItem.set("disabled", true);
		let children = dataItem.get("children");
		if (children) {
			$array.each(children, (child) => {
				this.disableDataItem(child, duration);
				child.get("node").hide(duration);
			})
		}
	}

	protected _selectDataItem(dataItem?: DataItem<this["_dataItemSettings"]>, downDepth?: number) {
		if (dataItem) {
			const type = "dataitemselected";
			this.events.dispatch(type, { type: type, target: this, dataItem: dataItem });

			let maxDepth = this.getPrivate("maxDepth", 1);
			const topDepth = this.get("topDepth", 0);

			if (downDepth == null) {
				downDepth = Math.min(this.get("downDepth", 1), maxDepth - dataItem.get("depth"));
			}

			if (!this.inited) {
				downDepth = Math.min(this.get("initialDepth", 1), maxDepth - topDepth);
			}

			this._currentDownDepth = downDepth;

			const hierarchyNode = dataItem.get("d3HierarchyNode");
			let currentDepth = hierarchyNode.depth;

			if (currentDepth + downDepth > maxDepth) {
				downDepth = maxDepth - currentDepth;
			}

			if (currentDepth < topDepth) {
				downDepth += topDepth - currentDepth;
				currentDepth = topDepth;
			}

			const children = dataItem.get("children");

			if (children && children.length > 0) {
				if (downDepth > 0) {
					this.enableDataItem(dataItem, downDepth);
				}
				else {
					dataItem.get("node").show();
					$array.each(children, (child) => {
						child.get("node").hide();
					})
				}

				if (hierarchyNode.depth < topDepth) {
					dataItem.get("node").hide(0);
				}

				if (this.get("singleBranchOnly")) {
					this._handleSingle(dataItem);
				}
			}
			else {
				this.enableDataItem(this.dataItems[0], downDepth, 0);
			}

			this._zoom(dataItem);
		}

	}

	protected _zoom(_dataItem: DataItem<this["_dataItemSettings"]>) {
	}

	protected _handleSingle(dataItem: DataItem<this["_dataItemSettings"]>) {
		const parent = dataItem.get("parent");
		if (parent) {
			const children = parent.get("children");
			if (children) {
				$array.each(children, (child) => {
					if (child != dataItem) {
						this.disableDataItem(child);
					}
				})
			}
		}
	}

	/**
	 * Selects specific data item.
	 *
	 * @param  dataItem  Target data item
	 */
	public selectDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		const parent = dataItem.get("parent");
		const maxDepth = this.getPrivate("maxDepth", 1);

		if (this.get("selectedDataItem") == dataItem) {
			if (parent) {
				this.set("selectedDataItem", parent);
			}
			else {
				let depth = Math.min(this.get("downDepth", 1), maxDepth - dataItem.get("depth"));

				if (this._currentDownDepth == depth) {
					depth = Math.min(this.get("initialDepth", 1), maxDepth - this.get("topDepth", 0));
				}

				this._selectDataItem(dataItem, depth);
			}
		}
		else {
			this.set("selectedDataItem", dataItem);
		}
	}


	protected _makeBullet(dataItem: DataItem<this["_dataItemSettings"]>, bulletFunction: (root: Root, series: Series, dataItem: DataItem<this["_dataItemSettings"]>) => Bullet, index?: number) {
		const bullet = super._makeBullet(dataItem, bulletFunction, index);
		const sprite = bullet.get("sprite");
		const node = dataItem.get("node");

		if (sprite) {
			node.children.push(sprite);
			node.on("width", () => {
				this._positionBullet(bullet);
			})
			node.on("height", () => {
				this._positionBullet(bullet);
			})
		}

		return bullet;
	}

	public _positionBullet(bullet: Bullet) {

		const sprite = bullet.get("sprite");
		if (sprite) {
			const dataItem = sprite.dataItem as DataItem<this["_dataItemSettings"]>;

			const locationX = bullet.get("locationX", 0.5);
			const locationY = bullet.get("locationY", 0.5);

			const node = dataItem.get("node");

			sprite.set("x", node.width() * locationX);
			sprite.set("y", node.height() * locationY);
		}
	}

}
