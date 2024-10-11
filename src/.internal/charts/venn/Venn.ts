import type { DataItem } from "../../core/render/Component";
import type { ILegendDataItem } from "../../core/render/Legend";
import type { Color } from "../../core/util/Color";
import type { ColorSet } from "../../core/util/ColorSet";
import type { Pattern } from "../../core/render/patterns/Pattern";
import type { PatternSet } from "../../core/util/PatternSet";

import { VennDefaultTheme } from "./VennDefaultTheme";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate } from "../../core/render/Series";
import { Template } from "../../core/util/Template";
import { Graphics, visualSettings } from "../../core/render/Graphics";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { ListTemplate } from "../../core/util/List";

import * as $utils from "../../core/util/Utils";
import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as venn from "./vennjs/index.js";

export interface IVennDataItem extends ISeriesDataItem {

	/**
	 * Array of categories that this data item is an intersection for.
	 */
	intersections: Array<string>;

	/**
	 * Category.
	 */
	category: string;

	/**
	 * Slice visaul element.
	 */
	slice: Graphics;

	/**
	 * Slice label.
	 */
	label: Label;

	/**
	 * A related legend data item.
	 */
	legendDataItem: DataItem<ILegendDataItem>;

	/**
	 * Fill color used for the slice and related elements, e.g. legend marker.
	 */
	fill: Color;

	/**
	 * Fill pattern used for the slice and related elements, e.g. legend marker.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/} for more info
	 * @since 5.10.0
	 */
	fillPattern: Pattern;

}

export interface IVennSettings extends ISeriesSettings {

	/**
	 * A field in data that holds array of categories that overlap.
	 */
	intersectionsField?: string;

	/**
	 * A [[ColorSet]] to use when asigning colors for slices.
	 */
	colors?: ColorSet;

	/**
	 * A [[PatternSet]] to use when asigning patterns for slices.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/concepts/colors-gradients-and-patterns/patterns/#Pattern_sets} for more info
	 * @since 5.10.0
	 */
	patterns?: PatternSet;

	/**
	 * A field in data that holds category names.
	 */
	categoryField?: string;

	/**
	 * A field that holds color for slice fill.
	 */
	fillField?: string;

}

export interface IVennPrivate extends ISeriesPrivate {
}

/**
 * Creates a Venn diagram.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/venn/} for more info
 * @important
 */
export class Venn extends Series {

	public static className: string = "Venn";
	public static classNames: Array<string> = Series.classNames.concat([Venn.className]);

	declare public _settings: IVennSettings;
	declare public _privateSettings: IVennPrivate;
	declare public _dataItemSettings: IVennDataItem;

	protected _sets: string = "";

	/**
	 * A [[Container]] that holds all slices (circles and intersections).
	 *
	 * @default Container.new()
	 */
	public readonly slicesContainer = this.children.push(Container.new(this._root, {}));

	/**
	 * A [[Container]] that holds all labels.
	 *
	 * @default Container.new()
	 */
	public readonly labelsContainer = this.children.push(Container.new(this._root, {}));

	/**
	 * A [[Graphics]] element that is used to show the shape of the hovered slice
	 * or intersection.
	 *
	 * @default Graphics.new()
	 */
	public readonly hoverGraphics = this.slicesContainer.children.push(Graphics.new(this._root, { position: "absolute", isMeasured: false }))

	protected _hovered?: Graphics;

	protected _afterNew() {
		this._defaultThemes.push(VennDefaultTheme.new(this._root));
		this.fields.push("intersections", "category", "fill");
		super._afterNew();
	}


	/**
	 * A [[ListTemplate]] of all slices in series.
	 *
	 * `slices.template` can also be used to configure slices.
	 */
	public readonly slices: ListTemplate<Graphics> = this.addDisposer(this._makeSlices());


	/**
	 * @ignore
	 */
	public makeSlice(dataItem: DataItem<this["_dataItemSettings"]>): Graphics {
		const slice = this.slicesContainer.children.push(this.slices.make());
		slice.events.on("pointerover", (e) => {
			this._hovered = e.target;
			this._updateHover();
		})

		slice.events.on("pointerout", () => {
			this._hovered = undefined;
			this.hoverGraphics.hide();
		})

		slice.on("fill", () => {
			this.updateLegendMarker(dataItem);
		})

		slice.on("fillPattern", () => {
			this.updateLegendMarker(dataItem);
		})

		slice.on("stroke", () => {
			this.updateLegendMarker(dataItem);
		})

		slice._setDataItem(dataItem);
		dataItem.set("slice", slice);
		this.slices.push(slice);

		return slice;
	}

