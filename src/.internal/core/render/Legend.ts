import type { DataItem } from "../../core/render/Component";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "./Series";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import type { Entity, IEntitySettings } from "../../core/util/Entity";
import type { Color } from "../../core/util/Color";
import * as $utils from "../../core/util/Utils";

export interface ILegendDataItem extends ISeriesDataItem {

	/**
	 * [[Container]] element holding all other legend item elements, labels,
	 * markers, etc.
	 */
	itemContainer: Container;

	/**
	 * Marker element.
	 */
	marker: Container;

	/**
	 * Marker rectangle element.
	 */
	markerRectangle: RoundedRectangle;

	/**
	 * Label element.
	 */
	label: Label;

	/**
	 * Value label element.
	 */
	valueLabel: Label;

	/**
	 * Marker fill color.
	 */
	fill?: Color;

	/**
	 * Marker stroke (outline) color.
	 */
	stroke?: Color;

	/**
	 * Name of the legend item.
	 */
	name?: string;

}

export interface ILegendItemSettings extends IEntitySettings {
	visible?: boolean;
}

/**
 * @ignore
 */
export interface ILegendItem extends Entity {
	_settings: ILegendItemSettings;
	isHidden?: () => boolean;
	show?: () => void;
	hide?: () => void;
	createLegendMarker?: () => {}
	component?: Series;
	updateLegendValue?: () => {}
	// how to define that properties of dataItem should have legendDataItem?
}

//type ILegendDataItemSettings = { [K in keyof ILegendDataItem]?: string; };

export interface ILegendSettings extends ISeriesSettings {

	/**
	 * If set to `true` the legend will not try to mimic appearance of the actual
	 * item but rather show default square marker.
	 *
	 * @default false
	 */
	useDefaultMarker?: boolean;

	/**
	 * A key to look up in data for a name of the data item.
	 *
	 */
	nameField?: string;

	/**
	 * A key to look up in data for a fill of the data item.
	 *
	 */
	fillField?: string;

	/**
	 * A key to look up in data for a stroke of the data item.
	 *
	 */
	strokeField?: string;

	/**
	 * Which legend item element will be clickable to toggle related chart item:
	 * * `"itemContainer"` - the whole legend item (default).
	 * * `"marker"` - legend item marker.
	 * * `"none"` - disables toggling of legend item.
	 *
	 * @default "itemContainer"
	 * @since 5.0.13
	 */
	clickTarget?: "itemContainer" | "marker" | "none"

}

export interface ILegendPrivate extends ISeriesPrivate {
}

export interface ILegendEvents extends ISeriesEvents {

}

/**
 * A universal legend control.
 *
 * @important
 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/} for more info
 */
export class Legend extends Series {
	protected _afterNew() {
		this._settings.themeTags = $utils.mergeTags(this._settings.themeTags, ["legend"]);
		this.fields.push("name", "stroke", "fill");
		super._afterNew();
	}

	public static className: string = "Legend";
	public static classNames: Array<string> = Series.classNames.concat([Legend.className]);

	declare public _settings: ILegendSettings;
	declare public _privateSettings: ILegendPrivate;
	declare public _dataItemSettings: ILegendDataItem;
	declare public _events: ILegendEvents;

