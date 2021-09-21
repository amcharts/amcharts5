import type { DataItem } from "../../core/render/Component";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate } from "./Series";
import type { Root } from "../../core/Root";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Rectangle } from "../../core/render/Rectangle";
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
	isHidden: () => boolean;
	show: () => void;
	hide: () => void;
	createLegendMarker?: () => {}
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

}

export interface ILegendPrivate extends ISeriesPrivate {
}

/**
 * A universal legend control.
 *
 * @important
 * @see {@link https://www.amcharts.com/docs/v5/concepts/legend/} for more info
 */
export class Legend extends Series {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: Legend["_settings"], template?: Template<Legend>): Legend {
		settings.themeTags = $utils.mergeTags(settings.themeTags, ["legend"]);
		const x = new Legend(root, settings, true, template);
		x._afterNew();
		return x;
	}


	protected _afterNew() {
		this.fields.push("name", "stroke", "fill");
		super._afterNew();
	}

	public static className: string = "Legend";
	public static classNames: Array<string> = Series.classNames.concat([Legend.className]);

	declare public _settings: ILegendSettings;
	declare public _privateSettings: ILegendPrivate;
	declare public _dataItemSettings: ILegendDataItem;

	/**
	 * List of all [[Container]] elements for legend items.
	 *
	 * @default new ListTemplate<Container>
	 */
	public readonly itemContainers: ListTemplate<Container> = new ListTemplate(
		Template.new({}),
		() => Container.new(this._root, {
			themeTags: $utils.mergeTags(this.itemContainers.template.get("themeTags", []), ["legend", "item"]),
			themeTagsSelf: $utils.mergeTags(this.itemContainers.template.get("themeTagsSelf", []), ["itemcontainer"]),
			background: Rectangle.new(this._root, {
				themeTags: $utils.mergeTags(this.itemContainers.template.get("themeTags", []), ["legend", "item", "background"]),
				themeTagsSelf: $utils.mergeTags(this.itemContainers.template.get("themeTagsSelf", []), ["itemcontainer"])
			})
		}, this.itemContainers.template)
	);

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
	public readonly markers: ListTemplate<Container> = new ListTemplate(
		Template.new({}),
		() => Container.new(this._root, {
			themeTags: $utils.mergeTags(this.markers.template.get("themeTags", []), ["legend", "marker"])
		}, this.markers.template)
	);

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
	public readonly labels: ListTemplate<Label> = new ListTemplate(
		Template.new({}),
		() => Label.new(this._root, {
			themeTags: $utils.mergeTags(this.labels.template.get("themeTags", []), ["legend", "label"])
		}, this.labels.template)
	);

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
	public readonly valueLabels: ListTemplate<Label> = new ListTemplate(
		Template.new({}),
		() => Label.new(this._root, {
			themeTags: $utils.mergeTags(this.valueLabels.template.get("themeTags", []), ["legend", "label", "value"])
		}, this.valueLabels.template)
	);

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
	public readonly markerRectangles: ListTemplate<RoundedRectangle> = new ListTemplate(
		Template.new({}),
		() => RoundedRectangle.new(this._root, {
			themeTags: $utils.mergeTags(this.markerRectangles.template.get("themeTags", []), ["legend", "marker", "rectangle"])
		}, this.markerRectangles.template)
	);


	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const itemContainer = this.makeItemContainer(dataItem);

		const nameField = this.get("nameField");
		const fillField = this.get("fillField");
		const strokeField = this.get("strokeField");

		if (itemContainer) {
			const item = dataItem.dataContext as ILegendItem;

			if (item && item.set) {
				item.set(<any>"legendDataItem", dataItem);
			}

			if (item && item.show) {

				this._disposers.push(item.on("visible", (visible) => {
					itemContainer.set("disabled", !visible)
				}));

				if (!item.get("visible")) {
					itemContainer.set("disabled", false);
				}

				itemContainer.events.on("click", () => {

					const toggleDp = itemContainer._toggleDp;
					if (toggleDp) {
						toggleDp.dispose();
					}

					if (itemContainer.get("toggleKey") != "none") {
						const labelText = dataItem.get("label").text._getText();

						if (item.isHidden()) {
							item.show();
							itemContainer.set("disabled", false);
							this._root.readerAlert(this._root.language.translate("%1 shown", this._root.locale, labelText));
						}
						else {
							item.hide();
							itemContainer.set("disabled", true);
							this._root.readerAlert(this._root.language.translate("%1 hidden", this._root.locale, labelText));
						}
					}
				})
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

				markerRectangle.setAll({ fill, stroke });

			}

			const label = this.makeLabel();

			if (label) {
				itemContainer.children.push(label);
				label._setDataItem(dataItem);
				dataItem.set("label", label);

				label.text.on("text", () => {
					itemContainer.set("ariaLabel", label.text._getText() + "; " + this._root.language.translate("Press ENTER to toggle"));
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
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {

		let itemContainer = dataItem.get("itemContainer");
		if (itemContainer) {
			itemContainer.dispose();
			this.itemContainers.removeValue(itemContainer);
		}

		let marker = dataItem.get("marker");
		if (marker) {
			marker.dispose();
			this.markers.removeValue(marker);
		}

		let markerRectangle = dataItem.get("markerRectangle");
		if (markerRectangle) {
			markerRectangle.dispose();
			this.markerRectangles.removeValue(markerRectangle);
		}

		let label = dataItem.get("label");
		if (label) {
			label.dispose();
			this.labels.removeValue(label);
		}

		let valueLabel = dataItem.get("valueLabel");
		if (valueLabel) {
			valueLabel.dispose();
			this.valueLabels.removeValue(valueLabel);
		}

	}
}
