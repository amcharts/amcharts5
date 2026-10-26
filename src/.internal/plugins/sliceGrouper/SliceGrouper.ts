import type { DataItem } from "../../core/render/Component";
import type { PercentSeries, IPercentSeriesDataItem } from "../../charts/percent/PercentSeries";
import type { Legend } from "../../core/render/Legend";

import { Button } from "../../core/render/Button";
import { Graphics } from "../../core/render/Graphics";
import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../core/util/Entity"

import * as $array from "../../core/util/Array";


export interface ISliceGrouperSettings extends IEntitySettings {

	/**
	 * The series whose small slices are grouped.
	 */
	series?: PercentSeries;

	/**
	 * Legend to keep in step with the grouping: it gets an item for the group
	 * slice, and the items of the grouped slices are hidden.
	 */
	legend?: Legend;

	/**
	 * Slices whose share of the total is at or below this percent are
	 * grouped.
	 *
	 * @default 5
	 */
	threshold?: number;

	/**
	 * Keeps only this many first slices; the rest are grouped.
	 */
	limit?: number;

	/**
	 * Name (category) of the group slice.
	 *
	 * @default "Other"
	 */
	groupName?: string;

	/**
	 * What a click on the group slice does:
	 *
	 * * `"none"`: nothing.
	 * * `"break"`: replaces the group slice with the small slices.
	 * * `"zoom"`: shows only the small slices, hiding the others.
	 *
	 * @default "none"
	 */
	clickBehavior?: "none" | "break" | "zoom";

}

export interface ISliceGrouperPrivate extends IEntityPrivate {
	groupDataItem?: DataItem<IPercentSeriesDataItem>;
	normalDataItems?: DataItem<IPercentSeriesDataItem>[];
	smallDataItems?: DataItem<IPercentSeriesDataItem>[];
	currentStep?: number;
	currentPass?: number;
	currentCount?: number;
}

export interface ISliceGrouperEvents extends IEntityEvents {
}


/**
 * A plugin that can be used to automatically group small slices on percent
 * charts into a single slice.
 *
 * @see {@link https://docs.amcharts.com/v5/charts/percent-charts/grouping-slices/} for more info
 */
export class SliceGrouper extends Entity {
	public static className: string = "SliceGrouper";
	public static classNames: Array<string> = Entity.classNames.concat([SliceGrouper.className]);

	declare public _settings: ISliceGrouperSettings;
	declare public _privateSettings: ISliceGrouperPrivate;
	declare public _events: ISliceGrouperEvents;

	/**
	 * Button shown while the small slices are shown after a click on the
	 * group slice; it groups them again. Made only when `clickBehavior` is not
	 * `"none"`.
	 */
	public zoomOutButton?: Button;


	protected _afterNew(): void {
		super._afterNew();
		this._setRawDefault("threshold", 5);
		this._setRawDefault("groupName", "Other");
		this._setRawDefault("clickBehavior", "none");
		this.initZoomButton();
		this._root.addDisposer(this);

		const series = this.get("series");
		if (series) {
			const colors = series.get("colors");
			if (colors) {
				this.setPrivate("currentStep", colors.getPrivate("currentStep"));
				this.setPrivate("currentPass", colors.getPrivate("currentPass"));
				this.setPrivate("currentCount", colors.getPrivate("currentCount"));
			}
		}
	}

	private initZoomButton(): void {
		const clickBehavior = this.get("clickBehavior");
		if (clickBehavior !== "none") {
			const container = this.root.tooltipContainer;
			this.zoomOutButton = container.children.push(Button.new(this._root, {
				themeTags: ["zoom"],
				icon: Graphics.new(this._root, {
					themeTags: ["button", "icon"]
				})
			}));
			this.zoomOutButton.hide();
			this.zoomOutButton.events.on("click", () => {
				this.zoomOut();
			});
		}

	}

