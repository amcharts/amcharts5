import type { DataItem } from "../../core/render/Component";
import { Series, ISeriesSettings, ISeriesDataItem, ISeriesPrivate, ISeriesEvents } from "./Series";
import { Container } from "../../core/render/Container";
import { Label } from "../../core/render/Label";
import { RoundedRectangle } from "../../core/render/RoundedRectangle";
import { Template } from "../../core/util/Template";
import { ListTemplate } from "../../core/util/List";
import { Scrollbar } from "../../core/render/Scrollbar";
import { HorizontalLayout } from "../../core/render/HorizontalLayout";
import { GridLayout } from "../../core/render/GridLayout";
import { setFit, fontKey } from "../../core/util/Fit";
import type { Entity, IEntitySettings } from "../../core/util/Entity";
import type { Color } from "../../core/util/Color";
import * as $array from "../../core/util/Array";
import * as $type from "../../core/util/Type";
import * as $utils from "../../core/util/Utils";

export interface ILegendDataItem extends ISeriesDataItem {

	/**
	 * The [[Container]] that holds all elements of the legend item.
	 */
	itemContainer: Container;

	/**
	 * The marker's container.
	 */
	marker: Container;

	/**
	 * The rectangle of the default marker.
	 */
	markerRectangle: RoundedRectangle;

	/**
	 * The label with the item's name.
	 */
	label: Label;

	/**
	 * The label with the item's value.
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
	 * Shows a plain rectangle marker instead of one that mimics the look of
	 * the item.
	 *
	 * @default false
	 */
	useDefaultMarker?: boolean;

	/**
	 * Setting of each legend item (a series or a data item) to take its name
	 * from.
	 *
	 * @default "name"
	 */
	nameField?: string;

	/**
	 * Setting of each legend item to take its marker's fill color from.
	 *
	 * @default "fill"
	 */
	fillField?: string;

	/**
	 * Setting of each legend item to take its marker's stroke color from.
	 *
	 * @default "stroke"
	 */
	strokeField?: string;

	/**
	 * Which part of a legend item toggles the chart item when clicked:
	 * * `"itemContainer"` - the whole legend item (default).
	 * * `"marker"` - the marker only.
	 * * `"none"` - nothing; the legend items cannot be toggled.
	 *
	 * @default "itemContainer"
	 * @since 5.0.13
	 */
	clickTarget?: "itemContainer" | "marker" | "none"

	/**
	 * Fits the legend into the chart, a step at a time as room runs out:
	 *
	 * * Empty value labels give their room back.
	 * * Then the legend gets smaller, down to three quarters of its size.
	 * * Then an item label still too wide for the legend is shortened, and
	 *   a legend still too tall scrolls.
	 * * When not even one row fits, the legend is hidden.
	 *
	 * Above or below the chart, the legend takes at most 30% of the chart's
	 * height; beside it, at most 40% of its width. A `width`, `height`,
	 * `maxWidth`, `maxHeight`, `scale` or `verticalScrollbar` set on the legend
	 * is kept.
	 *
	 * @default false
	 * @since 5.22.0
	 * @see {@link https://docs.amcharts.com/v5/concepts/legend/#fitting-into-the-chart} for more info
	 */
	autoFit?: boolean;

}

export interface ILegendPrivate extends ISeriesPrivate {
}

export interface ILegendEvents extends ISeriesEvents {

}

