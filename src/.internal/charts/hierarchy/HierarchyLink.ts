import type { IHierarchyDataItem } from "./Hierarchy";
import type { DataItem } from "../../core/render/Component";

import { Graphics, IGraphicsSettings, IGraphicsPrivate } from "../../core/render/Graphics";

export interface IHierarchyLinkSettings extends IGraphicsSettings {

	/**
	 * Source node data item.
	 */
	source?: DataItem<IHierarchyDataItem>;

	/**
	 * Target node data item.
	 */
	target?: DataItem<IHierarchyDataItem>;

	/**
	 * Strength of the link.
	 */
	strength?: number;

	/**
	 * Distance in pixels.
	 */
	distance?: number;

}

export interface IHierarchyLinkPrivate extends IGraphicsPrivate {
	d3Link:any;
}

/**
 * Draws a link between nodes in a hierarchy series.
 */
export class HierarchyLink extends Graphics {
	declare public _settings: IHierarchyLinkSettings;
	declare public _privateSettings: IHierarchyLinkPrivate;

	public static className: string = "HierarchyLink";
	public static classNames: Array<string> = Graphics.classNames.concat([HierarchyLink.className]);

	public _changed() {
		super._changed();
		if (this._clear) {
			let source = this.get("source");
			let target = this.get("target");
			if (source && target) {
				const sourceNode = source.get("node");
				const targetNode = target.get("node");
				this._display.moveTo(sourceNode.x(), sourceNode.y());
				this._display.lineTo(targetNode.x(), targetNode.y());
			}
		}
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("source")) {
			const source = this.get("source");
			if (source) {
				const sourceNode = source.get("node");
				sourceNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				})
			}
		}
		if (this.isDirty("target")) {
			const target = this.get("target");
			if (target) {
				const targetNode = target.get("node");
				targetNode.events.on("positionchanged", () => {
					this._markDirtyKey("stroke");
				})
			}
		}
	}
}