	protected _updateHover() {
		if (this._hovered) {
			const hoverGraphics = this.hoverGraphics;
			hoverGraphics.set("svgPath", this._hovered.get("svgPath"));
			hoverGraphics.show();
			hoverGraphics.toFront();
		}
	}

	/**
	 * A [[ListTemplate]] of all slice labels in series.
	 *
	 * `labels.template` can also be used to configure slice labels.
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(this._makeLabels());

	/**
	 * @ignore
	 */
	public makeLabel(dataItem: DataItem<this["_dataItemSettings"]>): Label {
		const label = this.labelsContainer.children.push(this.labels.make());
		label._setDataItem(dataItem);
		dataItem.set("label", label);
		this.labels.push(label);
		return label;
	}


	protected _makeSlices(): ListTemplate<Graphics> {
		return new ListTemplate(
			Template.new({}),
			() => Graphics._new(this._root, {
				themeTags: $utils.mergeTags(this.slices.template.get("themeTags", []), ["venn", "series"])
			}, [this.slices.template]),
		);
	}

	protected _makeLabels(): ListTemplate<Label> {
		return new ListTemplate(
			Template.new({}),
			() => Label._new(this._root, {
				themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["venn", "series"])
			}, [this.labels.template]),
		);
	}


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);


		if (dataItem.get("fill") == null) {
			let colors = this.get("colors");
			if (colors) {
				dataItem.setRaw("fill", colors.next());
			}
		}

		if (dataItem.get("fillPattern") == null) {
			let patterns = this.get("patterns");
			if (patterns) {
				dataItem.setRaw("fillPattern", patterns.next());
			}
		}

		this.makeSlice(dataItem);
		this.makeLabel(dataItem);
	}

	public _prepareChildren() {
		super._prepareChildren();

		if (this._valuesDirty || this._sizeDirty) {
			const sets: any[] = [];

			// prepare data for venn
			$array.each(this.dataItems, (dataItem) => {
				const set: any = {};
				const intersections = dataItem.get("intersections");
				if (intersections) {
					set.sets = intersections;
				}
				else {
					set.sets = [dataItem.get("category")];
				}
				set.size = dataItem.get("valueWorking");

				//if (set.size > 0) { // not good
				sets.push(set);
				//}

				const label = dataItem.get("label");
				const slice = dataItem.get("slice");


				let visible = true;
				if (dataItem.get("value") == 0) {
					visible = false;

					if (slice) {
						slice.setAll({
							x: this.width() / 2,
							y: this.height() / 2
						})
					}
				}
				if (label) {
					label.setPrivate("visible", visible);
				}
			})


			const newSets = sets.toString();

			this._sets = newSets;

			if (sets.length > 0) {
				let vennData = venn.venn(sets);
				vennData = venn.normalizeSolution(vennData, null, null);
				vennData = venn.scaleSolution(vennData, this.innerWidth(), this.innerHeight(), 0);

				const circles: any = {};
				for (let name in vennData) {
					let item = vennData[name];
					let r = item.radius;

					const dataItem = this.getDataItemByCategory(name);
					if (dataItem) {
						const slice = dataItem.get("slice");
						const color = dataItem.get("fill");
						slice._setDefault("fill", color);

						const fillPattern = dataItem.get("fillPattern");
						slice._setDefault("fillPattern", fillPattern);

						slice._setDefault("stroke", color);

						this.updateLegendMarker(dataItem);

						slice.set("svgPath", "M" + item.x + "," + item.y + " m -" + r + ", 0 a " + r + "," + r + " 0 1,1 " + r * 2 + ",0 a " + r + "," + r + " 0 1,1 -" + r * 2 + ",0");
						circles[name] = item;
					}
				}


				let centers: any = venn.computeTextCentres(circles, sets);


				$array.each(this.dataItems, (dataItem) => {
					let name = dataItem.get("category");
					let center = centers[name];
					const intersections = dataItem.get("intersections");
					if (intersections) {
						name = intersections.toString();
						center = centers[name];
						if (center) {
							let set = intersections;
							let cc = [];

							for (let s = 0; s < set.length; s++) {
								cc.push(circles[set[s]]);
							}
							let intersectionPath = venn.intersectionAreaPath(cc)
							let slice = dataItem.get("slice");

							const color = dataItem.get("fill");
							slice._setDefault("fill", color);
							slice._setDefault("stroke", color);

							const fillPattern = dataItem.get("fillPattern");
							slice._setDefault("fillPattern", fillPattern);

							slice.setAll({ svgPath: intersectionPath });
						}
					}

					if (center) {
						let label = dataItem.get("label");
						label.setAll({ x: center.x, y: center.y });
					}

					this.updateLegendValue(dataItem);
				})
			}

			this._updateHover();
		}
	}

	/**
	 * Looks up and returns a data item by its category.
	 *
	 * @param   category  Category
	 * @return      Data item
	 */
	public getDataItemByCategory(id: string): DataItem<this["_dataItemSettings"]> | undefined {
		return $array.find(this.dataItems, (dataItem: any) => {
			return dataItem.get("category") == id;
		})
	}


	/**
	 * Shows series's data item.
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

		let value = dataItem.get("value");

		const animation = dataItem.animate({ key: "valueWorking", to: value, duration: duration, easing: easing });
		if (animation) {
			promises.push(animation.waitForStop());
		}

		const label = dataItem.get("label");
		if (label) {
			promises.push(label.show(duration));
		}

		const slice = dataItem.get("slice");
		if (slice) {
			promises.push(slice.show(duration));
		}


		const intersections = dataItem.get("intersections");
		if (intersections) {
			$array.each(intersections, (cat) => {
				const di = this.getDataItemByCategory(cat);
				if (di && di.isHidden()) {
					this.showDataItem(di, duration);
				}
			})
		}

		if (!intersections) {
			const category = dataItem.get("category");

			$array.each(this.dataItems, (di) => {
				const intersections = di.get("intersections");
				if (di != dataItem && intersections) {
					let allVisible = true;
					$array.each(intersections, (cat) => {
						const dii = this.getDataItemByCategory(cat);
						if (dii && dii.isHidden()) {
							allVisible = false;
						}
					})

					if (allVisible && intersections.indexOf(category) != -1) {
						if (di.isHidden()) {
							this.showDataItem(di, duration);
						}
					}
				}
			})
		}

		await Promise.all(promises);
	}

	/**
	 * Hides series's data item.
	 *
	 * @param   dataItem  Data item
	 * @param   duration  Animation duration in milliseconds
	 * @return            Promise
	 */
	public async hideDataItem(dataItem: DataItem<this["_dataItemSettings"]>, duration?: number): Promise<void> {
		const promises = [super.hideDataItem(dataItem, duration)];
		const hiddenState = this.states.create("hidden", {})

		if (!$type.isNumber(duration)) {
			duration = hiddenState.get("stateAnimationDuration", this.get("stateAnimationDuration", 0));
		}

		const easing = hiddenState.get("stateAnimationEasing", this.get("stateAnimationEasing"));

		const animation = dataItem.animate({ key: "valueWorking", to: 0, duration: duration, easing: easing });
		if (animation) {
			promises.push(animation.waitForStop());
		}

		const label = dataItem.get("label");
		if (label) {
			promises.push(label.hide(duration));
		}

		const slice = dataItem.get("slice");
		if (slice) {
			promises.push(slice.hide(duration));
			slice.hideTooltip();
		}

		if (!dataItem.get("intersections")) {
			$array.each(this.dataItems, (di) => {
				const intersections = di.get("intersections");
				if (di != dataItem && intersections) {
					if (intersections.indexOf(dataItem.get("category")) != -1) {
						this.hideDataItem(di, duration);
					}
				}
			})
		}

		await Promise.all(promises);
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		let label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
		}

		let slice = dataItem.get("slice");
		if (slice) {
			this.slices.removeValue(slice);
			slice.dispose();
		}
	}

	/**
	 * @ignore
	 */
	public updateLegendMarker(dataItem: DataItem<this["_dataItemSettings"]>) {
		const slice = dataItem.get("slice");

		if (slice) {
			const legendDataItem = dataItem.get("legendDataItem");
			if (legendDataItem) {
				const markerRectangle = legendDataItem.get("markerRectangle");
				if (!dataItem.isHidden()) {
					$array.each(visualSettings, (setting: any) => {
						markerRectangle.set(setting, slice.get(setting));
					})
				}
			}
		}
	}

	/**
	 * Triggers hover on a series data item.
	 *
	 * @since 5.0.7
	 * @param  dataItem  Target data item
	 */
	public hoverDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		const slice = dataItem.get("slice");
		if (slice && !slice.isHidden()) {
			slice.hover();
		}
	}

	/**
	 * Triggers un-hover on a series data item.
	 *
	 * @since 5.0.7
	 * @param  dataItem  Target data item
	 */
	public unhoverDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		const slice = dataItem.get("slice");
		if (slice) {
			slice.unhover();
		}
	}
}