/**
 * A list of items, one per series or data item, that can be clicked to show
 * or hide them.
 *
 * @important
 * @see {@link https://docs.amcharts.com/v5/concepts/legend/} for more info
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

	// `autoFit`: whether it was ever on, and whether the legend is fitted now
	protected _fitOn: boolean = false;
	protected _fitted: boolean = false;
	// `autoFit`: each item label's full width, for its text
	protected _labelWidths: { [uid: number]: { text: string, width: number, font: string } } = {};
	// `autoFit`: the scrollbar it adds
	protected _fitScrollbar?: Scrollbar;

	public _beforeChanged() {
		super._beforeChanged();
		if (this.get("autoFit") && !this._fitOn) {
			this._fitOn = true;
			// fitted once a frame is drawn, as settings written while it is prepared can get lost
			this._disposers.push(this._root.events.on("frameended", () => {
				const on = this.get("autoFit", false);
				const parent = this.parent;
				if ((on || this._fitted) && parent && this._passDue([this], [parent.innerWidth(), parent.innerHeight(), this._contentWidth, this._contentHeight, this._root.width(), this._root.height(), this._root._fontLoads].join())) {
					this._fitted = on;
					this._fitItems(on);
				}
			}));
		}
	}

	// a legend has no bullet labels to fit
	protected _fitBulletLabels() {
	}

	protected _dispose() {
		const scrollbar = this._fitScrollbar;
		if (scrollbar && !scrollbar.isDisposed()) {
			scrollbar.dispose();
		}
		super._dispose();
	}

	// `autoFit`: fits the legend into its room, see the setting; gives back what it set when not `on`
	protected _fitItems(on: boolean): void {
		const parent = this.parent;
		if (this.isDisposed() || !parent) {
			return;
		}
		if (on) {
			// hidden by the author or a theme: left alone
			if (!this.get("visible") || (this.get("forceHidden") && !this.isComputedSetting("forceHidden"))) {
				return;
			}
			if (this.isShowing() || this.isHiding()) {
				this.markDirty();
				return;
			}
		}

		// the room: part of the chart's width beside it, part of its height above or below it
		const side = parent.get("layout") instanceof HorizontalLayout;
		const room = (key: "width" | "height") => {
			let container = parent;
			while (container.parent && container.get(key) == null && container.getPrivate(key) == null) {
				container = container.parent;
			}
			return key == "width" ? container.innerWidth() : container.innerHeight();
		};
		const authored = (key: "width" | "height" | "maxWidth") => $type.isNumber(this.get(key)) && !this.isComputedSetting(key);
		// beside the chart, the legend is laid out in the room it gets here
		const bound = on && side && !authored("width") && !authored("maxWidth") ? room("width") * 0.4 : undefined;
		let roomW = bound || this.maxWidth();
		if (bound == null && this.isComputedSetting("maxWidth")) {
			// the width it gets without the one fitting gave it
			const given = this.getPrivate("maxWidth");
			const ownWidth = this.get("width");
			roomW = $type.isNumber(given) ? given : $type.isNumber(ownWidth) ? ownWidth : parent.innerWidth();
		}
		const maxHeight = this.get("maxHeight");
		const roomH = Math.min(authored("height") ? this.height() : side ? parent.innerHeight() : room("height") * 0.3, $type.isNumber(maxHeight) ? maxHeight : Infinity);
		if (!(roomW > 0 && roomH > 0)) {
			return;
		}

		const least = 0.75;
		const readable = 40;
		const padding = this.get("paddingLeft", 0) + this.get("paddingRight", 0);
		const inRow = this.get("layout") instanceof HorizontalLayout;
		// the width its items need with their labels in full: all in a row, or else the widest
		let width = 0;
		const widths: { [uid: number]: { text: string, width: number, font: string } } = {};
		const labels: Array<{ label: Label, item: Container, text: string, known?: { text: string, width: number }, margins: number }> = [];
		// each item's width with its label in full
		const fullWidths: { [uid: number]: number } = {};
		let row = 0;
		$array.each(this.dataItems, (dataItem) => {
			const item = dataItem.get("itemContainer");
			if (!item || item.isDisposed() || !item.isVisible()) {
				return;
			}
			if (!row) {
				row = item.height() + item.get("marginTop", 0) + item.get("marginBottom", 0);
			}
			const margins = item.get("marginLeft", 0) + item.get("marginRight", 0);
			let full = item.width();
			// a value label with no text, and none to come from its item, gives its room back
			const value = dataItem.get("valueLabel");
			const context: any = dataItem.dataContext;
			const source: any = context && context.component ? context.component : context;
			if (value && !value.isDisposed()) {
				setFit(value, "forceHidden", on && !value.get("text") && !(source && source.get && (source.get("legendValueText") || source.get("legendRangeValueText"))) ? true : undefined);
			}
			const label = dataItem.get("label");
			if (label && !label.isDisposed()) {
				const text = label.text._getText();
				const font = fontKey(label);
				let known: { text: string, width: number, font: string } | undefined = this._labelWidths[label.uid];
				if (!label.isComputedSetting("maxWidth")) {
					known = { text: text, width: label.width(), font: font };
				}
				else if (known && known.font !== font) {
					// measured in another font: given back, and measured again
					known = undefined;
				}
				if (known) {
					widths[label.uid] = known;
					if (known.text == text) {
						full += known.width - label.width();
					}
					fullWidths[item.uid] = full;
				}
				labels.push({ label: label, item: item, text: text, known: known, margins: margins });
			}
			width = inRow ? width + full + margins : Math.max(width, full + margins);
		});
		this._labelWidths = widths;

		// smaller, then shortened and scrolling at its own size, then hidden when not even one row fits;
		// only beside the chart does a smaller legend get more room for its items
		width += padding;
		const height = this._contentHeight;

		// a grid made smaller is laid out as much wider, so it fits more items in a row: the largest
		// size at which its rows fit, with the columns the grid makes at that size
		const layout = this.get("layout");
		const grid = on && bound == null && !inRow && layout instanceof GridLayout && !authored("width") && !authored("maxWidth") && !(this.isUserSetting("scale") && !this.isComputedSetting("scale")) ? layout : undefined;
		let fits = roomH / height;
		let fullHeight = height;
		if (grid) {
			const columns = (scale: number) => {
				const inner = roomW / scale - padding;
				// each item as wide as it gets at this size: its label in full, or shortened to the legend
				return grid._columns(this, inner, (child) => {
					const full = fullWidths[child.uid];
					return full == null ? 0 : Math.min(full, inner - child.get("marginLeft", 0) - child.get("marginRight", 0)) - child.width();
				}).length;
			};
			// what the content has besides the rows stays as it is
			const rest = height - grid._rowsHeight(this, grid._columns(this, this.maxWidth() - padding).length);
			const heightWith = (count: number) => rest + grid._rowsHeight(this, count);
			const first = columns(1);
			const most = columns(least);
			fits = 0;
			for (let count = first; count <= most; count++) {
				// the largest size with at least this many columns
				let top = 1;
				if (count > first) {
					let low = least;
					for (let i = 0; i < 30; i++) {
						const mid = (low + top) / 2;
						if (columns(mid) >= count) {
							low = mid;
						}
						else {
							top = mid;
						}
					}
					top = low;
				}
				fits = Math.max(fits, Math.min(top, roomH / heightWith(count)));
			}
			fullHeight = heightWith(most);
		}

		// the width it is laid out in follows the item widths only, so it can not feed back
		// into the height it gets smaller for
		const scroll = on && fullHeight * least > roomH + 0.5 && (this.get("verticalScrollbar") == null || this.isComputedSetting("verticalScrollbar"));
		const scaleW = Math.max(least, Math.min(1, bound != null || inRow ? roomW / width : 1));
		const scale = Math.max(least, Math.min(scaleW, scroll ? roomH / row : fits));
		const shown = on && scale < 0.995 ? scale : 1;
		if (bound != null) {
			setFit(this, "maxWidth", bound / scaleW, 0.5);
		}
		else {
			setFit(this, "maxWidth", grid && shown < 1 ? roomW / shown : undefined, 0.5);
		}
		// a label too wide for the legend at this size is shortened
		const inner = (bound != null ? bound / scaleW : grid ? roomW / shown : roomW) - padding;
		let narrow = false;
		$array.each(labels, (entry) => {
			const most = inner - (entry.item.width() - entry.label.width()) - entry.margins;
			const shorten = on && entry.known != null && entry.known.text == entry.text && entry.known.width > most + 0.5;
			if (shorten && most < readable) {
				narrow = true;
			}
			// no narrower than readable: below that the legend goes
			setFit(entry.label, "maxWidth", shorten ? Math.max(most, readable) : undefined, 0.5);
			setFit(entry.label, "oversizedBehavior", shorten ? "truncate" : undefined);
		});
		setFit(this, "forceHidden", on && (narrow || row * least > roomH + 0.5 || (inRow && width * least > roomW + 1)) ? true : undefined);
		setFit(this, "scale", on && scale < 0.995 ? scale : undefined);
		setFit(this, "height", scroll ? roomH / scale : undefined, 0.5);
		if (scroll) {
			if (!this._fitScrollbar) {
				// slim, as the legend has little room
				this._fitScrollbar = Scrollbar.new(this._root, { orientation: "vertical", marginLeft: 4, marginRight: 0 })._markC("orientation", "marginLeft", "marginRight");
			}
			if (this.get("verticalScrollbar") !== this._fitScrollbar) {
				this._setC("verticalScrollbar", this._fitScrollbar);
			}
		}
		else if (this.isComputedSetting("verticalScrollbar")) {
			this.remove("verticalScrollbar");
		}
	}

	/**
	 * The containers of the legend items, one per item.
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
	 * The markers of the legend items.
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
	 * The name labels of the legend items.
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
	 * The value labels of the legend items.
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
	 * The rectangles of the default markers.
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
					if (item && item.on) {
						item.on(fillField as any, () => {
							markerRectangle._setC("fill", item.get(fillField as any));
						})

						item.on(strokeField as any, () => {
							markerRectangle._setC("stroke", item.get(strokeField as any));
						})
					}
				}

				markerRectangle._setCAll({ fill, stroke });

				// this solves if template field is set on slice
				const component = item && item.component;
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

						// Keyboard focus is on the whole item: ENTER / SPACE on it
						// toggles as a click on the marker does
						itemContainer.events.on("click", (ev) => {
							if (ev.simulated) {
								marker.events.dispatch("click", { ...ev, target: marker });
							}
						});
					}
					this._addClickEvents(clickContainer, item, dataItem)
				}
			}

			// Sort children
			this.children.values.sort((a, b) => {
				const targetA = a.dataItem ? a.dataItem.dataContext : undefined;
				const targetB = b.dataItem ? b.dataItem.dataContext : undefined;
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
