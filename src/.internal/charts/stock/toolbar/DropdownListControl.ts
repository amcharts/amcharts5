import { StockControl, IStockControlSettings, IStockControlPrivate, IStockControlEvents } from "./StockControl";
import { DropdownList, IDropdownListItem } from "./DropdownList";

import * as $array from "../../../core/util/Array";
import * as $type from "../../../core/util/Type";
import * as $utils from "../../../core/util/Utils";

export interface IDropdownListControlSettings extends IStockControlSettings {

	/**
	 * Item (or its ID) shown as selected when the control is created. It is
	 * not updated when another item is picked.
	 */
	currentItem?: string | IDropdownListItem;

	/**
	 * Keeps the button's label and icon when an item is picked, instead of
	 * showing that item.
	 */
	fixedLabel?: boolean;

	/**
	 * Items of the dropdown: strings, or objects with an `id` and a `label`.
	 */
	items?: Array<string | IDropdownListItem>;

	/**
	 * Limits the list's height to the chart's height minus 100 pixels,
	 * scrolling the rest.
	 */
	scrollable?: boolean;

	/**
	 * Most results of `searchCallback` to show; the rest are cut off with a
	 * note.
	 */
	maxSearchItems?: number,

	/**
	 * Shows a search field above the list. Typing filters the items or, with
	 * `searchCallback`, replaces them with its results.
	 */
	searchable?: boolean;

	/**
	 * Returns the items to show for a search query.
	 */
	searchCallback?: (query: string) => IDropdownListItem[];

	/**
	 * IDs of items to leave out of the list.
	 *
	 * @since 5.7.0
	 */
	exclude?: string[];

}

export interface IDropdownListControlPrivate extends IStockControlPrivate {
	dropdown?: DropdownList;
}

export interface IDropdownListControlEvents extends IStockControlEvents {
	/**
	 * An item was picked from the list, or selected with `setItemById()`.
	 */
	selected: {
		item: string | IDropdownListItem;
	};
}

/**
 * A control with a dropdown list of items, which can be searchable.
 *
 * Can be used in a [[StockToolbar]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/dropdown-list-control/} for more info
 */
export class DropdownListControl extends StockControl {
	public static className: string = "DropdownListControl";
	public static classNames: Array<string> = StockControl.classNames.concat([DropdownListControl.className]);

	declare public _settings: IDropdownListControlSettings;
	declare public _privateSettings: IDropdownListControlPrivate;
	declare public _events: IDropdownListControlEvents;

	protected _afterNew() {
		// @todo still needed?
		super._afterNew();

		const button = this.getPrivate("button")!;
		button.className = button.className + " am5stock-control-dropdown";
	}

	protected _initElements(): void {
		super._initElements();

		// Disable icon
		//this.getPrivate("icon")!.style.display = "none";

		// Create list
		const dropdownSettings: any = {
			control: this,
			parent: this.getPrivate("button"),
			searchable: this.get("searchable", false),
			scrollable: this.get("scrollable", false),
			items: [],
			exclude: this.get("exclude")
		}

		const maxSearchItems = this.get("maxSearchItems");
		if (maxSearchItems) {
			dropdownSettings.maxSearchItems = maxSearchItems;
		}

		const searchCallback = this.get("searchCallback");
		if (searchCallback) {
			dropdownSettings.searchCallback = searchCallback;
		}

		const items = this.get("items");
		let currentItem = this.get("currentItem");
		if (items) {
			$array.each(items, (item) => {
				const itemObject = $type.isString(item) ? {
					id: item,
					label: item
				} : item;
				dropdownSettings.items.push(itemObject);

				if ($type.isString(currentItem) && currentItem == itemObject.id) {
					currentItem = itemObject;
				}
			})
		}

		const dropdown = DropdownList.new(this._root, dropdownSettings);
		this.setPrivate("dropdown", dropdown);

		if (currentItem) {
			this.setItem(currentItem);
		}

		dropdown.events.on("closed", (_ev) => {
			this.set("active", false);
		});

		dropdown.events.on("invoked", (ev) => {
			this.setItem(ev.item);
			this.events.dispatch("selected", {
				type: "selected",
				item: ev.item,
				target: this
			});
		});

		this.on("active", (active) => {
			if (active) {
				//dropdown.setPrivate("currentId", $type.numberToString(this.get("strokeWidth")));
				this.setTimeout(() => dropdown.show(), 10);
			}
			else {
				dropdown.hide();
			}
		});
	}

	/**
	 * Shows an item on the button as the selected one, unless `fixedLabel` is
	 * set. Does not dispatch `selected`.
	 *
	 * @param  item  Item
	 */
	public setItem(item: string | IDropdownListItem): void {
		if (this.get("fixedLabel") !== true) {
			const label = this.getPrivate("label")!;
			if ($type.isString(item)) {
				label.innerHTML = item;
			}
			else {
				if (item.icon) {
					const icon = this.getPrivate("icon")!;
					icon.innerHTML = "";
					icon.appendChild(item.icon.cloneNode(true));
					icon.style.display = "";
				}
				else {
					//icon.style.display = "none";
				}

				if (item.label) {
					label.innerHTML = item.label;
					label.style.display = "";
				}
				else {
					label.innerHTML = "";
					label.style.display = "none";
				}
			}
		}
	}

	/**
	 * Selects an item by its ID: shows it on the button and dispatches
	 * `selected`.
	 *
	 * @since 5.9.0
	 * @param  id  Item ID
	 */
	public setItemById(id: string) {
		const item = this.getItemById(id);
		if (item !== undefined) {
			this.setItem(item);
			//this.set("currentItem", item);
			this.events.dispatch("selected", {
				type: "selected",
				item: item,
				target: this
			});
		}
	}

	/**
	 * Returns the item with an ID from `items`.
	 *
	 * @since 5.9.0
	 * @param  id  Item ID
	 * @return     Dropdown item
	 */
	public getItemById(id: string): IDropdownListItem | string | undefined {
		let found: IDropdownListItem | string | undefined;
		const items = this.get("items", []);
		$array.eachContinue(items, (item) => {
			let itemId = $type.isObject(item) ? item.id : item;
			if (itemId == id) {
				found = item;
				return false;
			}
			return true;
		});
		return found;
	}

	public _beforeChanged() {
		super._beforeChanged();
		if (this.isDirty("items")) {
			const dropdown = this.getPrivate("dropdown");
			if (dropdown) {
				const items = this.get("items");
				const dropdownItems: IDropdownListItem[] = [];
				let currentItem = this.get("currentItem");
				if (items) {
					$array.each(items, (item) => {
						const itemObject = $type.isString(item) ? {
							id: item,
							label: item
						} : item;
						dropdownItems.push(itemObject);

						if ($type.isString(currentItem) && currentItem == itemObject.id) {
							currentItem = itemObject;
						}
					})
				}
				dropdown.set("items", dropdownItems);
				//console.log(this.className, this.isAccessible())
			}
		}
	}

	protected _dispose(): void {
		super._dispose();
	}

	protected _maybeMakeAccessible(): void {
		super._maybeMakeAccessible();
		if (this.isAccessible()) {
			const button = this.getPrivate("button")!;
			button.setAttribute("aria-label", button.getAttribute("title") + "; " + this._t("Press ENTER or use arrow keys to navigate"));

			if ($utils.supports("keyboardevents")) {
				this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
					if (document.activeElement == button) {
						if (ev.keyCode == 38 || ev.keyCode == 40) {
							// Open on arrows
							if (!this.get("active")) {
								this._handleClick();
							}
						}
					}
				}));
			}
		}
	}


}