	private handleData(): void {
		const series = this.get("series");

		if (series) {

			// Create group data item if not yet available
			let groupDataItem = this.getPrivate("groupDataItem");
			if (!groupDataItem) {

				const legend = this.get("legend");
				const categoryField = series.get("categoryField", "category");
				const valueField = series.get("valueField", "value");

				// Add slice
				const groupSliceData: any = {};
				groupSliceData[categoryField] = this.get("groupName", "");
				groupSliceData[valueField] = 0;

				const colors = series.get("colors");
				if (colors) {
					colors.setPrivate("currentStep", this.getPrivate("currentStep"));
					colors.setPrivate("currentPass", this.getPrivate("currentPass"));
					colors.setPrivate("currentCount", this.getPrivate("currentCount"));
				}
				series.data.push(groupSliceData);

				groupDataItem = series.dataItems[series.dataItems.length - 1];

				groupDataItem.get("slice").events.on("click", () => {
					this.handleClick();
				});

				this.setPrivate("groupDataItem", groupDataItem);

				// Add to legend
				if (legend) {
					legend.data.push(groupDataItem);

					//const legendDataItem = groupDataItem.get("legendDataItem");
					groupDataItem.on("visible", (visible) => {
						if (visible) {
							this.zoomOut();
						}
					})
				}

			}

			// Recalculate group value and decorate small slices as necessary
			const threshold = this.get("threshold", 0);
			const limit = this.get("limit", 1000);
			const normalDataItems: any = [];
			const smallDataItems: any = [];
			let groupValue = 0;
			if (threshold || limit) {

				$array.each(series.dataItems, (item, index) => {
					const legendDataItem = item.get("legendDataItem");
					if (((item.get("valuePercentTotal") <= threshold) || (index > (limit - 1))) && groupDataItem !== item) {
						groupValue += item.get("value", 0);
						smallDataItems.push(item);
						item.hide(0);
						if (legendDataItem) {
							legendDataItem.get("itemContainer").hide(0);
						}
					}
					else {
						normalDataItems.push(item);
						if (legendDataItem) {
							legendDataItem.get("itemContainer").show(0);
						}
					}
				});

				this.setPrivate("normalDataItems", normalDataItems);
				this.setPrivate("smallDataItems", smallDataItems);
				this.updateGroupDataItem(groupValue);

			}

		}
	}

	/**
	 * Groups the small slices again, as a click on `zoomOutButton` does.
	 */
	public zoomOut(): void {
		const groupDataItem = this.getPrivate("groupDataItem");
		if (groupDataItem) {
			groupDataItem.show();
		}

		const clickBehavior = this.get("clickBehavior");
		if (clickBehavior == "zoom") {
			const normalDataItems: any = this.getPrivate("normalDataItems", []);
			$array.each(normalDataItems, (item: any, _index) => {
				item.show();
			});
		}

		const smallDataItems: any = this.getPrivate("smallDataItems", []);
		$array.each(smallDataItems, (item: any, _index) => {
			item.hide();
		});

		if (this.zoomOutButton) {
			this.zoomOutButton.hide();
		}
	}

	private updateGroupDataItem(groupValue: number): void {
		const series = this.get("series");
		if (series) {
			const groupSliceData: any = {};
			const categoryField = series.get("categoryField", "category");
			const valueField = series.get("valueField", "value");
			groupSliceData[categoryField] = this.get("groupName", "");
			groupSliceData[valueField] = groupValue;
			series.data.setIndex(series.data.length - 1, groupSliceData);

			const groupDataItem = this.getPrivate("groupDataItem");
			if (groupValue == 0) {
				groupDataItem!.hide(0);
			}
			else if (groupDataItem!.isHidden()) {
				groupDataItem!.show();
			}

			const clickBehavior = this.get("clickBehavior");
			if (clickBehavior != "none") {
				groupDataItem!.get("slice").set("toggleKey", "none");
			}
		}
	}

	private handleClick(): void {
		const clickBehavior = this.get("clickBehavior");
		const smallDataItems = this.getPrivate("smallDataItems");

		if (clickBehavior == "none" || (smallDataItems && smallDataItems.length == 0)) {
			return;
		}

		const series = this.get("series");
		const groupDataItem = this.getPrivate("groupDataItem");

		// Hide group slice
		groupDataItem!.hide();

		// Reveal small slices
		$array.each(series!.dataItems, (item) => {
			if (smallDataItems!.indexOf(item) !== -1) {
				item.show();
			}
			else if (clickBehavior == "zoom") {
				item.hide();
			}
		});

		if (!this.zoomOutButton) {
			this.initZoomButton();
		}
		this.zoomOutButton!.show();
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this.isDirty("series")) {
			const series = this.get("series");
			if (series) {
				series.events.on("datavalidated", (_ev) => {
					this.removePrivate("groupDataItem");
					this.handleData();
				});
			}
		}
	}

}