	/**
	 * List of all [[Container]] elements for legend items.
	 *
	 * @default new ListTemplate<Container>
	 */
	public readonly itemContainers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			themeTags: $utils.mergeTags(this.itemContainers.template.get("themeTags", []), ["legend", "item"]),
			themeTagsSelf: $utils.mergeTags(this.itemContainers.template.get("themeTagsSelf", []), ["itemcontainer"]),
			background: RoundedRectangle.new(this._root, {
				themeTags: $utils.mergeTags(this.itemContainers.template.get("themeTags", []), ["legend", "item", "background"]),
				themeTagsSelf: $utils.mergeTags(this.itemContainers.template.get("themeTagsSelf", []), ["itemcontainer"])
			})
		}, [this.itemContainers.template])
	));

	/**
	 * @ignore
	 */
	public makeItemContainer(dataItem: DataItem<this["_dataItemSettings"]>): Container {
		const itemContainer = this.children.push(this.itemContainers.make());
		itemContainer._setDataItem(dataItem);
		this.itemContainers.push(itemContainer);
		itemContainer.states.create("disabled", {});
		return itemContainer;
	}

	/**
	 * @ignore
	 */
	public makeMarker(): Container {
		const marker = this.markers.make();
		this.markers.push(marker);
		marker.states.create("disabled", {});
		return marker;
	}

	/**
	 * List of legend marker elements.
	 *
	 * @default new ListTemplate<Container>
	 */
	public readonly markers: ListTemplate<Container> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Container._new(this._root, {
			themeTags: $utils.mergeTags(this.markers.template.get("themeTags", []), ["legend", "marker"])
		}, [this.markers.template])
	));

	/**
	 * @ignore
	 */
	public makeLabel(): Label {
		const label = this.labels.make();
		label.states.create("disabled", {});
		return label;
	}

	/**
	 * List of legend label elements.
	 *
	 * @default new ListTemplate<Label>
	 */
	public readonly labels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["legend", "label"])
		}, [this.labels.template])
	));

	/**
	 * @ignore
	 */
	public makeValueLabel(): Label {
		const valueLabel = this.valueLabels.make();
		valueLabel.states.create("disabled", {});
		return valueLabel;
	}

	/**
	 * List of legend value label elements.
	 *
	 * @default new ListTemplate<label>
	 */
	public readonly valueLabels: ListTemplate<Label> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => Label._new(this._root, {
			themeTags: $utils.mergeTags(this.valueLabels.template.get("themeTags", []), ["legend", "label", "value"])
		}, [this.valueLabels.template])
	));

	/**
	 * @ignore
	 */
	public makeMarkerRectangle(): RoundedRectangle {
		const markerRectangle = this.markerRectangles.make();
		markerRectangle.states.create("disabled", {});
		return markerRectangle;
	}

	/**
	 * List of rectangle elements used for default legend markers.
	 *
	 * @default new ListTemplate<RoundedRectangle>
	 */
	public readonly markerRectangles: ListTemplate<RoundedRectangle> = this.addDisposer(new ListTemplate(
		Template.new({}),
		() => RoundedRectangle._new(this._root, {
			themeTags: $utils.mergeTags(this.markerRectangles.template.get("themeTags", []), ["legend", "marker", "rectangle"])
		}, [this.markerRectangles.template])
	));


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const itemContainer = this.makeItemContainer(dataItem);

		const nameField = this.get("nameField");
		const fillField = this.get("fillField");
		const strokeField = this.get("strokeField");

		if (itemContainer) {
			const clickTarget = this.get("clickTarget", "itemContainer");

			const item = dataItem.dataContext as ILegendItem;

			if (item && item.set) {
				item.set(<any>"legendDataItem", dataItem);
			}

			itemContainer._setDataItem(dataItem);
			dataItem.set("itemContainer", itemContainer);

			const marker = this.makeMarker();
			if (marker) {
				itemContainer.children.push(marker);
				marker._setDataItem(dataItem);
				dataItem.set("marker", marker);

				const useDefaultMarker = this.get("useDefaultMarker");

				const markerRectangle = marker.children.push(this.makeMarkerRectangle());

				let fill = dataItem.get("fill");
				let stroke = dataItem.get("stroke");

				dataItem.set("markerRectangle", markerRectangle);

				if (item && item.get) {
					fill = item.get(fillField as any, fill);
					stroke = item.get(strokeField as any, stroke);
				}

				if (!stroke) {
					stroke = fill;
				}

				if (!useDefaultMarker) {
					if (item && item.createLegendMarker) {
						item.createLegendMarker();
					}
				}
				else {
					if (item.on) {
						item.on(fillField as any, () => {
							markerRectangle.set("fill", item.get(fillField as any));
						})

						item.on(strokeField as any, () => {
							markerRectangle.set("stroke", item.get(strokeField as any));
						})
					}
				}

				markerRectangle.setAll({ fill, stroke });

				// this solves if template field is set on slice
				const component = item.component;
				if (component && component.updateLegendMarker) {
					component.updateLegendMarker(item as any);
				}

			}

			const label = this.makeLabel();

			if (label) {
				itemContainer.children.push(label);
				label._setDataItem(dataItem);
				dataItem.set("label", label);

				label.text.on("text", () => {
					itemContainer.setRaw("ariaLabel", label.text._getText() + (this.get("clickTarget") !== "none" ? "; " + this._t("Press ENTER to toggle") : ""));
					itemContainer.markDirtyAccessibility();
				});

				if (item && item.get) {
					dataItem.set("name", item.get(nameField as any) as string);
				}

				let name = dataItem.get("name");

				if (name) {
					label.set("text", name);
				}
			}

			const valueLabel = this.makeValueLabel();
			if (valueLabel) {
				itemContainer.children.push(valueLabel);
				valueLabel._setDataItem(dataItem);
				dataItem.set("valueLabel", valueLabel);
			}

			if (item && item.show) {

				item.on("visible", (visible) => {
					itemContainer.set("disabled", !visible);
				})

				if (!item.get("visible")) {
					itemContainer.set("disabled", true);
				}

				if (clickTarget != "none") {
					let clickContainer = itemContainer;
					if (clickTarget == "marker") {
						clickContainer = marker;
					}
					this._addClickEvents(clickContainer, item, dataItem)
				}
			}

			// Sort children
			this.children.values.sort((a, b) => {
				const targetA = a.dataItem!.dataContext;
				const targetB = b.dataItem!.dataContext;
				if (targetA && targetB) {
					const indexA = this.data.indexOf(targetA);
					const indexB = this.data.indexOf(targetB);
					if (indexA > indexB) {
						return 1;
					}
					else if (indexA < indexB) {
						return -1;
					}
				}
				return 0;
			});

			if (item && item.updateLegendValue) {
				item.updateLegendValue();
			}
		}

	}


	protected _addClickEvents(container: Container, item: ILegendItem, dataItem: DataItem<this["_dataItemSettings"]>) {
		container.set("cursorOverStyle", "pointer");
		container.events.on("pointerover", () => {
			const component = item.component;
			if (component && component.hoverDataItem) {
				component.hoverDataItem(item as any)
			}
		})

		container.events.on("pointerout", () => {
			const component = item.component;
			if (component && component.hoverDataItem) {
				component.unhoverDataItem(item as any)
			}
		})

		container.events.on("click", () => {
			const labelText = dataItem.get("label").text._getText();

			if (item.show && item.isHidden && (item.isHidden() || item.get("visible") === false)) {
				item.show();
				container.set("disabled", false);
				this._root.readerAlert(this._t("%1 shown", this._root.locale, labelText));
			}
			else if (item.hide) {
				item.hide();
				container.set("disabled", true);
				this._root.readerAlert(this._t("%1 hidden", this._root.locale, labelText));
			}
		})
	}


	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {

		super.disposeDataItem(dataItem);

		const dataContext = dataItem.dataContext as any;
		if (dataContext && dataContext.get) {
			const di = dataContext.get("legendDataItem");
			if (di == dataItem) {
				dataContext.set("legendDataItem", undefined);
			}
		}

		let itemContainer = dataItem.get("itemContainer");
		if (itemContainer) {
			this.itemContainers.removeValue(itemContainer);
			itemContainer.dispose();
		}

		let marker = dataItem.get("marker");
		if (marker) {
			this.markers.removeValue(marker);
			marker.dispose();
		}

		let markerRectangle = dataItem.get("markerRectangle");
		if (markerRectangle) {
			this.markerRectangles.removeValue(markerRectangle);
			markerRectangle.dispose();
		}

		let label = dataItem.get("label");
		if (label) {
			this.labels.removeValue(label);
			label.dispose();
		}

		let valueLabel = dataItem.get("valueLabel");
		if (valueLabel) {
			this.valueLabels.removeValue(valueLabel);
			valueLabel.dispose();
		}

	}
}
